const DEV_API = 'http://localhost:3000';
export const API_IP = __DEV__
  ? (typeof document !== 'undefined' ? DEV_API : 'http://192.168.0.16:3000')
  : 'https://othershorts.com';

export const GOOGLE_CLIENT_IDS = {
    expoClientId: process.env.EXPO_PUBLIC_EXPO_CLIENT_ID,
    webClientId: process.env.EXPO_PUBLIC_WEB_CLIENT_ID,
    androidClientId: process.env.EXPO_PUBLIC_ANDROID_CLIENT_ID,
};
