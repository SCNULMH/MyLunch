// App.js

import React, { useEffect, useState } from 'react';
import { SafeAreaView, View, Text, TextInput, TouchableOpacity, Alert, useWindowDimensions, FlatList, Linking } from 'react-native';
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

const Tab = createBottomTabNavigator();

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

const REST_API_KEY = '25d26859dae2a8cb671074b910e16912';

function ExploreScreen(props) {
  const {
    user, bookmarks, setBookmarks, myPosition, setMyPosition, mapCenter, setMapCenter,
    radius, setRadius, count, setCount, includedCategory, setIncludedCategory, excludedCategory, setExcludedCategory,
    restaurants, setRestaurants, noIncludedMessage, setNoIncludedMessage, handleLocation, handleSpin,
    showBookmarks, setShowBookmarks, bookmarkSelection, setBookmarkSelection, toggleBookmark, renderItem, mapHeight,
    openLogin, openSignup
  } = props;

  const displayData = showBookmarks && user
    ? (bookmarkSelection || Object.values(bookmarks))
    : restaurants;

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <FlatList
        data={displayData}
        keyExtractor={i => String(i.id)}
        numColumns={2}
        contentContainerStyle={{ padding: 8 }}
        ListHeaderComponent={() => (
          <>
            {/* 헤더 */}
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
            {/* 모드 토글 */}
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
          </>
        )}
        renderItem={renderItem}
      />
    </SafeAreaView>
  );
}

function SavedScreen(props) {
  const { user, bookmarks, bookmarkSelection, setBookmarkSelection, toggleBookmark, renderItem } = props;
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
  const { user, signOut, openLogin, openSignup } = props;
  return (
    <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      {user ? (
        <>
          <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 16 }}>{user.displayName}님</Text>
          <TouchableOpacity style={styles.authButton} onPress={signOut}>
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

  const handleSpin = () => {
    setNoIncludedMessage('');
    const list = showBookmarks && user ? Object.values(bookmarks) : restaurants;
    if (!list.length) {
      Alert.alert(showBookmarks ? '북마크가 없습니다.' : '식당이 없습니다.');
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
    if (showBookmarks && user) setBookmarkSelection(result);
    else setRestaurants(result);
  };

  // 변경된 toggleBookmark: 로컬 상태를 즉시 업데이트하도록 optimistic update 추가
  const toggleBookmark = (id, item) => {
    if (!user) {
      Alert.alert('로그인이 필요합니다.');
      return;
    }
    if (bookmarks[id]) {
      // Firestore에서 삭제 요청
      removeBookmark(user.uid, id);
      // 로컬에서도 바로 반영
      setBookmarks(prev => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    } else {
      // Firestore에 추가 요청
      addBookmark(user.uid, id, item);
      // 로컬에서도 바로 반영
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

  return (
    <>
      <NavigationContainer>
        <Tab.Navigator
          screenOptions={({ route }) => ({
            tabBarIcon: ({ color, size }) => {
              if (route.name === 'Explore') return <Ionicons name="search" size={size} color={color} />;
              if (route.name === 'Saved') return <Ionicons name="bookmark" size={size} color={color} />;
              if (route.name === 'Profile') return <Ionicons name="person" size={size} color={color} />;
              return null;
            },
            tabBarActiveTintColor: '#388E3C',
            tabBarInactiveTintColor: '#888',
            headerShown: false,
          })}
        >
          <Tab.Screen name="Explore">
            {() => (
              <ExploreScreen
                user={user}
                bookmarks={bookmarks}
                setBookmarks={setBookmarks}
                myPosition={myPosition}
                setMyPosition={setMyPosition}
                mapCenter={mapCenter}
                setMapCenter={setMapCenter}
                radius={radius}
                setRadius={setRadius}
                count={count}
                setCount={setCount}
                includedCategory={includedCategory}
                setIncludedCategory={setIncludedCategory}
                excludedCategory={excludedCategory}
                setExcludedCategory={setExcludedCategory}
                restaurants={restaurants}
                setRestaurants={setRestaurants}
                noIncludedMessage={noIncludedMessage}
                setNoIncludedMessage={setNoIncludedMessage}
                handleLocation={handleLocation}
                handleSpin={handleSpin}
                showBookmarks={showBookmarks}
                setShowBookmarks={setShowBookmarks}
                bookmarkSelection={bookmarkSelection}
                setBookmarkSelection={setBookmarkSelection}
                toggleBookmark={toggleBookmark}
                renderItem={renderItem}
                mapHeight={mapHeight}
                openLogin={openLogin}
                openSignup={openSignup}
              />
            )}
          </Tab.Screen>
          <Tab.Screen name="Saved">
            {() => (
              <SavedScreen
                user={user}
                bookmarks={bookmarks}
                bookmarkSelection={bookmarkSelection}
                setBookmarkSelection={setBookmarkSelection}
                toggleBookmark={toggleBookmark}
                renderItem={renderItem}
              />
            )}
          </Tab.Screen>
          <Tab.Screen name="Profile">
            {() => (
              <ProfileScreen
                user={user}
                signOut={() => signOut(auth)}
                openLogin={openLogin}
                openSignup={openSignup}
              />
            )}
          </Tab.Screen>
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
