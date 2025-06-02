
## 기술 스택

“오늘 뭐 먹지?” 주요 기술 스택

---

### 1. 프레임워크 & 런타임
- **React Native**  
  - 크로스 플랫폼(iOS/Android) 네이티브 앱 개발
- **Expo (Managed 워크플로우)**
  - Expo CLI / Expo Go / EAS Build 를 통한 빠른 개발·빌드·배포
  - Metro 번들러 기반

---

### 2. 언어 & 문법
- **JavaScript (ES6+) / JSX**
  - React 컴포넌트 작성
  - Arrow function, async/await, destructuring 등 최신 문법 활용
- **TypeScript 미사용**
  - 현재 프로젝트는 순수 JavaScript 기반으로 작성

---

### 3. 네비게이션 & 화면 구조
- **React Navigation**
  - 탭(Tab) 네비게이션 + 스택(Stack) 네비게이션
  - `App.js` 에서 탭 구조를 구성 (`ExploreScreen`, `SavedScreen`, `ProfileScreen` 등)
- **SafeAreaView / KeyboardAvoidingView / ScrollView 등**
  - iOS 노치 & 키보드 처리, 스크롤 가능한 레이아웃

---

### 4. UI 컴포넌트 & 아이콘
- **React Native 기본 컴포넌트**
  - `View`, `Text`, `TextInput`, `TouchableOpacity`, `FlatList` 등
- **Ionicons (`@expo/vector-icons`)**
  - 벡터 아이콘(별표·화살표 등) 사용
- **공통 스타일 정의**
  - `styles/styles_native.js` 에서 버튼, 카드, 토글 등 공통 CSS 유사 스타일 관리
  - `stylesNative` 로 화면별(ExploreScreen 전용) 레이아웃 구분

---

### 5. 위치 & 지도 관련
- **expo-location**
  - 위치 권한 요청 (`requestForegroundPermissionsAsync`)
  - 현재 위도/경도 가져오기 (`getCurrentPositionAsync`)
- **MapComponent (커스텀 컴포넌트)**
  - 지도 라이브러리(예: `react-native-maps` 또는 Expo 지도의 `MapView`)를 활용
  - 마커 렌더링, 반경 표시, 사용자/식당 위치 표시

---

### 6. 외부 API
- **Kakao Local API (REST)**
  - **주소 검색**  
    `https://dapi.kakao.com/v2/local/search/address.json`
  - **키워드 검색 (식당 검색 등)**  
    `https://dapi.kakao.com/v2/local/search/keyword.json`
  - 요청 헤더:  
    ```http
    Authorization: KakaoAK {REST_API_KEY}
    ```
- **Linking (React Native)**
  - `Linking.openURL(place_url)` 로 카카오 지도 상세페이지(웹 뷰) 연결

---

### 7. 백엔드 & 데이터베이스
- **Firebase Authentication**
  - 이메일/비밀번호, 소셜 로그인 등 사용자 인증
- **Firebase Firestore**
  - 북마크(즐겨찾기) CRUD
  - `onSnapshot` 으로 실시간 구독 기능
