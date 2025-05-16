import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, Alert, ScrollView, StyleSheet } from 'react-native';
import * as Location from 'expo-location';
import MapComponent from './components/MapComponent';
import RestaurantList from './components/RestaurantList';
import RadiusInput from './components/RadiusInput';
import AuthModal from './components/AuthModal';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from './firebase';
import { subscribeBookmarks, addBookmark, removeBookmark } from './services/bookmark';

const App = () => {
  const [myPosition, setMyPosition] = useState(null);
  const [radius, setRadius] = useState(2000);
  const [address, setAddress] = useState('');
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
    if (bookmarks[id]) {
      removeBookmark(user.uid, id);
    } else {
      addBookmark(user.uid, id, item);
    }
    setBookmarkRandomSelection(null);
  };

  const fetchNearbyRestaurants = async (x, y) => {
    let allRestaurants = [];
    for (let page = 1; page <= 3; page++) {
      const url = `https://dapi.kakao.com/v2/local/search/keyword.json?query=\uC2DD\uB2F9&x=${x}&y=${y}&radius=${radius}&page=${page}`;
      const response = await fetch(url, {
        headers: { Authorization: `KakaoAK ${REST_API_KEY}` }
      });
      if (!response.ok) break;
      const data = await response.json();
      if (data.documents?.length) {
        allRestaurants = [...allRestaurants, ...data.documents];
        if (data.documents.length < 15) break;
      }
    }
    if (allRestaurants.length === 0) {
      Alert.alert('근처에 식당이 없습니다.');
    }
    setRestaurants(allRestaurants);
  };

  const handleLocationClick = async () => {
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('위치 권한이 필요합니다.');
      return;
    }
    const location = await Location.getCurrentPositionAsync({});
    const lat = location.coords.latitude;
    const lng = location.coords.longitude;
    setMyPosition({ lat, lng });
    setMapCenter({ lat, lng });
    fetchNearbyRestaurants(lng, lat);
  };

  const handleSpin = () => {
    const dataList = isBookmarkMode ? Object.values(bookmarks) : restaurants;
    if (dataList.length === 0) {
      Alert.alert(isBookmarkMode ? '북마크가 없습니다.' : '식당이 없습니다.');
      return;
    }
    const excluded = excludedCategory.split(',').map(c => c.trim()).filter(Boolean);
    const included = includedCategory.trim();
    const filtered = dataList.filter(r => {
      const isExcluded = excluded.length > 0 && excluded.some(cat => r.category_name.includes(cat));
      const isIncluded = included ? r.category_name.includes(included) : true;
      return !isExcluded && isIncluded;
    });
    const finalList = filtered.length ? filtered : dataList.filter(r => !excluded.some(cat => r.category_name.includes(cat)));
    if (!filtered.length && included) setNoIncludedMessage(`${included} 관련 음식점 없음. 전체에서 추천합니다.`);
    const result = finalList.sort(() => 0.5 - Math.random()).slice(0, count || 5);
    if (isBookmarkMode) setBookmarkRandomSelection(result);
    else setRestaurants(result);
  };

  const displayRestaurants = isBookmarkMode ? (bookmarkRandomSelection || Object.values(bookmarks)) : restaurants;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>오늘 뭐 먹지?</Text>
        {user ? (
          <View>
            <Text>환영합니다 {user.displayName}님!</Text>
            <Button title={isBookmarkMode ? '일반 모드' : '북마크 모드'} onPress={() => setIsBookmarkMode(!isBookmarkMode)} />
            <Button title="로그아웃" onPress={() => signOut(auth)} />
          </View>
        ) : (
          <View>
            <Button title="로그인" onPress={() => { setAuthMode('login'); setAuthModalOpen(true); }} />
            <Button title="회원가입" onPress={() => { setAuthMode('signup'); setAuthModalOpen(true); }} />
          </View>
        )}
      </View>

      <Button title="현위치로 검색" onPress={handleLocationClick} />

      <RadiusInput setRadius={setRadius} />

      <TextInput
        style={styles.input}
        placeholder="추천 개수"
        keyboardType="numeric"
        value={count.toString()}
        onChangeText={(text) => setCount(Number(text) || 0)}
      />

      <TextInput
        style={styles.input}
        placeholder="추천할 카테고리 (예: 한식)"
        value={includedCategory}
        onChangeText={setIncludedCategory}
      />

      <TextInput
        style={styles.input}
        placeholder="제외할 카테고리 (쉼표로 구분)"
        value={excludedCategory}
        onChangeText={setExcludedCategory}
      />

      <Button title="랜덤 추천" onPress={handleSpin} />

      {noIncludedMessage && <Text style={{ color: 'red' }}>{noIncludedMessage}</Text>}

      <MapComponent
        mapCenter={mapCenter}
        myPosition={myPosition}
        radius={radius}
        restaurants={displayRestaurants}
        bookmarks={bookmarks}
      />

      <RestaurantList
        restaurants={displayRestaurants}
        onSelect={() => {}}
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

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#fff',
  },
  header: {
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 8,
    marginBottom: 10,
    borderRadius: 4,
  },
});

export default App;