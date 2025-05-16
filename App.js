// App.js
import React, { useState, useEffect } from 'react';
import { Linking } from 'react-native';
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  useWindowDimensions,
  FlatList,
} from 'react-native';
import * as Location from 'expo-location';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from './firebase';
import MapComponent from './components/MapComponent';
import AuthModal from './components/AuthModal';
import { subscribeBookmarks, addBookmark, removeBookmark } from './services/bookmark';
import { styles } from './styles/styles_native';

const App = () => {
  // 거리 계산 헬퍼 (Haversine)
  const calcDistance = (lat1, lon1, lat2, lon2) => {
    const toRad = x => (x * Math.PI) / 180;
    const R = 6371000; // 지구 반지름 (m)
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c);
  };

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

  const REST_API_KEY = '25d26859dae2a8cb671074b910e16912';

  // 앱 시작 시, 로그인 상태 변경 시 일반 모드로 초기화
  useEffect(() => setShowBookmarks(false), []);
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, u => {
      setUser(u);
      setShowBookmarks(false);
      setBookmarkSelection(null);
      if (!u) return setBookmarks({});
      return subscribeBookmarks(u.uid, data => setBookmarks({ ...data }));
    });
    return () => unsub();
  }, []);

  const fetchNearby = async (x, y) => {
    let all = [];
    for (let page = 1; page <= 3; page++) {
      const url = `https://dapi.kakao.com/v2/local/search/keyword.json?query=식당&x=${x}&y=${y}&radius=${radius}&page=${page}`;
      const res = await fetch(url, { headers: { Authorization: `KakaoAK ${REST_API_KEY}` } });
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
    if (status !== 'granted') return Alert.alert('위치 권한이 필요합니다.');
    const loc = await Location.getCurrentPositionAsync({});
    setMyPosition({ lat: loc.coords.latitude, lng: loc.coords.longitude });
    setMapCenter({ lat: loc.coords.latitude, lng: loc.coords.longitude });
    fetchNearby(loc.coords.longitude, loc.coords.latitude);
  };

  const handleSpin = () => {
    setNoIncludedMessage('');
    // 일반 or 북마크 모드별 대상 리스트
    const dataList = showBookmarks && user
      ? Object.values(bookmarks)
      : restaurants;
    if (!dataList.length) {
      return Alert.alert(showBookmarks ? '북마크가 없습니다.' : '식당이 없습니다.');
    }

    const excl = excludedCategory.split(',').map(s => s.trim()).filter(Boolean);
    const incl = includedCategory.trim();
    let filtered = dataList.filter(r => {
      const isEx = excl.some(c => r.category_name.includes(c));
      const isIn = incl ? r.category_name.includes(incl) : true;
      return !isEx && isIn;
    });
    if (!filtered.length && incl) {
      setNoIncludedMessage(`${incl} 관련 음식점 없음. 전체에서 추천합니다.`);
      filtered = dataList;
    }
    const result = filtered.sort(() => 0.5 - Math.random()).slice(0, count || 5);
    if (showBookmarks && user) setBookmarkSelection(result);
    else setRestaurants(result);
  };

  const displayData = showBookmarks && user
    ? (bookmarkSelection || Object.values(bookmarks))
    : restaurants;

  const toggleBookmark = (id, item) => {
    if (!user) return Alert.alert('로그인이 필요합니다.');
    if (bookmarks[id]) removeBookmark(user.uid, id);
    else addBookmark(user.uid, id, item);
    setBookmarkSelection(null);
  };

  const renderItem = ({ item }) => {
    const isBm = !!bookmarks[item.id];
    const distance = myPosition
      ? calcDistance(
          myPosition.lat, myPosition.lng,
          parseFloat(item.y), parseFloat(item.x)
        )
      : item.distance;
    return (
      <View style={styles.cardContainer}>
        <View style={[styles.card, isBm && styles.bookmarked]}>
          {/* 북마크 버튼 (왼쪽 아래) */}
          <TouchableOpacity
            style={[styles.starBtn, isBm && styles.starActive]}
            onPress={() => toggleBookmark(item.id, item)}
          >
            <Text style={isBm ? { color: '#fff' } : {}}>★</Text>
          </TouchableOpacity>

          <Text style={styles.restaurantTitle}>{item.place_name}</Text>
          <Text style={styles.restaurantMeta}>{item.road_address_name || item.address_name}</Text>
          <Text style={styles.restaurantMeta}>{item.category_name}</Text>
          {item.phone && <Text style={styles.restaurantMeta}>전화: {item.phone}</Text>}
          {distance != null && <Text style={styles.restaurantMeta}>거리: {distance}m</Text>}

          {/* 상세보기 (오른쪽 아래) */}
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
    <SafeAreaView style={{ flex: 1 }}>
      <FlatList
        data={displayData}
        keyExtractor={i => String(i.id)}
        numColumns={2}
        contentContainerStyle={{ padding: 8 }}
        ListHeaderComponent={() => (
          <>
            {/* 헤더: 로그인·토글 */}
            <View style={styles.header}>
              <Text style={styles.headerTitle}>오늘 뭐 먹지?</Text>
              {user ? (
                <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                  <Text style={styles.welcomeMsg}>{user.displayName}님 환영!</Text>
                  <TouchableOpacity style={styles.authButton} onPress={() => signOut(auth)}>
                    <Text>로그아웃</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={{ flexDirection: 'row' }}>
                  <TouchableOpacity style={styles.authButton} onPress={() => setAuthModalOpen(true)}>
                    <Text>로그인</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.authButton} onPress={() => setAuthModalOpen(true)}>
                    <Text>회원가입</Text>
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

            {/* 검색 · 필터 · 랜덤 추천 · 반경 */}
            <View style={{ padding: 16 }}>
              <TouchableOpacity style={styles.commonButton} onPress={handleLocation}>
                <Text>현위치 검색</Text>
              </TouchableOpacity>
              <TextInput
                style={styles.inputText}
                placeholder="검색 반경 (m)"
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
                placeholder="추천 카테고리"
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
                <Text>랜덤 추천</Text>
              </TouchableOpacity>
              {noIncludedMessage && <Text style={styles.resultMessage}>{noIncludedMessage}</Text>}
            </View>

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
          </>
        )}
        renderItem={renderItem}
      />
      <AuthModal mode={authMode} open={authModalOpen} onClose={() => setAuthModalOpen(false)} />
    </SafeAreaView>
  );
};

export default App;
