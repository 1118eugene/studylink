import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import type { User } from '../types/api';

const TOKEN_KEY = 'studylink.mobile.token';
const USER_KEY = 'studylink.mobile.user';

async function getItem(key: string) {
  return Platform.OS === 'web' ? localStorage.getItem(key) : SecureStore.getItemAsync(key);
}

async function setItem(key: string, value: string) {
  if (Platform.OS === 'web') localStorage.setItem(key, value);
  else await SecureStore.setItemAsync(key, value);
}

async function removeItem(key: string) {
  if (Platform.OS === 'web') localStorage.removeItem(key);
  else await SecureStore.deleteItemAsync(key);
}

export async function loadAuth() {
  const [token, rawUser] = await Promise.all([
    getItem(TOKEN_KEY),
    getItem(USER_KEY),
  ]);

  if (!token || !rawUser) return null;

  try {
    return { token, user: JSON.parse(rawUser) as User };
  } catch {
    await clearAuth();
    return null;
  }
}

export async function saveAuth(token: string, user: User) {
  await Promise.all([
    setItem(TOKEN_KEY, token),
    setItem(USER_KEY, JSON.stringify(user)),
  ]);
}

export async function clearAuth() {
  await Promise.all([
    removeItem(TOKEN_KEY),
    removeItem(USER_KEY),
  ]);
}
