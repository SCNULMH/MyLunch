import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import * as Location from 'expo-location';
import MapComponent from './components/MapComponent';
import RestaurantList from './components/RestaurantList';
import RadiusInput from './components/RadiusInput';
import AuthModal from './components/AuthModal';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from './firebase';
import { subscribeBookmarks, addBookmark, removeBookmark } from './services/bookmark';
import { styles } from './styles/styles_native';

const App = () => {
  const [myPosition, setMyPosition] = useState(null);
  const [radius, setRadius] = useState(2000);
  const [restaurants, setRestaurants] = useState([]);
  const [count, setCount] = useState(0);
  const [excludedCategory, setExcludedCategory] = useState('');
  const [includedCategory, setIncludedCategory] = useState('');
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState('login');
  const [user, setUser] = useState(null);
  const [bookmarks, setBookmarks] = useState({});
  const [isBookmarkMode, setIsBookmarkMode] = useState(false);
  const [bookmarkRandomSelection, setBookmarkRandomSelection] = useState(null);
  const [mapCenter, setMapCenter] = useState({ lat: 37.5665, lng: 126.9780 });
  const [noIncludedMessage, setNoIncludedMessage] = useState("");

  const REST_API_KEY = '25d26859dae2a8cb671074b910e16912';

  // Firebase Auth 및 북마크 구독
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (!currentUser) return setBookmarks({});
      const unsubscribeBookmarks = subscribeBookmarks(currentUser.uid, (data) => {
        setBookmarks({ ...data });
      });
      return unsubscribeBookmarks;
    });
    return () => unsubscribeAuth();
  }, []);

  const toggleBookmark = (id, item) => {
    if (!user) return Alert.alert('로그인이 필요합니다.');
    if (bookmarks[id]) removeBookmark(user.uid, id);
    else addBookmark(user.uid, id, item);
    setBookmarkRandomSelection(null);
  };

  // 위치 기반 식당 조회
  const fetchNearbyRestaurants = async (x, y) => {
    let all = [];
    for (let page = 1; page <= 3; page++) {
      const url = `https://dapi.kakao.com/v2/local/search/keyword.json?query=식당&x=${x}&y=${y}&radius=${radius}&page=${page}`;
      const res = await fetch(url, { headers: { Authorization: `KakaoAK ${REST_API_KEY}` } });
      if (!res.ok) break;
      const data = await res.json();
      if (data.documents?.length) {
        all = [...all, ...data.documents];
        if (data.documents.length < 15) break;
      }
    }
    if (!all.length) return Alert.alert('근처에 식당이 없습니다.');
    setRestaurants(all);
  };

  const handleLocationClick = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') return Alert.alert('위치 권한이 필요합니다.');
    const loc = await Location.getCurrentPositionAsync({});
    const { latitude: lat, longitude: lng } = loc.coords;
    setMapCenter({ lat, lng });
    setMyPosition({ lat, lng });
    fetchNearbyRestaurants(lng, lat);
  };

  const handleSpin = () => {
    const dataList = isBookmarkMode ? Object.values(bookmarks) : restaurants;
    if (!dataList.length) return Alert.alert(isBookmarkMode ? '북마크가 없습니다.' : '식당이 없습니다.');
    const excluded = excludedCategory.split(',').map(c => c.trim()).filter(Boolean);
    const included = includedCategory.trim();
    const filtered = dataList.filter(r => {
      const isExcluded = excluded.some(cat => r.category_name.includes(cat));
      const isIncluded = included ? r.category_name.includes(included) : true;
      return !isExcluded && isIncluded;
    });
    if (!filtered.length && included) setNoIncludedMessage(`${included} 관련 음식점 없음. 전체에서 추천합니다.`);
    const finalList = filtered.length ? filtered : dataList.filter(r => !excluded.some(cat => r.category_name.includes(cat)));
    const result = finalList.sort(() => 0.5 - Math.random()).slice(0, count || 5);
    if (isBookmarkMode) setBookmarkRandomSelection(result);
    else setRestaurants(result);
  };

  const displayRestaurants = isBookmarkMode ? (bookmarkRandomSelection || Object.values(bookmarks)) : restaurants;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>오늘 뭐 먹지?</Text>
        {user ? (
          <View style={{ flexDirection: 'row' }}>
            <Text style={styles.welcomeMsg}>환영합니다 {user.displayName}님!</Text>
            <TouchableOpacity style={styles.authButton} onPress={() => setIsBookmarkMode(!isBookmarkMode)}>
              <Text>{isBookmarkMode ? '일반 모드' : '북마크 모드'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.logoutBtn} onPress={() => signOut(auth)}>
              <Text>로그아웃</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={{ flexDirection: 'row' }}>
            <TouchableOpacity style={styles.authButton} onPress={() => { setAuthMode('login'); setAuthModalOpen(true); }}>
              <Text>로그인</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.authButton} onPress={() => { setAuthMode('signup'); setAuthModalOpen(true); }}>
              <Text>회원가입</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <TouchableOpacity style={styles.commonButton} onPress={handleLocationClick}>
        <Text>현위치로 검색</Text>
      </TouchableOpacity>

      <RadiusInput setRadius={setRadius} />

      <TextInput
        style={styles.inputText}
        placeholder="추천 개수"
        keyboardType="numeric"
        value={count.toString()}
        onChangeText={text => setCount(Number(text) || 0)}
      />

      <TextInput
        style={styles.inputText}
        placeholder="추천할 카테고리 (예: 한식)"
        value={includedCategory}
        onChangeText={setIncludedCategory}
      />

      <TextInput
        style={styles.inputText}
        placeholder="제외할 카테고리 (쉼표로 구분)"
        value={excludedCategory}
        onChangeText={setExcludedCategory}
      />

      <TouchableOpacity style={styles.randomButton} onPress={handleSpin}>
        <Text>랜덤 추천</Text>
      </TouchableOpacity>

      {noIncludedMessage && <Text style={styles.resultMessage}>{noIncludedMessage}</Text>}

      <MapComponent
        mapCenter={mapCenter}
        myPosition={myPosition}
        radius={radius}
        restaurants={displayRestaurants}
        bookmarks={bookmarks}
      />

      <RestaurantList
        restaurants={displayRestaurants}
        onSelect={() => {} }
        bookmarks={bookmarks}
        toggleBookmark={toggleBookmark}
      />

      <AuthModal
        mode={authMode}
        open={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
      />
    </ScrollView>
  );
};

export default App;
