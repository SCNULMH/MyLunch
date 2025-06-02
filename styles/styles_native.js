// styles/styles_native.js

import { StyleSheet, Dimensions } from 'react-native';
const { width } = Dimensions.get('window');

export const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 32,
    paddingBottom: 28,
    alignItems: 'center',
    marginVertical: 40,
    width: '95%',
    maxWidth: 600,
    alignSelf: 'center',
    elevation: 8,
  },
  header: {
    width: '100%',
    backgroundColor: '#fff',       // '#white' → '#fff'
    paddingVertical: 24,
    paddingHorizontal: 40,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginBottom: 24,
  },
  headerTitle: {
    color: '#000',                // '#black' → '#000'
    fontSize: 28,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  searchRow: {
    flexDirection: 'row',
    width: '90%',
    maxWidth: 500,
    marginVertical: 16,
    alignSelf: 'center',
  },
  searchInput: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 22,
    backgroundColor: '#f4f4f4',
    borderTopLeftRadius: 24,
    borderBottomLeftRadius: 24,
    fontSize: 18,
  },
  searchButton: {
    paddingVertical: 14,
    paddingHorizontal: 28,
    backgroundColor: '#4CAF50',
    borderTopRightRadius: 24,
    borderBottomRightRadius: 24,
    marginLeft: -1,
  },
  authButton: {
    backgroundColor: '#2e7031',
    color: '#fff',
    borderRadius: 24,
    paddingVertical: 12,
    paddingHorizontal: 28,
    fontSize: 17,
    fontWeight: 'bold',
    marginHorizontal: 8,
  },
  welcomeMsg: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginRight: 8,
  },
  bookmarkBtn: {
    backgroundColor: '#FFD600',
    color: '#222',
    borderRadius: 18,
    paddingVertical: 8,
    paddingHorizontal: 18,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  logoutBtn: {
    backgroundColor: '#388E3C',
    borderColor: '#fff',
    borderWidth: 1.5,
    borderRadius: 18,
    paddingVertical: 8,
    paddingHorizontal: 18,
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 4,
  },
  mapArea: {
    width: '90%',
    height: 220,
    backgroundColor: '#eafbe7',
    borderRadius: 28,
    marginVertical: 24,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 22,
  },
  inputText: {
    backgroundColor: '#f4f4f4',
    borderRadius: 20,
    paddingVertical: 13,
    paddingHorizontal: 20,
    fontSize: 18,
    marginVertical: 8,
  },
  commonButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 24,
    paddingVertical: 14,
    paddingHorizontal: 28,
    fontSize: 18,
    fontWeight: 'bold',
    marginVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  randomButton: {
    backgroundColor: '#000',
    borderRadius: 24,
    paddingVertical: 16,
    paddingHorizontal: 34,
    fontSize: 20,
    fontWeight: 'bold',
    marginVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultMessage: {
    color: '#1976D2',
    backgroundColor: '#eafbe7',
    borderRadius: 18,
    padding: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    fontSize: 20,
    marginVertical: 24,
  },
  restaurantCard: {
    backgroundColor: '#fff',
    borderRadius: 22,
    padding: 22,
    marginBottom: 18,
    shadowColor: '#388E3C',
    shadowOpacity: 0.07,
    shadowRadius: 16,
    elevation: 4,
  },
  restaurantTitle: {
    fontSize: 19,
    fontWeight: 'bold',
    marginBottom: 7,
    color: '#111',
  },
  restaurantMeta: {
    color: '#888',
    fontSize: 16,
    marginBottom: 4,
  },
  detailBtn: {
    marginTop: 12,
    padding: 10,
    backgroundColor: '#4CAF50',
    borderRadius: 14,
    alignSelf: 'flex-end',
  },
  detailText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },

  // 그리드 아이템 컨테이너
  cardContainer: {
    flex: 1,
    padding: 8,
  },
  // 개별 카드 스타일
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 12,
    margin: 4,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  // 북마크 표시(카드 테두리)
  bookmarked: {
    borderColor: '#FFD600',
    borderWidth: 2,
  },
  // 즐겨찾기 버튼 위치 및 스타일
  starBtn: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#DDD',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  starActive: {
    backgroundColor: '#FFD600',
    borderColor: '#FFD600',
  },

  // 모드 토글 버튼
  toggleContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginVertical: 12,
  },
  toggleBtn: {
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#f4f4f4',
    marginHorizontal: 8,
  },
  toggleActive: {
    backgroundColor: '#43A047',
  },
  toggleText: {
    fontSize: 14,
    color: '#555',
  },
  toggleTextActive: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

export const stylesNative = StyleSheet.create({
  // ───────────────────────────────────────────────────
  // ExploreScreen 전용 레이아웃 스타일
  // ───────────────────────────────────────────────────

  // “주소 검색 | 검색” 섹션
  searchSection: {
    padding: 8,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',      // 가로 중앙 정렬
    width: '90%',                   // 부모 너비를 90%로 지정
    maxWidth: 500,                  // 최대 너비 제한
    alignSelf: 'center', 
  },
  searchBtnCompact: {
    marginLeft: 5,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 24,
    backgroundColor: '#4CAF50',
    minWidth: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // “현위치 검색” 버튼 (작게, 아래 줄에 중앙 배치)
  locationWrapper: {
    alignItems: 'center',
    marginTop: 8,
  },
  locationBtnCompact: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 24,
    backgroundColor: '#388E3C',
    minWidth: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // “범위 | 범위설정” 섹션
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
    width: 40, // “범위” 레이블 고정 너비
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

  // “포함 | 제외” 섹션
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
    width: 40, // “포함”/“제외” 레이블 고정 너비
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

  // “랜덤 추천” 섹션
  spinSection: {
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 16,
  },
  spinButton: {
    minWidth: 120, // “현위치 검색” 버튼과 비슷한 크기
    borderRadius: 0,
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: 'black',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // 리스트 토글 (플랫리스트 펼치기/접기)
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
