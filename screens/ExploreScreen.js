// screens/ExploreScreen.js
// “주소 검색 | 검색”부터 “랜덤 추천”까지 요청하신 레이아웃으로 수정된 ExploreScreen 컴포넌트 예시입니다.

import React, { useState, useCallback } from 'react';
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
import * as Location from 'expo-location';
import MapComponent from '../components/MapComponent';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { calcDistance } from '../assets/utils/calcDistance';
import { subscribeBookmarks, addBookmark, removeBookmark } from '../services/bookmark';
import { styles as commonStyles } from '../styles/styles_native';

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

  // 1) 주소/키워드 검색 (카카오 로컬 API)
  const fetchAddressData = async q => {
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
  const handleSelectAddress = r => {
    const lat = parseFloat(r.y);
    const lng = parseFloat(r.x);
    setMapCenter({ lat, lng });
    fetchNearby(lng, lat);
    setSearchResults([]);
    setAddressQuery(r.address_name || r.place_name || '');
    if (showBookmarks) setBookmarkSelection(null);
  };

  // 2) 근처 식당 조회 (카카오 로컬 API)
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

  // 3) 현위치 검색 버튼
  const handleLocation = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('위치 권한이 필요합니다.');
      return;
    }
    const loc = await Location.getCurrentPositionAsync({});
    setMyPosition({ lat: loc.coords.latitude, lng: loc.coords.longitude });
    setMapCenter({ lat: loc.coords.latitude, lng: loc.coords.longitude });
    fetchNearby(loc.coords.longitude, loc.coords.latitude);
  };

  // 4) 랜덤 추천 (일반 모드 vs 북마크 모드 구분)
  const handleSpin = useCallback(async () => {
    setNoMessage('');

    // --- 북마크 모드: 사용자 북마크에서 필터 + 랜덤 ---
    if (showBookmarks && user) {
      let list = Object.values(bookmarks);
      const excl = excludedCategory
        .split(',')
        .map(s => s.trim())
        .filter(Boolean);
      const incl = includedCategory.trim();

      let filtered = list.filter(r => {
        const isEx = excl.some(c => r.category_name.includes(c));
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

    // --- 일반 모드: 지도 중심 좌표로 fresh fetch + 필터 + 랜덤 ---
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
      .map(s => s.trim())
      .filter(Boolean);
    const incl2 = includedCategory.trim();

    let filt2 = fresh.filter(r => {
      const bad = excl2.some(c => r.category_name.includes(c));
      const ok = incl2 ? r.category_name.includes(incl2) : true;
      return !bad && ok;
    });
    if (!filt2.length && incl2) {
      setNoMessage(`${incl2} 관련 음식점 없음. 전체에서 추천합니다.`);
      filt2 = fresh;
    }
    setGeneralSelection(filt2.sort(() => 0.5 - Math.random()).slice(0, count || 5));
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

  // 5) FlatList용 카드 렌더러
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
      <View style={commonStyles.cardContainer}>
        <View style={[commonStyles.card, isBm && commonStyles.bookmarked]}>
          <TouchableOpacity
            style={[commonStyles.starBtn, isBm && commonStyles.starActive]}
            onPress={() => toggleBookmark(item.id, item)}
          >
            <Ionicons
              name={isBm ? 'star' : 'star-outline'}
              size={20}
              color={isBm ? '#fff' : '#FFD600'}
            />
          </TouchableOpacity>
          <Text style={commonStyles.restaurantTitle}>{item.place_name}</Text>
          <Text style={commonStyles.restaurantMeta}>
            {item.road_address_name || item.address_name}
          </Text>
          <Text style={commonStyles.restaurantMeta}>{item.category_name}</Text>
          {item.phone && (
            <Text style={commonStyles.restaurantMeta}>전화: {item.phone}</Text>
          )}
          {dist != null && (
            <Text style={commonStyles.restaurantMeta}>거리: {dist}m</Text>
          )}
          <TouchableOpacity
            style={commonStyles.detailBtn}
            onPress={() => Linking.openURL(item.place_url)}
          >
            <Text style={commonStyles.detailText}>상세보기</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // --- 북마크 모드일 때: 반경 범위 안의 북마크 리스트 ---
  const inRangeBookmarks = !myPosition
    ? Object.values(bookmarks)
    : Object.values(bookmarks).filter(r => {
        const d = calcDistance(
          mapCenter.lat,
          mapCenter.lng,
          parseFloat(r.y),
          parseFloat(r.x)
        );
        return d <= radius;
      });

  // 최종 화면에 표시할 데이터 결정
  const displayData =
    showBookmarks && user
      ? bookmarkSelection !== null
        ? bookmarkSelection
        : inRangeBookmarks
      : generalSelection.length
      ? generalSelection
      : restaurants;

  // 리스트 펼쳐진 상태에서 빈 화면일 때 표시할 메시지
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
      <View style={commonStyles.header}>
        <Text style={commonStyles.headerTitle}>오늘 뭐 먹지?</Text>
        {user ? (
          <TouchableOpacity
            style={commonStyles.authButton}
            onPress={() => {
              // 실제로는 signOut(auth)를 호출해야 합니다.
              subscribeBookmarks(user.uid, () => {});
            }}
          >
            <Text style={{ color: '#fff' }}>로그아웃</Text>
          </TouchableOpacity>
        ) : (
          <>
            <TouchableOpacity
              style={commonStyles.authButton}
              onPress={openLogin}
            >
              <Text style={{ color: '#fff' }}>로그인</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={commonStyles.authButton}
              onPress={openSignup}
            >
              <Text style={{ color: '#fff' }}>회원가입</Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      {/* ─────────── 모드 토글 (일반 모드 / 북마크 모드) ─────────── */}
      {user && (
        <View style={commonStyles.toggleContainer}>
          <TouchableOpacity
            style={[
              commonStyles.toggleBtn,
              !showBookmarks && commonStyles.toggleActive,
            ]}
            onPress={() => {
              setShowBookmarks(false);
              setBookmarkSelection(null);
            }}
          >
            <Text
              style={[
                commonStyles.toggleText,
                !showBookmarks && commonStyles.toggleTextActive,
              ]}
            >
              일반 모드
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              commonStyles.toggleBtn,
              showBookmarks && commonStyles.toggleActive,
            ]}
            onPress={() => setShowBookmarks(true)}
          >
            <Text
              style={[
                commonStyles.toggleText,
                showBookmarks && commonStyles.toggleTextActive,
              ]}
            >
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
          <View style={localStyles.searchSection}>
            <TextInput
              style={commonStyles.inputText}
              placeholder="주소 또는 건물명 입력"
              value={addressQuery}
              onChangeText={setAddressQuery}
              returnKeyType="search"
              blurOnSubmit={false}
            />

            {/* 검색 버튼과 현위치 검색 버튼을 같은 줄에 배치 */}
            <View style={localStyles.buttonRow}>
              {/* 왼쪽: 검색 버튼 */}
              <TouchableOpacity
                style={[commonStyles.commonButton, localStyles.searchButton]}
                onPress={() => {
                  if (showBookmarks && user) {
                    const q = addressQuery.trim();
                    const filtered = inRangeBookmarks.filter(r =>
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

              {/* 오른쪽: 현위치 검색 버튼 */}
              <TouchableOpacity
                style={[commonStyles.commonButton, localStyles.locationButton]}
                onPress={handleLocation}
              >
                <Text style={{ color: '#fff', fontWeight: 'bold' }}>
                  현위치 검색
                </Text>
              </TouchableOpacity>
            </View>

            {/* 검색 결과 리스트 (주소 / 가게명) */}
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
                      {r.place_name && r.address_name
                        ? ` (${r.place_name})`
                        : ''}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </View>

          {/* ─────────── 범위 | 범위설정 ─────────── */}
          <View style={localStyles.rangeSection}>
            <Text style={localStyles.rangeLabel}>범위</Text>
            <TextInput
              style={localStyles.rangeInput}
              value={radius.toString()}
              onChangeText={t => setRadius(Number(t) || radius)}
              keyboardType="numeric"
            />
            <Text style={localStyles.rangeUnit}>m</Text>
          </View>

          {/* ─────────── 포함 | 제외 ─────────── */}
          <View style={localStyles.includeExcludeSection}>
            <View style={localStyles.includeExcludeRow}>
              <Text style={localStyles.includeExcludeLabel}>포함</Text>
              <TextInput
                style={localStyles.includeExcludeInput}
                placeholder="포함 카테고리"
                value={includedCategory}
                onChangeText={setIncludedCategory}
              />
            </View>
            <View style={localStyles.includeExcludeRow}>
              <Text style={localStyles.includeExcludeLabel}>제외</Text>
              <TextInput
                style={localStyles.includeExcludeInput}
                placeholder="제외 카테고리"
                value={excludedCategory}
                onChangeText={setExcludedCategory}
              />
            </View>
          </View>

          {/* ─────────── 랜덤 추천 ─────────── */}
          <View style={localStyles.spinSection}>
            <TouchableOpacity
              style={[commonStyles.commonButton, localStyles.spinButton]}
              onPress={handleSpin}
            >
              <Text style={{ color: '#fff', fontWeight: 'bold' }}>
                랜덤 추천
              </Text>
            </TouchableOpacity>
          </View>

          {/* ─────────── 지도 ─────────── */}
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
        </ScrollView>

        {/* ─────────── 리스트 토글 ─────────── */}
        <TouchableOpacity
          style={localStyles.toggleWrapper}
          onPress={() => setIsListOpen(v => !v)}
        >
          <Text style={localStyles.toggleText}>
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
              keyExtractor={i => String(i.id)}
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

// 화면 전용 로컬 스타일
const localStyles = StyleSheet.create({
  // ─── 주소 검색 섹션 ───
  searchSection: {
    padding: 8,
  },

  // ─── 버튼 두 개를 가로 정렬하여 가운데 배치 ───
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  // 왼쪽: 검색 버튼
  searchButton: {
    flex: 1,
    marginRight: 5, // 두 버튼 사이 5px 간격
  },
  // 오른쪽: 현위치 검색 버튼
  locationButton: {
    flex: 1,
    marginLeft: 5, // 두 버튼 사이 5px 간격
  },

  // ─── 범위(Range) 섹션 ───
  rangeSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginTop: 12,
  },
  rangeLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
    color: '#333',
    width: 40, // “범위” 텍스트 고정 너비
  },
  rangeInput: {
    flex: 1,
    backgroundColor: '#f4f4f4',
    borderRadius: 20,
    paddingHorizontal: 12,
    fontSize: 16,
    height: 44,
  },
  rangeUnit: {
    marginLeft: 8,
    fontSize: 16,
    color: '#333',
  },

  // ─── 포함 | 제외 섹션 ───
  includeExcludeSection: {
    paddingHorizontal: 16,
    marginTop: 12,
  },
  includeExcludeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  includeExcludeLabel: {
    fontSize: 16,
    fontWeight: '600',
    width: 40, // “포함”/“제외” 고정 너비
    color: '#333',
  },
  includeExcludeInput: {
    flex: 1,
    backgroundColor: '#f4f4f4',
    borderRadius: 20,
    paddingHorizontal: 12,
    fontSize: 16,
    height: 44,
  },

  // ─── 랜덤 추천 섹션 ───
  spinSection: {
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 16,
  },
  spinButton: {
    minWidth: 120,   // 현위치 검색 버튼과 동일 크기로 맞추려면  flex 대신 minWidth 사용
    borderRadius: 24,
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: '#43A047',
  },

  // ─── 리스트 토글 ───
  toggleWrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.9)',
    zIndex: 10,
  },
  toggleText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
});
