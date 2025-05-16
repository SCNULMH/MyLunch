// firebase.js
import { initializeApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getFirestore } from 'firebase/firestore';

// Firebase 콘솔에서 복사한 설정 객체
const firebaseConfig = {
  apiKey: "AIzaSyDV9eBomaHDkxu9KV-oZvLfiywAG8bTCn8",
  authDomain: "lunch-b805b.firebaseapp.com",
  projectId: "lunch-b805b",
  storageBucket: "lunch-b805b.appspot.com",
  messagingSenderId: "1010653253450",
  appId: "1:1010653253450:web:a4f5bb7bbefe6a5dea7bb3",
  measurementId: "G-K8SV1P4NHH"
};

const app = initializeApp(firebaseConfig);

// React Native 전용 Auth 초기화 (AsyncStorage 기반으로 영속성 설정)
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});

const db = getFirestore(app);

export { auth, db };
