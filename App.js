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

  // 반응형 맵 높이 계산 (화면 높이의 35%)
  const { height } = useWindowDimensions();
  const mapHeight = height * 0.35;

  // 상태 선언
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

  // 앱 시작 시 일반 모드로 초기화
  useEffect(() => {
    setShowBookmarks(false);
  }, []);

  // Firebase Auth 상태 감지 및 북마크 구독
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, currentUser => {
      setUser(currentUser);
      setShowBookmarks(false);
      setBookmarkSelection(null);
      if (!currentUser) {
        setBookmarks({});
        return;
      }
      return subscribeBookmarks(currentUser.uid, data => setBookmarks({ ...data }));
    });
    return () => unsubscribe();
  }, []);

  // 카카오 API로 근처 식당 조회 (페이징 처리)
  const fetchNearby = async (x, y) => {
    let all = [];
    for (let page = 1; page <= 3; page++) {
      const url = `https://dapi.kakao.com/v2/local/search/keyword.json?query=식당&x=${x}&y=${y}&radius=${radius}&page=${page}`;
      const res = await fetch(url, { headers: { Authorization: `KakaoAK ${REST_API_KEY}` } });
      if (!res.ok) break;
      const data = await res.json();
      if (data.documents?.length) {
        all.push(...data.documents);
        if (data.documents.length < 15) break;
      }
    }
    if (all.length) setRestaurants(all);
    else Alert.alert('근처에 식당이 없습니다.');
  };

  // 현위치 기반 검색
  const handleLocation = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') return Alert.alert('위치 권한이 필요합니다.');
    const loc = await Location.getCurrentPositionAsync({});
    const { latitude: lat, longitude: lng } = loc.coords;
    setMyPosition({ lat, lng });
    setMapCenter({ lat, lng });
    fetchNearby(lng, lat);
  };

  // 랜덤 추천
  const handleSpin = () => {
    setNoIncludedMessage('');
    let dataList = showBookmarks && user
      ? Object.values(bookmarks)
      : restaurants;
    if (!dataList.length) return Alert.alert(showBookmarks ? '북마크가 없습니다.' : '식당이 없습니다.');

    const excl = excludedCategory.split(',').map(c => c.trim()).filter(Boolean);
    const incl = includedCategory.trim();
    let filtered = dataList.filter(r => {
      const isEx = excl.some(cat => r.category_name.includes(cat));
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

  // 화면에 보여줄 리스트 결정
  const displayData = showBookmarks && user
    ? (bookmarkSelection || Object.values(bookmarks))
    : restaurants;

  // 즐겨찾기 토글
  const toggleBookmark = (id, item) => {
    if (!user) return Alert.alert('로그인이 필요합니다.');
    if (bookmarks[id]) removeBookmark(user.uid, id);
    else addBookmark(user.uid, id, item);
    setBookmarkSelection(null);
  };

  // FlatList 아이템 렌더러
  const renderItem = ({ item }) => {
    const isBookmarked = !!bookmarks[item.id];
    const distance = myPosition
      ? calcDistance(
          myPosition.lat,
          myPosition.lng,
          parseFloat(item.y),
          parseFloat(item.x)
        )
      : item.distance;
    return (
      <View style={styles.cardContainer}>
        <TouchableOpacity style={[styles.card, isBookmarked && styles.bookmarked]}>  
          <TouchableOpacity
            style={[styles.starBtn, isBookmarked && styles.starActive]}
            onPress={() => toggleBookmark(item.id, item)}
          >
            <Text style={isBookmarked ? { color: '#fff' } : {}}>★</Text>
          </TouchableOpacity>
          <Text style={styles.restaurantTitle}>{item.place_name}</Text>
          <Text style={styles.restaurantMeta}>{item.road_address_name || item.address_name}</Text>
          <Text style={styles.restaurantMeta}>{item.category_name}</Text>
          {item.phone && <Text style={styles.restaurantMeta}>전화: {item.phone}</Text>}
          {distance != null && <Text style={styles.restaurantMeta}>거리: {distance}m</Text>}
          <TouchableOpacity
            style={styles.detailBtn}
            onPress={() => Linking.openURL(item.place_url)}
          >
            <Text style={styles.detailText}>상세보기</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <FlatList
        data={displayData}
        keyExtractor={item => String(item.id)}
        numColumns={2}
        contentContainerStyle={{ padding: 8 }}
        ListHeaderComponent={() => (
          <>
            {/* 헤더: 타이틀 + 로그인/로그아웃 */}
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
                  <Text style={[styles.toggleText, !showBookmarks && styles.toggleTextActive]}>
                    일반 모드
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.toggleBtn, showBookmarks && styles.toggleActive]}
                  onPress={() => { setShowBookmarks(true); setBookmarkSelection(null); }}
                >
                  <Text style={[styles.toggleText, showBookmarks && styles.toggleTextActive]}>북마크 모드</Text>
                </TouchableOpacity>
              </View>
            )}
            {/* 검색 및 랜덤 추천 */}
            <View style={{ padding: 16 }}>
              <TouchableOpacity style={styles.commonButton} onPress={handleLocation}>
                <Text>현위치 검색</Text>
              </TouchableOpacity>
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
            {/* 지도 영역 */}
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