## 디렉토리 구조
.
├── .env # 환경 변수(카카오 API 키 등) 저장
├── .gitignore # Git이 추적하지 않을 파일/폴더 목록
├── app.config.js # Expo 앱 설정(메타데이터)
├── App.js # 탭 네비게이션 및 전역 상태 관리
├── app.json # Expo 앱 기본 설정(이름, 아이콘 등)
├── firebase.js # Firebase 초기화 및 인증/Firestore 설정
├── index.js # Expo 진입점 (앱 등록)
├── metro.config.js # Metro 번들러 설정
├── package-lock.json # npm 의존성 잠금 파일
├── package.json # 프로젝트 의존성 및 스크립트 정의
│
├── .expo
│ ├── devices.json # Expo에 연결된 디바이스 정보
│ ├── packager-info.json # Metro 번들러 정보
│ ├── settings.json # Expo CLI 설정
│ └── web
│ └── cache
│ └── production
│ └── images
│ └── favicon
│ └── favicon-48.png # 웹용 파비콘
│
├── .idea
│ └── caches # IDE 캐시 디렉터리
│
├── assets
│ ├── adaptive-icon.png # Expo Adaptive 아이콘
│ ├── favicon.png # 앱 파비콘
│ ├── icon.png # 앱 아이콘
│ ├── splash-icon.png # 스플래시 화면 아이콘
│ └── utils
│ └── calcDistance.js # 두 지점 간 거리 계산 함수
│
├── components
│ ├── AuthModal.js # 로그인/회원가입 모달 컴포넌트
│ ├── BookmarkList.js # (필요 시) 북마크 리스트 렌더링용 컴포넌트
│ ├── CustomText.js # 커스텀 폰트 적용 텍스트 컴포넌트
│ ├── MapComponent.js # 지도 표시 및 마커 렌더링 컴포넌트
│ ├── RadiusInput.js # 반경 입력 전용 커스텀 컴포넌트
│ ├── RestaurantList.js # (필요 시) 식당 리스트 렌더링용 컴포넌트
│ └── SignupModal.js # 회원가입 전용 모달 컴포넌트
│
├── screens
│ ├── ExploreScreen.js # “오늘 뭐 먹지?” 메인 화면 (주소 검색·랜덤 추천)
│ ├── SavedScreen.js # 저장(북마크)된 식당 목록 화면
│ └── ProfileScreen.js # 프로필 화면 (로그인/로그아웃)
│
├── services
│ └── bookmark.js # 파이어스토어 북마크 CRUD 및 구독 로직
│
└── styles
└── styles_native.js # 공통 네이티브 스타일 정의
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
