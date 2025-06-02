// app.config.js
import 'dotenv/config';

export default ({ config }) => ({
  ...config,
  extra: {
    // 카카오
    KAKAO_JS_KEY: process.env.KAKAO_JS_KEY,
    REST_API_KEY: process.env.REST_API_KEY,

    // Firebase
    FIREBASE_API_KEY: process.env.FIREBASE_API_KEY,
    FIREBASE_AUTH_DOMAIN: process.env.FIREBASE_AUTH_DOMAIN,
    FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID,
    FIREBASE_STORAGE_BUCKET: process.env.FIREBASE_STORAGE_BUCKET,
    FIREBASE_MESSAGING_SENDER_ID: process.env.FIREBASE_MESSAGING_SENDER_ID,
    FIREBASE_APP_ID: process.env.FIREBASE_APP_ID,
    FIREBASE_MEASUREMENT_ID: process.env.FIREBASE_MEASUREMENT_ID,
  },
});
// 이 파일은 Expo 프로젝트의 환경 변수를 설정하는 데 사용됩니다.
// dotenv/config를 사용하여 .env 파일에서 환경 변수를 로드합니다.