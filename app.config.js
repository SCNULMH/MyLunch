import 'dotenv/config';

export default ({ config }) => ({
  ...config,
  extra: {
    KAKAO_JS_KEY: process.env.KAKAO_JS_KEY,
    REST_API_KEY: process.env.REST_API_KEY,
  },
});
