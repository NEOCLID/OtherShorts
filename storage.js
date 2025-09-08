import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const isWeb = Platform.OS === 'web';

/**
 * Stores the user object in persistent storage (localStorage for web, AsyncStorage for native).
 * @param {object} user - The user object to store.
 */
export const storeUser = async (user) => {
  if (!user) return;
  try {
    const userString = JSON.stringify(user);
    if (isWeb) {
      localStorage.setItem('user', userString);
    } else {
      await AsyncStorage.setItem('user', userString);
    }
  } catch (e) {
    console.error("Failed to store user", e);
  }
};

/**
 * Retrieves the user object from persistent storage.
 * @returns {Promise<object|null>} - The parsed user object or null if not found.
 */
export const retrieveUser = async () => {
  try {
    const saved = isWeb ? localStorage.getItem('user') : await AsyncStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  } catch (e) {
    console.error("Failed to retrieve user", e);
    return null;
  }
};

/**
 * Removes the user object from persistent storage.
 */
export const clearUser = async () => {
  try {
    if (isWeb) {
      localStorage.removeItem('user');
    } else {
      await AsyncStorage.removeItem('user');
    }
  } catch (e) {
    console.error("Failed to clear user", e);
  }
};