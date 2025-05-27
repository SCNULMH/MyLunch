// App.js
import React, { useEffect, useState, useCallback } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  useWindowDimensions,
  FlatList,
  Linking,
  ScrollView,
  KeyboardAvoidingView,
  Platform
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

// 환경 변수에서 API 키 불러오기
const { KAKAO_JS_KEY, REST_API_KEY } = Constants.expoConfig.extra;

const Tab = createBottomTabNavigator();

// 거리 계산 함수
const calcDistance = (lat1, lon1, lat2, lon2) => {
  const toRad = x => (x * Math.PI) / 180;
  const R = 6371000;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
};

export default function App() {
  const { height } = useWindowDimensions();
  const mapHeight = height * 0.35;

  const [myPosition, setMyPosition] = useState(null);
  const [radius, setRadius] = useState(2000);
  const [restaurants, setRestaurants] = useState([]);
  const [bookmarkSelection, setBookmarkSelection] = useState(null);
  const [count, setCount] = useState(0);
  const [excludedCategory, setExcludedCategory] = useState('');
  const [includedCategory, setIncludedCategory] = useState('');
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState('login');
  const [user, setUser] = useState(null);
  const [bookmarks, setBookmarks] = useState({});
  const [mapCenter, setMapCenter] = useState({ lat: 37.5665, lng: 126.9780 });
  const [noIncludedMessage, setNoIncludedMessage] = useState('');
  const [showBookmarks, setShowBookmarks] = useState(false);

  // 검색 관련 상태
  const [addressQuery, setAddressQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);

  const openLogin = () => { setAuthMode('login'); setAuthModalOpen(true); };
  const openSignup = () => { setAuthMode('signup'); setAuthModalOpen(true); };

  useEffect(() => { setShowBookmarks(false); }, []);
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, currentUser => {
      setUser(currentUser);
      setShowBookmarks(false);
      setBookmarkSelection(null);
      if (!currentUser) {
        setBookmarks({});
        return;
      }
      return subscribeBookmarks(currentUser.uid, data => setBookmarks({ ...data }));
    });
    return () => unsub();
  }, []);

  // 장소명/주소 검색
  const fetchAddressData = async (query) => {
    const addressUrl = `https://dapi.kakao.com/v2/local/search/address.json?query=${encodeURIComponent(query)}`;
    const keywordUrl = `https://dapi.kakao.com/v2/local/search/keyword.json?query=${encodeURIComponent(query)}&category_group_code=AT4`;
    try {
      const [addressResponse, keywordResponse] = await Promise.all([
        fetch(addressUrl, { headers: { Authorization: `KakaoAK ${REST_API_KEY}` } }),
        fetch(keywordUrl, { headers: { Authorization: `KakaoAK ${REST_API_KEY}` } }),
      ]);
      if (!addressResponse.ok || !keywordResponse.ok) {
        throw new Error('검색 실패');
      }
      const addressData = await addressResponse.json();
      const keywordData = await keywordResponse.json();
      const combinedResults = [
        ...(addressData.documents || []),
        ...(keywordData.documents || [])
      ];
      if (combinedResults.length === 0) {
        const fallbackKeywordUrl = `https://dapi.kakao.com/v2/local/search/keyword.json?query=${encodeURIComponent(query)}`;
        const fallbackResponse = await fetch(fallbackKeywordUrl, {
          headers: { Authorization: `KakaoAK ${REST_API_KEY}` },
        });
        if (fallbackResponse.ok) {
          const fallbackData = await fallbackResponse.json();
          setSearchResults(fallbackData.documents || []);
        } else {
          Alert.alert("검색 결과가 없습니다.");
        }
      } else {
        setSearchResults(combinedResults);
      }
    } catch (error) {
      Alert.alert("검색 중 오류가 발생했습니다.");
    }
  };

  // 검색 결과에서 주소/장소 선택
  const handleSelectAddress = (result) => {
    const lat = parseFloat(result.y);
    const lng = parseFloat(result.x);
    setAddressQuery(result.address_name || result.place_name || '');
    setMapCenter({ lat, lng });
    fetchNearby(lng, lat);
    setSearchResults([]);
  };

  // 근처 식당 검색
  const fetchNearby = async (x, y) => {
    let all = [];
    for (let page = 1; page <= 3; page++) {
      const res = await fetch(
        `https://dapi.kakao.com/v2/local/search/keyword.json?query=식당&x=${x}&y=${y}&radius=${radius}&page=${page}`,
        { headers: { Authorization: `KakaoAK ${REST_API_KEY}` } }
      );
      if (!res.ok) break;
      const js = await res.json();
      if (js.documents.length) {
        all.push(...js.documents);
        if (js.documents.length < 15) break;
      }
    }
    if (all.length) setRestaurants(all);
    else Alert.alert('근처에 식당이 없습니다.');
  };

  const handleLocation = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('위치 권한이 필요합니다.');
      return;
    }
    const loc = await Location.getCurrentPositionAsync({});
    const { latitude: lat, longitude: lng } = loc.coords;
    setMyPosition({ lat, lng });
    setMapCenter({ lat, lng });
    fetchNearby(lng, lat);
  };

  const handleSpin = useCallback(async () => {
    setNoIncludedMessage('');
    if (showBookmarks && user) {
      const list = Object.values(bookmarks);
      if (!list.length) {
        Alert.alert('북마크가 없습니다.');
        return;
      }
      const excl = excludedCategory.split(',').map(s => s.trim()).filter(Boolean);
      const incl = includedCategory.trim();
      let filtered = list.filter(r => {
        const isEx = excl.some(c => r.category_name.includes(c));
        const isIn = incl ? r.category_name.includes(incl) : true;
        return !isEx && isIn;
      });
      if (!filtered.length && incl) {
        setNoIncludedMessage(`${incl} 관련 음식점 없음. 전체에서 추천합니다.`);
        filtered = list;
      }
      const result = filtered.sort(() => 0.5 - Math.random()).slice(0, count || 5);
      setBookmarkSelection(result);
    } else {
      const { lng, lat } = mapCenter;
      let all = [];
      for (let page = 1; page <= 3; page++) {
        const res = await fetch(
          `https://dapi.kakao.com/v2/local/search/keyword.json?query=식당&x=${lng}&y=${lat}&radius=${radius}&page=${page}`,
          { headers: { Authorization: `KakaoAK ${REST_API_KEY}` } }
        );
        if (!res.ok) break;
        const js = await res.json();
        if (js.documents.length) {
          all.push(...js.documents);
          if (js.documents.length < 15) break;
        }
      }
      if (!all.length) {
        Alert.alert('근처에 식당이 없습니다.');
        return;
      }
      const excl = excludedCategory.split(',').map(s => s.trim()).filter(Boolean);
      const incl = includedCategory.trim();
      let filtered = all.filter(r => {
        const isEx = excl.some(c => r.category_name.includes(c));
        const isIn = incl ? r.category_name.includes(incl) : true;
        return !isEx && isIn;
      });
      if (!filtered.length && incl) {
        setNoIncludedMessage(`${incl} 관련 음식점 없음. 전체에서 추천합니다.`);
        filtered = all;
      }
      const result = filtered.sort(() => 0.5 - Math.random()).slice(0, count || 5);
      setRestaurants(result);
    }
  }, [
    showBookmarks, user, bookmarks, excludedCategory, includedCategory,
    count, mapCenter, radius
  ]);

  const toggleBookmark = (id, item) => {
    if (!user) {
      Alert.alert('로그인이 필요합니다.');
      return;
    }
    if (bookmarks[id]) {
      removeBookmark(user.uid, id);
      setBookmarks(prev => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    } else {
      addBookmark(user.uid, id, item);
      setBookmarks(prev => ({ ...prev, [id]: item }));
    }
    setBookmarkSelection(null);
  };

  const renderItem = ({ item }) => {
    const isBm = !!bookmarks[item.id];
    const dist = myPosition
      ? calcDistance(myPosition.lat, myPosition.lng, parseFloat(item.y), parseFloat(item.x))
      : item.distance;
    return (
      <View style={styles.cardContainer}>
        <View style={[styles.card, isBm && styles.bookmarked]}>
          <TouchableOpacity
            style={[styles.starBtn, isBm && styles.starActive]}
            onPress={() => toggleBookmark(item.id, item)}
          >
            <Ionicons name={isBm ? "star" : "star-outline"} size={20} color={isBm ? "#fff" : "#FFD600"} />
          </TouchableOpacity>
          <Text style={styles.restaurantTitle}>{item.place_name}</Text>
          <Text style={styles.restaurantMeta}>{item.road_address_name || item.address_name}</Text>
          <Text style={styles.restaurantMeta}>{item.category_name}</Text>
          {item.phone && <Text style={styles.restaurantMeta}>전화: {item.phone}</Text>}
          {dist != null && <Text style={styles.restaurantMeta}>거리: {dist}m</Text>}
          <TouchableOpacity
            style={styles.detailBtn}
            onPress={() => Linking.openURL(item.place_url)}
          >
            <Text style={styles.detailText}>상세보기</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  function ExploreScreen(props) {
    const [isListOpen, setIsListOpen] = useState(true);
    const displayData = showBookmarks && user
      ? (bookmarkSelection || Object.values(bookmarks))
      : restaurants;

    return (
      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1 }}
        >
          <ScrollView
            style={{ flexGrow: 0 }}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingBottom: 8 }}
          >
            {/* 헤더/로그인/모드 토글 */}
            <View style={styles.header}>
              <Text style={styles.headerTitle}>오늘 뭐 먹지?</Text>
              {user ? (
                <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                  <Text style={styles.welcomeMsg}>{user.displayName}님 환영!</Text>
                  <TouchableOpacity style={styles.authButton} onPress={() => signOut(auth)}>
                    <Text style={{ color: '#fff' }}>로그아웃</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={{ flexDirection: 'row' }}>
                  <TouchableOpacity style={styles.authButton} onPress={openLogin}>
                    <Text style={{ color: '#fff' }}>로그인</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.authButton} onPress={openSignup}>
                    <Text style={{ color: '#fff' }}>회원가입</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
            {user && (
              <View style={styles.toggleContainer}>
                <TouchableOpacity
                  style={[styles.toggleBtn, !showBookmarks && styles.toggleActive]}
                  onPress={() => { setShowBookmarks(false); setBookmarkSelection(null); }}
                >
                  <Text style={[styles.toggleText, !showBookmarks && styles.toggleTextActive]}>일반 모드</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.toggleBtn, showBookmarks && styles.toggleActive]}
                  onPress={() => { setShowBookmarks(true); setBookmarkSelection(null); }}
                >
                  <Text style={[styles.toggleText, showBookmarks && styles.toggleTextActive]}>북마크 모드</Text>
                </TouchableOpacity>
              </View>
            )}
            {/* 검색창 및 결과 리스트 */}
            <View style={{ padding: 8 }}>
              <TextInput
                style={styles.inputText}
                placeholder="주소 또는 건물명 입력"
                value={addressQuery}
                onChangeText={setAddressQuery}
                onSubmitEditing={() => fetchAddressData(addressQuery)}
                returnKeyType="search"
                autoCorrect={false}
                autoCapitalize="none"
                blurOnSubmit={false}
              />
              <TouchableOpacity style={styles.commonButton} onPress={() => fetchAddressData(addressQuery)}>
                <Text style={{ color: '#fff' }}>검색</Text>
              </TouchableOpacity>
              {searchResults.length > 0 && (
                <ScrollView style={{ maxHeight: 180, backgroundColor: '#f7f7f7', marginVertical: 8 }}>
                  {searchResults.map((result, idx) => (
                    <TouchableOpacity
                      key={idx}
                      style={{ padding: 10, borderBottomWidth: 1, borderColor: '#eee' }}
                      onPress={() => handleSelectAddress(result)}
                    >
                      <Text>
                        {result.address_name || result.place_name}
                        {result.place_name && result.address_name ? ` (${result.place_name})` : ''}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}
            </View>
            {/* 검색 · 필터 · 랜덤 · 반경 */}
            <View style={{ padding: 16 }}>
              <TouchableOpacity style={styles.commonButton} onPress={handleLocation}>
                <Text style={{ color: '#fff', fontWeight: 'bold' }}>현위치 검색</Text>
              </TouchableOpacity>
              <TextInput
                style={styles.inputText}
                placeholder="반경(m)"
                keyboardType="numeric"
                value={radius.toString()}
                onChangeText={t => setRadius(Number(t) || radius)}
              />
              <TextInput
                style={styles.inputText}
                placeholder="추천 개수"
                keyboardType="numeric"
                value={count.toString()}
                onChangeText={t => setCount(Number(t) || 0)}
              />
              <TextInput
                style={styles.inputText}
                placeholder="포함 카테고리(예: 한식)"
                value={includedCategory}
                onChangeText={setIncludedCategory}
              />
              <TextInput
                style={styles.inputText}
                placeholder="제외 카테고리(쉼표로 구분)"
                value={excludedCategory}
                onChangeText={setExcludedCategory}
              />
              <TouchableOpacity style={styles.randomButton} onPress={handleSpin}>
                <Text style={{ color: '#fff', fontWeight: 'bold' }}>랜덤 추천</Text>
              </TouchableOpacity>
              {noIncludedMessage ? (
                <Text style={styles.resultMessage}>{noIncludedMessage}</Text>
              ) : null}
              {/* 지도 */}
              <View style={{ width: '100%', height: mapHeight }}>
                <MapComponent
                  style={{ width: '100%', height: '100%' }}
                  mapCenter={mapCenter}
                  restaurants={displayData}
                  radius={radius}
                  myPosition={myPosition}
                  bookmarks={bookmarks}
                />
              </View>
            </View>
          </ScrollView>

          {/* 접기/펼치기 버튼 */}
          <TouchableOpacity
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: 40,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'rgba(255,255,255,0.9)',
              zIndex: 10,
            }}
            onPress={() => setIsListOpen(prev => !prev)}
          >
            <Text style={{ fontSize: 16, fontWeight: '600' }}>
              {isListOpen ? ' ▼ 접기' : ' ▲ 펼치기'}
            </Text>
          </TouchableOpacity>

          {/* 식당 리스트 */}
          {isListOpen && (
            <FlatList
              data={displayData}
              keyExtractor={i => String(i.id)}
              numColumns={2}
              contentContainerStyle={{ padding: 8 }}
              renderItem={renderItem}
              keyboardShouldPersistTaps="handled"
            />
          )}
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  function SavedScreen(props) {
    const displayData = bookmarkSelection || Object.values(bookmarks);
    return (
      <SafeAreaView style={{ flex: 1 }}>
        <FlatList
          data={displayData}
          keyExtractor={i => String(i.id)}
          numColumns={2}
          contentContainerStyle={{ padding: 8 }}
          ListHeaderComponent={() => (
            <View style={styles.header}>
              <Text style={styles.headerTitle}>북마크</Text>
            </View>
          )}
          renderItem={renderItem}
          ListEmptyComponent={() => (
            <Text style={styles.resultMessage}>북마크한 식당이 없습니다.</Text>
          )}
        />
      </SafeAreaView>
    );
  }

  function ProfileScreen(props) {
    return (
      <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        {user ? (
          <>
            <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 16 }}>
              {user.displayName}님
            </Text>
            <TouchableOpacity style={styles.authButton} onPress={() => signOut(auth)}>
              <Text style={{ color: '#fff' }}>로그아웃</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <TouchableOpacity style={styles.authButton} onPress={openLogin}>
              <Text style={{ color: '#fff' }}>로그인</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.authButton} onPress={openSignup}>
              <Text style={{ color: '#fff' }}>회원가입</Text>
            </TouchableOpacity>
          </>
        )}
      </SafeAreaView>
    );
  }

  return (
    <>
      <NavigationContainer>
        <Tab.Navigator
          screenOptions={({ route }) => ({
            tabBarIcon: ({ color, size }) => {
              if (route.name === 'Explore')
                return <Ionicons name="search" size={size} color={color} />;
              if (route.name === 'Saved')
                return <Ionicons name="bookmark" size={size} color={color} />;
              if (route.name === 'Profile')
                return <Ionicons name="person" size={size} color={color} />;
              return null;
            },
            tabBarActiveTintColor: '#388E3C',
            tabBarInactiveTintColor: '#888',
            headerShown: false,
          })}
        >
          <Tab.Screen name="Explore">{() => <ExploreScreen />}</Tab.Screen>
          <Tab.Screen name="Saved">{() => <SavedScreen />}</Tab.Screen>
          <Tab.Screen name="Profile">{() => <ProfileScreen />}</Tab.Screen>
        </Tab.Navigator>
      </NavigationContainer>
      <AuthModal
        mode={authMode}
        open={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
      />
    </>
  );
}
