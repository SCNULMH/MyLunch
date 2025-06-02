// screens/ExploreScreen.js
// “주소 검색 | 검색”부터 “랜덤 추천”까지 레이아웃 및 zoom 유지 로직 반영한 ExploreScreen

import React, { useState, useCallback, useEffect } from 'react';
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
  Platform,
  StyleSheet,
} from 'react-native';
import { signOut } from 'firebase/auth';           // ← 추가
import { auth } from '../firebase';      
import * as Location from 'expo-location';
import MapComponent from '../components/MapComponent';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { calcDistance } from '../assets/utils/calcDistance';
import { subscribeBookmarks, addBookmark, removeBookmark } from '../services/bookmark';
import { styles, stylesNative } from '../styles/styles_native';

const { REST_API_KEY } = Constants.expoConfig.extra;

function ExploreScreen({
  user,
  bookmarks,
  toggleBookmark,
  openLogin,
  openSignup,
  mapCenter,
  setMapCenter,
  myPosition,
  setMyPosition,
  restaurants,
  setRestaurants,
  radius,
  setRadius,
  count,
  setCount,
  excludedCategory,
  setExcludedCategory,
  includedCategory,
  setIncludedCategory,
  searchResults,
  setSearchResults,
  noMessage,
  setNoMessage,
  showBookmarks,
  setShowBookmarks,
}) {
  const { height } = useWindowDimensions();
  const mapHeight = height * 0.35;

  const [generalSelection, setGeneralSelection] = useState([]);
  const [bookmarkSelection, setBookmarkSelection] = useState(null);
  const [addressQuery, setAddressQuery] = useState('');
  const [isListOpen, setIsListOpen] = useState(false);

  // **추가된 부분: 현재 줌 레벨 상태**
  // 주소 검색하면 적당히 확대(예: 6), 현위치 검색하면 더 확대(예: 4)
  const [zoomLevel, setZoomLevel] = useState(4);

  // ────────────────────────────────────────────────
  // 1) 주소/키워드 검색 (카카오 로컬 API)
  // ────────────────────────────────────────────────
  const fetchAddressData = async (q) => {
    try {
      const addrUrl = `https://dapi.kakao.com/v2/local/search/address.json?query=${encodeURIComponent(q)}`;
      const keyUrl = `https://dapi.kakao.com/v2/local/search/keyword.json?query=${encodeURIComponent(q)}&category_group_code=AT4`;
      const [aR, kR] = await Promise.all([
        fetch(addrUrl, { headers: { Authorization: `KakaoAK ${REST_API_KEY}` } }),
        fetch(keyUrl, { headers: { Authorization: `KakaoAK ${REST_API_KEY}` } }),
      ]);
      if (!aR.ok || !kR.ok) throw new Error();
      const aJ = await aR.json();
      const kJ = await kR.json();
      const combo = [...(aJ.documents || []), ...(kJ.documents || [])];

      if (combo.length) {
        setSearchResults(combo);
      } else {
        const fb = await fetch(
          `https://dapi.kakao.com/v2/local/search/keyword.json?query=${encodeURIComponent(q)}`,
          { headers: { Authorization: `KakaoAK ${REST_API_KEY}` } }
        );
        const fbJ = await fb.json();
        setSearchResults(fbJ.documents || []);
      }
    } catch {
      Alert.alert('검색 중 오류가 발생했습니다.');
    }
  };

  // 1-2) 검색 결과 선택 → 지도 중심 좌표 설정 및 식당 조회
  const handleSelectAddress = (r) => {
    const lat = parseFloat(r.y);
    const lng = parseFloat(r.x);

    // 지도 중심을 검색한 주소로 설정
    setMapCenter({ lat, lng });

    // 검색했을 때는 약간 넓게(zoomLevel 6~7) 보도록 설정
    setZoomLevel(6);

    // 검색하면 해당 위치 기준으로 식당 조회
    fetchNearby(lng, lat);
    setSearchResults([]);
    setAddressQuery(r.address_name || r.place_name || '');
    if (showBookmarks) setBookmarkSelection(null);
  };

  // ────────────────────────────────────────────────
  // 2) 근처 식당 조회 (카카오 로컬 API)
  // ────────────────────────────────────────────────
  const fetchNearby = async (x, y) => {
    let all = [];
    for (let p = 1; p <= 3; p++) {
      const res = await fetch(
        `https://dapi.kakao.com/v2/local/search/keyword.json?query=식당&x=${x}&y=${y}&radius=${radius}&page=${p}`,
        { headers: { Authorization: `KakaoAK ${REST_API_KEY}` } }
      );
      if (!res.ok) break;
      const js = await res.json();
      all.push(...js.documents);
      if (js.documents.length < 15) break;
    }
    if (all.length) {
      setRestaurants(all);
      setGeneralSelection([]);
      if (showBookmarks) setBookmarkSelection(null);
    } else {
      Alert.alert('근처에 식당이 없습니다.');
    }
  };

  // ────────────────────────────────────────────────
  // 3) 현위치 검색 버튼
  // ────────────────────────────────────────────────
  const handleLocation = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('위치 권한이 필요합니다.');
      return;
    }
    const loc = await Location.getCurrentPositionAsync({});
    const newCenter = { lat: loc.coords.latitude, lng: loc.coords.longitude };

    // 현위치를 myPosition에 저장
    setMyPosition(newCenter);
    // 지도를 현위치 중심으로 업데이트
    setMapCenter(newCenter);
    // 현위치로 이동할 때는 좀 더 확대된(zoom-in) 레벨(예: 4)로 설정
    setZoomLevel(4);

    // 현위치 검색하면 해당 위치 기준으로 식당 조회
    fetchNearby(loc.coords.longitude, loc.coords.latitude);
  };

  // ────────────────────────────────────────────────
  // 4) 랜덤 추천 (일반 모드 vs 북마크 모드 구분)
  //    → zoomLevel은 건드리지 않으므로, “마지막 지정된 zoom” 그대로 유지
  // ────────────────────────────────────────────────
  const handleSpin = useCallback(async () => {
    setNoMessage('');

    // --- 북마크 모드: 사용자 북마크에서 필터 + 랜덤 ---
    if (showBookmarks && user) {
      let list = Object.values(bookmarks);
      const excl = excludedCategory
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      const incl = includedCategory.trim();

      let filtered = list.filter((r) => {
        const isEx = excl.some((c) => r.category_name.includes(c));
        const isIn = incl ? r.category_name.includes(incl) : true;
        return !isEx && isIn;
      });

      if (!filtered.length && incl) {
        setNoMessage(`${incl} 관련 음식점 없음. 전체에서 추천합니다.`);
        filtered = list;
      }
      setBookmarkSelection(filtered.sort(() => 0.5 - Math.random()).slice(0, count || 5));
      return;
    }

    // --- 일반 모드: 지도 중심 좌표를 건드리지 않고 식당만 fresh fetch + 필터 + 랜덤 ---
    if (!mapCenter) {
      Alert.alert('먼저 위치를 설정해주세요.');
      return;
    }
    let fresh = [];
    for (let p = 1; p <= 3; p++) {
      const res = await fetch(
        `https://dapi.kakao.com/v2/local/search/keyword.json?query=식당&x=${mapCenter.lng}&y=${mapCenter.lat}&radius=${radius}&page=${p}`,
        { headers: { Authorization: `KakaoAK ${REST_API_KEY}` } }
      );
      if (!res.ok) break;
      const js = await res.json();
      fresh.push(...js.documents);
      if (js.documents.length < 15) break;
    }
    if (!fresh.length) {
      Alert.alert('먼저 식당을 검색해주세요.');
      return;
    }
    const excl2 = excludedCategory
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    const incl2 = includedCategory.trim();

    let filt2 = fresh.filter((r) => {
      const bad = excl2.some((c) => r.category_name.includes(c));
      const ok = incl2 ? r.category_name.includes(incl2) : true;
      return !bad && ok;
    });
    if (!filt2.length && incl2) {
      setNoMessage(`${incl2} 관련 음식점 없음. 전체에서 추천합니다.`);
      filt2 = fresh;
    }
    setGeneralSelection(filt2.sort(() => 0.5 - Math.random()).slice(0, count || 5));
    // zoomLevel을 건드리지 않으므로, “마지막 지정된 zoom” 그대로 유지
  }, [
    showBookmarks,
    user,
    bookmarks,
    mapCenter,
    radius,
    excludedCategory,
    includedCategory,
    count,
  ]);

  // ────────────────────────────────────────────────
  // 5) FlatList용 카드 렌더러
  // ────────────────────────────────────────────────
  const renderRestaurantItem = ({ item }) => {
    const isBm = !!bookmarks[item.id];
    const dist = myPosition
      ? calcDistance(
          myPosition.lat,
          myPosition.lng,
          parseFloat(item.y),
          parseFloat(item.x)
        )
      : item.distance;

    return (
      <View style={styles.cardContainer}>
        <View style={[styles.card, isBm && styles.bookmarked]}>
          <TouchableOpacity
            style={[styles.starBtn, isBm && styles.starActive]}
            onPress={() => toggleBookmark(item.id, item)}
          >
            <Ionicons
              name={isBm ? 'star' : 'star-outline'}
              size={20}
              color={isBm ? '#fff' : '#FFD600'}
            />
          </TouchableOpacity>
          <Text style={styles.restaurantTitle}>{item.place_name}</Text>
          <Text style={styles.restaurantMeta}>
            {item.road_address_name || item.address_name}
          </Text>
          <Text style={styles.restaurantMeta}>{item.category_name}</Text>
          {item.phone && (
            <Text style={styles.restaurantMeta}>전화: {item.phone}</Text>
          )}
          {dist != null && (
            <Text style={styles.restaurantMeta}>거리: {dist}m</Text>
          )}
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

  // ────────────────────────────────────────────────
  // 북마크 모드일 때: 반경 범위 안의 북마크 리스트
  // ────────────────────────────────────────────────
  const inRangeBookmarks = !myPosition
    ? Object.values(bookmarks)
    : Object.values(bookmarks).filter((r) => {
        const d = calcDistance(
          mapCenter.lat,
          mapCenter.lng,
          parseFloat(r.y),
          parseFloat(r.x)
        );
        return d <= radius;
      });

  // 북마크 배열
  const bookmarkArray = Object.values(bookmarks);

  // ────────────────────────────────────────────────
  // 최종 화면에 표시할 데이터 결정
  // ────────────────────────────────────────────────
  const displayData =
    showBookmarks && user
      ? bookmarkSelection !== null
        ? bookmarkSelection
        : inRangeBookmarks
      : generalSelection.length
      ? generalSelection
      : restaurants;

  // ────────────────────────────────────────────────
  // 리스트 펼쳐진 상태에서 빈 화면일 때 표시할 메시지
  // ────────────────────────────────────────────────
  let emptyMsg = '';
  if (isListOpen) {
    if (showBookmarks && user) {
      if (bookmarkSelection !== null) {
        if (!bookmarkSelection.length) emptyMsg = '검색된 북마크가 없습니다.';
      } else {
        if (!inRangeBookmarks.length) emptyMsg = '범위 내 북마크가 없습니다.';
      }
    } else {
      if (!restaurants.length) emptyMsg = '먼저 검색하거나 현위치를 설정해주세요.';
      else if (!displayData.length) emptyMsg = '랜덤 추천을 눌러주세요.';
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f7f7f7' }}>
      {/* ─────────── 헤더 ─────────── */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>오늘 뭐 먹지?</Text>
        {user ? (
          <TouchableOpacity
            style={styles.authButton}
            onPress={() => signOut(auth)}   // ← 여기서 실제 로그아웃 호출
          >
            <Text style={{ color: '#fff' }}>로그아웃</Text>
          </TouchableOpacity>
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
      </View>

      {/* ─────────── 모드 토글 (일반 모드 / 북마크 모드) ─────────── */}
      {user && (
        <View style={styles.toggleContainer}>
          <TouchableOpacity
            style={[styles.toggleBtn, !showBookmarks && styles.toggleActive]}
            onPress={() => {
              setShowBookmarks(false);
              setBookmarkSelection(null);
            }}
          >
            <Text style={[styles.toggleText, !showBookmarks && styles.toggleTextActive]}>
              일반 모드
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleBtn, showBookmarks && styles.toggleActive]}
            onPress={() => setShowBookmarks(true)}
          >
            <Text style={[styles.toggleText, showBookmarks && styles.toggleTextActive]}>
              북마크 모드
            </Text>
          </TouchableOpacity>
        </View>
      )}

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: 8 }}
          style={{ flex: 1 }}
        >
          {/* ─────────── 주소 검색 | 검색 ─────────── */}
          <View style={stylesNative.searchSection}>
            <View style={stylesNative.searchRow}>
              <TextInput
                style={styles.inputText}
                placeholder="주소 또는 건물명 입력"
                value={addressQuery}
                onChangeText={setAddressQuery}
                returnKeyType="search"
                blurOnSubmit={false}
              />
              <TouchableOpacity
                style={[styles.commonButton, stylesNative.searchBtnCompact]}
                onPress={() => {
                  if (showBookmarks && user) {
                    const q = addressQuery.trim();
                    const filtered = inRangeBookmarks.filter(
                      (r) =>
                        r.place_name.includes(q) || r.address_name.includes(q)
                    );
                    setBookmarkSelection(filtered);
                  } else {
                    fetchAddressData(addressQuery);
                  }
                }}
              >
                <Text style={{ color: '#fff', fontWeight: 'bold' }}>검색</Text>
              </TouchableOpacity>
            </View>

            {/* ─────────── “현위치 검색” 버튼 ─────────── */}
            <View style={stylesNative.locationWrapper}>
              <TouchableOpacity
                style={[styles.commonButton, stylesNative.locationBtnCompact]}
                onPress={handleLocation}
              >
                <Text style={{ color: '#fff', fontWeight: 'bold' }}>현위치 검색</Text>
              </TouchableOpacity>
            </View>

            {/* ─────────── 검색 결과 리스트 (주소 / 가게명) ─────────── */}
            {(!showBookmarks || !user) && searchResults.length > 0 && (
              <ScrollView
                style={{
                  maxHeight: 180,
                  backgroundColor: '#f7f7f7',
                  marginVertical: 8,
                  borderRadius: 8,
                }}
              >
                {searchResults.map((r, i) => (
                  <TouchableOpacity
                    key={i}
                    style={{
                      padding: 10,
                      borderBottomWidth: 1,
                      borderColor: '#eee',
                    }}
                    onPress={() => handleSelectAddress(r)}
                  >
                    <Text style={{ fontSize: 16 }}>
                      {r.address_name || r.place_name}
                      {r.place_name && r.address_name ? ` (${r.place_name})` : ''}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </View>

          {/* ─────────── 범위 | 범위설정 ─────────── */}
          <View style={stylesNative.rangeSection}>
            <Text style={stylesNative.rangeLabel}>범위</Text>
            <TextInput
              style={stylesNative.rangeInput}
              value={radius.toString()}
              onChangeText={(t) => setRadius(Number(t) || radius)}
              keyboardType="numeric"
            />
            <Text style={stylesNative.rangeUnit}>m</Text>
          </View>

          {/* ─────────── 포함 | 제외 ─────────── */}
          <View style={stylesNative.includeExcludeSection}>
            <View style={stylesNative.includeExcludeRow}>
              <Text style={stylesNative.includeExcludeLabel}>포함</Text>
              <TextInput
                style={stylesNative.includeExcludeInput}
                placeholder="포함 카테고리"
                value={includedCategory}
                onChangeText={setIncludedCategory}
              />
            </View>
            <View style={stylesNative.includeExcludeRow}>
              <Text style={stylesNative.includeExcludeLabel}>제외</Text>
              <TextInput
                style={stylesNative.includeExcludeInput}
                placeholder="제외 카테고리"
                value={excludedCategory}
                onChangeText={setExcludedCategory}
              />
            </View>
          </View>

          {/* ─────────── 랜덤 추천 ─────────── */}
          <View style={stylesNative.spinSection}>
            <TouchableOpacity
              style={[styles.commonButton, stylesNative.spinButton]}
              onPress={handleSpin}
            >
              <Text style={{ color: '#fff', fontWeight: 'bold' }}>랜덤 추천</Text>
            </TouchableOpacity>
          </View>

          {/* ─────────── 지도 ─────────── */}
          <View style={{ width: '100%', height: mapHeight }}>
            <MapComponent
              mapCenter={mapCenter}
              restaurants={displayData}
              radius={radius}
              myPosition={myPosition}
              bookmarks={bookmarks}
              zoomLevel={zoomLevel}
              style={{ width: '100%', height: '100%' }}
            />
          </View>
        </ScrollView>

        {/* ─────────── 리스트 토글 ─────────── */}
        <TouchableOpacity
          style={stylesNative.toggleWrapper}
          onPress={() => setIsListOpen((v) => !v)}
        >
          <Text style={stylesNative.toggleText}>
            {isListOpen ? '▲ 접기' : '▼ 펼치기'}
          </Text>
        </TouchableOpacity>

        {/* ─────────── 리스트 (FlatList) ─────────── */}
        {isListOpen &&
          (emptyMsg ? (
            <View style={{ padding: 16, alignItems: 'center' }}>
              <Text>{emptyMsg}</Text>
            </View>
          ) : (
            <FlatList
              data={displayData}
              keyExtractor={(i) => String(i.id)}
              numColumns={2}
              contentContainerStyle={{ padding: 8 }}
              renderItem={renderRestaurantItem}
              keyboardShouldPersistTaps="handled"
            />
          ))}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

export default ExploreScreen;

// 화면 전용 로컬 스타일 (현재 사용 없음)
const localStyles = StyleSheet.create({});
