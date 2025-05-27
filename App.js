// App.js
import React, { useEffect, useState, useCallback } from 'react';
import {
  SafeAreaView, View, Text, TextInput, TouchableOpacity,
  Alert, useWindowDimensions, FlatList, Linking,
  ScrollView, KeyboardAvoidingView, Platform, StyleSheet
} from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import * as Location from 'expo-location';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from './firebase';
import MapComponent from './components/MapComponent';
import AuthModal from './components/AuthModal';
import { subscribeBookmarks, addBookmark, removeBookmark } from './services/bookmark';
import { styles } from './styles/styles_native';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';

const { REST_API_KEY } = Constants.expoConfig.extra;
const Tab = createBottomTabNavigator();

function calcDistance(lat1, lon1, lat2, lon2) {
  const toRad = x => (x * Math.PI) / 180;
  const R = 6371000;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat/2)**2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon/2)**2;
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)));
}

//////////////////////////////////////
// ExploreScreen
//////////////////////////////////////
function ExploreScreen({
  user, bookmarks, toggleBookmark,
  openLogin, openSignup,
  mapCenter, setMapCenter,
  myPosition, setMyPosition,
  restaurants, setRestaurants,
  radius, setRadius,
  count, setCount,
  excludedCategory, setExcludedCategory,
  includedCategory, setIncludedCategory,
  searchResults, setSearchResults,
  noMessage, setNoMessage,
  showBookmarks, setShowBookmarks,
}) {
  const { height } = useWindowDimensions();
  const mapHeight = height * 0.35;

  const [addressQuery, setAddressQuery] = useState('');
  const [isListOpen, setIsListOpen] = useState(false);

  // 1) 주소/키워드 검색
  const fetchAddressData = async q => {
    try {
      const addrUrl = `https://dapi.kakao.com/v2/local/search/address.json?query=${encodeURIComponent(q)}`;
      const keyUrl  = `https://dapi.kakao.com/v2/local/search/keyword.json?query=${encodeURIComponent(q)}&category_group_code=AT4`;
      const [aR, kR] = await Promise.all([
        fetch(addrUrl, { headers:{ Authorization:`KakaoAK ${REST_API_KEY}` }}),
        fetch(keyUrl, { headers:{ Authorization:`KakaoAK ${REST_API_KEY}` }})
      ]);
      if (!aR.ok || !kR.ok) throw new Error();
      const aJ = await aR.json(), kJ = await kR.json();
      const combo = [...(aJ.documents||[]), ...(kJ.documents||[])];
      if (combo.length) setSearchResults(combo);
      else {
        const fb = await fetch(
          `https://dapi.kakao.com/v2/local/search/keyword.json?query=${encodeURIComponent(q)}`,
          { headers:{ Authorization:`KakaoAK ${REST_API_KEY}` }}
        );
        const fbJ = await fb.json();
        setSearchResults(fbJ.documents||[]);
      }
    } catch {
      Alert.alert('검색 중 오류가 발생했습니다.');
    }
  };
  const handleSelectAddress = r => {
    const lat = parseFloat(r.y), lng = parseFloat(r.x);
    setMapCenter({ lat, lng });
    fetchNearby(lng, lat);
    setSearchResults([]);
    setAddressQuery(r.address_name||r.place_name||'');
  };

  // 2) 근처 식당 검색
  const fetchNearby = async (x,y) => {
    let all = [];
    for (let p=1; p<=3; p++){
      const res = await fetch(
        `https://dapi.kakao.com/v2/local/search/keyword.json?query=식당&x=${x}&y=${y}&radius=${radius}&page=${p}`,
        { headers:{ Authorization:`KakaoAK ${REST_API_KEY}` }}
      );
      if (!res.ok) break;
      const js = await res.json();
      all.push(...js.documents);
      if (js.documents.length<15) break;
    }
    if (all.length) setRestaurants(all);
    else Alert.alert('근처에 식당이 없습니다.');
  };

  // 3) 현위치 검색
  const handleLocation = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status!=='granted') {
      Alert.alert('위치 권한이 필요합니다.');
      return;
    }
    const loc = await Location.getCurrentPositionAsync({});
    const { latitude:lat, longitude:lng } = loc.coords;
    setMyPosition({ lat,lng });
    setMapCenter({ lat,lng });
    fetchNearby(lng,lat);
  };

  // 4) 랜덤 추천 (검색된 리스트에만)
  const handleSpin = useCallback(()=>{
    setNoMessage('');
    if (!restaurants.length) return Alert.alert('먼저 식당을 검색해주세요.');
    let f = restaurants.slice();
    const excl = excludedCategory.split(',').map(s=>s.trim()).filter(Boolean);
    const incl = includedCategory.trim();
    f = f.filter(r=>{
      const bad = excl.some(c=>r.category_name.includes(c));
      const ok  = incl? r.category_name.includes(incl): true;
      return !bad && ok;
    });
    if (!f.length && incl) {
      setNoMessage(`${incl} 관련 음식점 없음. 전체에서 추천합니다.`);
      f = restaurants.slice();
    }
    setRestaurants(f.sort(()=>0.5-Math.random()).slice(0,count));
  },[restaurants,excludedCategory,includedCategory,count]);

  // 5) 카드 렌더러
  const renderRestaurantItem = ({ item }) => {
    const isBm = !!bookmarks[item.id];
    const dist = myPosition
      ? calcDistance(myPosition.lat,myPosition.lng,parseFloat(item.y),parseFloat(item.x))
      : item.distance;
    return (
      <View style={styles.cardContainer}>
        <View style={[styles.card, isBm&&styles.bookmarked]}>
          <TouchableOpacity
            style={[styles.starBtn, isBm&&styles.starActive]}
            onPress={()=>toggleBookmark(item.id,item)}
          >
            <Ionicons name={isBm?'star':'star-outline'} size={20} color={isBm?'#fff':'#FFD600'} />
          </TouchableOpacity>
          <Text style={styles.restaurantTitle}>{item.place_name}</Text>
          <Text style={styles.restaurantMeta}>{item.road_address_name||item.address_name}</Text>
          <Text style={styles.restaurantMeta}>{item.category_name}</Text>
          {item.phone && <Text style={styles.restaurantMeta}>전화: {item.phone}</Text>}
          {dist!=null && <Text style={styles.restaurantMeta}>거리: {dist}m</Text>}
          <TouchableOpacity style={styles.detailBtn} onPress={()=>Linking.openURL(item.place_url)}>
            <Text style={styles.detailText}>상세보기</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // 범위 내 북마크만
  const inRange = Object.values(bookmarks).filter(r=>{
    if (!myPosition) return false;
    const d = calcDistance(mapCenter.lat,mapCenter.lng,parseFloat(r.y),parseFloat(r.x));
    return d <= radius;
  });

  const data = showBookmarks&&user ? inRange : restaurants;

  // 리스트 열기 전/범위 내 가이드
  let emptyMsg = '';
  if (isListOpen) {
    if (showBookmarks) {
      if (!myPosition) emptyMsg = '먼저 위치를 설정해주세요.';
      else if (!inRange.length) emptyMsg = '범위 내 북마크한 식당이 없습니다.';
    } else {
      if (!restaurants.length) emptyMsg = '먼저 검색하거나 현위치를 설정해주세요.';
    }
  }

  return (
    <SafeAreaView style={{flex:1}}>
      <KeyboardAvoidingView behavior={Platform.OS==='ios'?'padding':undefined} style={{flex:1}}>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{paddingBottom:8}} style={{flex:1}}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>오늘 뭐 먹지?</Text>
            {user && (
              <View style={{flexDirection:'row',flexWrap:'wrap'}}>
                <Text style={styles.welcomeMsg}>{user.displayName}님 환영!</Text>
                <TouchableOpacity style={styles.authButton} onPress={()=>signOut(auth)}>
                  <Text style={{color:'#fff'}}>로그아웃</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
          {user && (
            <View style={styles.toggleContainer}>
              <TouchableOpacity style={[styles.toggleBtn,!showBookmarks&&styles.toggleActive]} onPress={()=>setShowBookmarks(false)}>
                <Text style={[styles.toggleText,!showBookmarks&&styles.toggleTextActive]}>일반 모드</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.toggleBtn,showBookmarks&&styles.toggleActive]} onPress={()=>setShowBookmarks(true)}>
                <Text style={[styles.toggleText,showBookmarks&&styles.toggleTextActive]}>북마크 모드</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* 검색창 */}
          <View style={{padding:8}}>
            <TextInput
              style={styles.inputText}
              placeholder="주소 또는 건물명 입력"
              value={addressQuery}
              onChangeText={setAddressQuery}
              onSubmitEditing={()=>fetchAddressData(addressQuery)}
              returnKeyType="search"
              blurOnSubmit={false}
            />
            <TouchableOpacity style={styles.commonButton} onPress={()=>fetchAddressData(addressQuery)}>
              <Text style={{color:'#fff'}}>검색</Text>
            </TouchableOpacity>
            {searchResults.length>0 && (
              <ScrollView style={{maxHeight:180,backgroundColor:'#f7f7f7',marginVertical:8}}>
                {searchResults.map((r,i)=>(
                  <TouchableOpacity key={i} style={{padding:10,borderBottomWidth:1,borderColor:'#eee'}} onPress={()=>handleSelectAddress(r)}>
                    <Text>
                      {r.address_name||r.place_name}
                      {r.place_name&&r.address_name?` (${r.place_name})`:''}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </View>

          {/* 필터·랜덤·반경 */}
          <View style={{padding:16}}>
            <TouchableOpacity style={styles.commonButton} onPress={handleLocation}>
              <Text style={{color:'#fff',fontWeight:'bold'}}>현위치 검색</Text>
            </TouchableOpacity>
            <TextInput
              style={styles.inputText}
              placeholder="반경(m)"
              keyboardType="numeric"
              value={radius.toString()}
              onChangeText={t=>setRadius(Number(t)||radius)}
            />
            <TextInput
              style={styles.inputText}
              placeholder="추천 개수"
              keyboardType="numeric"
              value={count.toString()}
              onChangeText={t=>setCount(Number(t)||5)}
            />
            <TextInput
              style={styles.inputText}
              placeholder="포함 카테고리"
              value={includedCategory}
              onChangeText={setIncludedCategory}
            />
            <TextInput
              style={styles.inputText}
              placeholder="제외 카테고리"
              value={excludedCategory}
              onChangeText={setExcludedCategory}
            />
            <TouchableOpacity style={styles.randomButton} onPress={handleSpin}>
              <Text style={{color:'#fff',fontWeight:'bold'}}>랜덤 추천</Text>
            </TouchableOpacity>
            {!!noMessage && <Text style={styles.resultMessage}>{noMessage}</Text>}
            <View style={{width:'100%',height:mapHeight}}>
              <MapComponent
                style={{width:'100%',height:'100%'}}
                mapCenter={mapCenter}
                restaurants={data}
                radius={radius}
                myPosition={myPosition}
                bookmarks={bookmarks}
              />
            </View>
          </View>
        </ScrollView>

        <TouchableOpacity style={localStyles.toggleWrapper} onPress={()=>setIsListOpen(v=>!v)}>
          <Text style={localStyles.toggleText}>{isListOpen?'▲ 접기':'▼ 펼치기'}</Text>
        </TouchableOpacity>

        {isListOpen && (
          emptyMsg
            ? <View style={{padding:16,alignItems:'center'}}><Text>{emptyMsg}</Text></View>
            : <FlatList
                data={data}
                keyExtractor={i=>String(i.id)}
                numColumns={2}
                contentContainerStyle={{padding:8}}
                renderItem={renderRestaurantItem}
                keyboardShouldPersistTaps="handled"
              />
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

//////////////////////////////////////
// SavedScreen
//////////////////////////////////////
function SavedScreen({ bookmarks, toggleBookmark }) {
  const displayData = Object.values(bookmarks);
  return (
    <SafeAreaView style={{flex:1}}>
      <FlatList
        data={displayData}
        keyExtractor={i=>String(i.id)}
        numColumns={2}
        contentContainerStyle={{padding:8}}
        ListHeaderComponent={()=>(
          <View style={styles.header}><Text style={styles.headerTitle}>북마크</Text></View>
        )}
        renderItem={({item})=>(
          <View style={styles.cardContainer}>
            <View style={[styles.card,styles.bookmarked]}>
              <TouchableOpacity style={[styles.starBtn,styles.starActive]}
                onPress={()=>toggleBookmark(item.id,item)}
              >
                <Ionicons name="star" size={20} color="#fff"/>
              </TouchableOpacity>
              <Text style={styles.restaurantTitle}>{item.place_name}</Text>
              <Text style={styles.restaurantMeta}>{item.road_address_name||item.address_name}</Text>
              <Text style={styles.restaurantMeta}>{item.category_name}</Text>
              {item.phone&&<Text style={styles.restaurantMeta}>전화: {item.phone}</Text>}
              <TouchableOpacity style={styles.detailBtn} onPress={()=>Linking.openURL(item.place_url)}>
                <Text style={styles.detailText}>상세보기</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        ListEmptyComponent={()=>(
          <Text style={styles.resultMessage}>북마크한 식당이 없습니다.</Text>
        )}
      />
    </SafeAreaView>
  );
}

//////////////////////////////////////
// ProfileScreen
//////////////////////////////////////
function ProfileScreen({ user, openLogin, openSignup }) {
  return (
    <SafeAreaView style={{flex:1,justifyContent:'center',alignItems:'center'}}>
      {user
        ? <>
            <Text style={{fontSize:20,fontWeight:'bold',marginBottom:16}}>
              {user.displayName}님
            </Text>
            <TouchableOpacity style={styles.authButton} onPress={()=>signOut(auth)}>
              <Text style={{color:'#fff'}}>로그아웃</Text>
            </TouchableOpacity>
          </>
        : <>
            <TouchableOpacity style={styles.authButton} onPress={openLogin}>
              <Text style={{color:'#fff'}}>로그인</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.authButton} onPress={openSignup}>
              <Text style={{color:'#fff'}}>회원가입</Text>
            </TouchableOpacity>
          </>
      }
    </SafeAreaView>
  );
}

//////////////////////////////////////
// App 컴포넌트
//////////////////////////////////////
export default function App() {
  const [user, setUser] = useState(null);
  const [bookmarks, setBookmarks] = useState({});

  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState('login');
  const openLogin = () => { setAuthMode('login'); setAuthModalOpen(true); };
  const openSignup = () => { setAuthMode('signup'); setAuthModalOpen(true); };
  const closeAuth = () => setAuthModalOpen(false);

  useEffect(()=>{
    const unsub = onAuthStateChanged(auth, u=>{
      setUser(u);
      if(!u) setBookmarks({});
      else subscribeBookmarks(u.uid, data=>setBookmarks({...data}));
    });
    return()=>unsub();
  },[]);

  const toggleBookmark=(id,item)=>{
    if(!user) return Alert.alert('로그인이 필요합니다.');
    if(bookmarks[id]){
      removeBookmark(user.uid,id);
      setBookmarks(p=>{const n={...p};delete n[id];return n;});
    } else {
      addBookmark(user.uid,id,item);
      setBookmarks(p=>({...p,[id]:item}));
    }
  };

  // ExploreScreen 상태
  const [myPosition, setMyPosition] = useState(null);
  const [radius, setRadius] = useState(2000);
  const [restaurants, setRestaurants] = useState([]);
  const [count, setCount] = useState(5);
  const [excludedCategory, setExcludedCategory] = useState('');
  const [includedCategory, setIncludedCategory] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [noMessage, setNoMessage] = useState('');
  const [showBookmarks, setShowBookmarks] = useState(false);
  const [mapCenter, setMapCenter] = useState({lat:37.5665,lng:126.9780});

  return (
    <>
      <NavigationContainer>
        <Tab.Navigator screenOptions={({route})=>({
            tabBarIcon:({color,size})=>{
              if(route.name==='Explore') return <Ionicons name="search" size={size} color={color}/>;
              if(route.name==='Saved')   return <Ionicons name="bookmark" size={size} color={color}/>;
              if(route.name==='Profile') return <Ionicons name="person" size={size} color={color}/>;
            },
            tabBarActiveTintColor:'#388E3C',tabBarInactiveTintColor:'#888',headerShown:false
        })}>
          <Tab.Screen name="Explore">
            {()=><ExploreScreen
              user={user} bookmarks={bookmarks} toggleBookmark={toggleBookmark}
              openLogin={openLogin} openSignup={openSignup}
              mapCenter={mapCenter} setMapCenter={setMapCenter}
              myPosition={myPosition} setMyPosition={setMyPosition}
              restaurants={restaurants} setRestaurants={setRestaurants}
              radius={radius} setRadius={setRadius}
              count={count} setCount={setCount}
              excludedCategory={excludedCategory} setExcludedCategory={setExcludedCategory}
              includedCategory={includedCategory} setIncludedCategory={setIncludedCategory}
              searchResults={searchResults} setSearchResults={setSearchResults}
              noMessage={noMessage} setNoMessage={setNoMessage}
              showBookmarks={showBookmarks} setShowBookmarks={setShowBookmarks}
            />}
          </Tab.Screen>
          <Tab.Screen name="Saved">
            {()=><SavedScreen bookmarks={bookmarks} toggleBookmark={toggleBookmark}/>}
          </Tab.Screen>
          <Tab.Screen name="Profile">
            {()=><ProfileScreen user={user} openLogin={openLogin} openSignup={openSignup}/>}
          </Tab.Screen>
        </Tab.Navigator>
      </NavigationContainer>

      <AuthModal mode={authMode} open={authModalOpen} onClose={closeAuth}/>
    </>
  );
}

const localStyles = StyleSheet.create({
  toggleWrapper:{position:'absolute',bottom:0,left:0,right:0,height:40,
    alignItems:'center',justifyContent:'center',backgroundColor:'rgba(255,255,255,0.9)',zIndex:10},
  toggleText:{fontSize:16,fontWeight:'600'}
});
