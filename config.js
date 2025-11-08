const DEV_API = 'http://localhost:3000';
const DEV_MOBILE_API = 'http://192.168.0.16:3000';
const PROD_API = 'https://api.othershorts.com';

// TEMPORARY: Use localhost for web testing until backend is deployed
// Change back to PROD_API when backend is live at api.othershorts.com
const WEB_TEST_API = 'http://localhost:3000';

export const API_IP = __DEV__
  ? (typeof document !== 'undefined' ? DEV_API : DEV_MOBILE_API)
  : (typeof document !== 'undefined' ? WEB_TEST_API : PROD_API);

export const GOOGLE_CLIENT_IDS = {
    expoClientId: process.env.EXPO_PUBLIC_EXPO_CLIENT_ID,
    webClientId: process.env.EXPO_PUBLIC_WEB_CLIENT_ID,
    androidClientId: process.env.EXPO_PUBLIC_ANDROID_CLIENT_ID,
};
