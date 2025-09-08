const DEV_API = 'http://localhost:3000';
export const API_IP = __DEV__
  ? (typeof document !== 'undefined' ? DEV_API : 'http://192.168.0.16:3000')
  : 'https://othershorts.com';
