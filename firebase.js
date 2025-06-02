// firebase.js
import Constants from 'expo-constants';
import { initializeApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getFirestore } from 'firebase/firestore';

// Expo SDK 48 이상에서는 개발(Expo Go) 환경에서 Constants.manifest가,
// 프로덕션(빌드된 앱) 환경에서는 Constants.expoConfig가 주로 사용됩니다.
// 안전하게 두 곳을 모두 확인하도록 합니다.
const appConfig = Constants.manifest?.extra ?? Constants.expoConfig?.extra;

// appConfig가 null/undefined면 에러가 발생하므로, 미리 확인합니다.
if (!appConfig) {
  throw new Error(
    '⚠️ 환경 변수를 가져올 수 없습니다. ' +
    'appConfig가 null 혹은 undefined입니다.\n' +
    '1) app.config.js가 올바로 설정되었는지,\n' +
    '2) expo start -c 로 캐시를 초기화했는지 확인하세요.'
  );
}

// optional chaining을 사용해 각각의 값이 존재하는지 검증
const {
  FIREBASE_API_KEY,
  FIREBASE_AUTH_DOMAIN,
  FIREBASE_PROJECT_ID,
  FIREBASE_STORAGE_BUCKET,
  FIREBASE_MESSAGING_SENDER_ID,
  FIREBASE_APP_ID,
  FIREBASE_MEASUREMENT_ID
} = appConfig;

// 다시 한 번 필수 값들이 있나 확인
if (
  !FIREBASE_API_KEY ||
  !FIREBASE_AUTH_DOMAIN ||
  !FIREBASE_PROJECT_ID ||
  !FIREBASE_STORAGE_BUCKET ||
  !FIREBASE_MESSAGING_SENDER_ID ||
  !FIREBASE_APP_ID
) {
  throw new Error(
    '⚠️ Firebase 환경 변수 중 일부가 누락되었습니다. ' +
    'appConfig를 console.log로 찍어 보고, ‘extra’에 모든 키가 들어있는지 확인하세요.'
  );
}

const firebaseConfig = {
  apiKey:            FIREBASE_API_KEY,
  authDomain:        FIREBASE_AUTH_DOMAIN,
  projectId:         FIREBASE_PROJECT_ID,
  storageBucket:     FIREBASE_STORAGE_BUCKET,
  messagingSenderId: FIREBASE_MESSAGING_SENDER_ID,
  appId:             FIREBASE_APP_ID,
  measurementId:     FIREBASE_MEASUREMENT_ID // measurementId는 필수가 아닙니다.
};

// 디버그용: 실제로 로드된 환경 변수를 확인해 보고 싶다면 주석을 해제하세요.
// console.log('Loaded appConfig:', appConfig);

const app = initializeApp(firebaseConfig);

const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});

const db = getFirestore(app);

export { auth, db };
