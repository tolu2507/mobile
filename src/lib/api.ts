import axios, { AxiosError, isAxiosError, type InternalAxiosRequestConfig } from 'axios';
import Constants from 'expo-constants';

import { useAuth } from '@/store/auth';
import type { Session } from '@/types/api';

/**
 * In development the API runs on the same computer as Metro, so we reuse Metro's host.
 * That makes it work on simulators and on real phones on the same Wi-Fi with no setup.
 */
function resolveApiUrl() {
  if (process.env.EXPO_PUBLIC_API_URL) return process.env.EXPO_PUBLIC_API_URL.replace(/\/+$/, '');
  const host = Constants.expoConfig?.hostUri?.split(':')[0];
  console.log({host})
  return host ? `http://${host}:3001` : 'http://localhost:3001';
}

export const API_URL = resolveApiUrl();

// ngrok's free plan can answer with a "visit site?" HTML page instead of our JSON; this header skips it.
// Set on axios defaults so the plain axios calls (token refresh, sign out) get it too.
axios.defaults.headers.common['ngrok-skip-browser-warning'] = '1';

export const api = axios.create({ baseURL: API_URL, timeout: 20000 });

api.interceptors.request.use((config) => {
  const token = useAuth.getState().accessToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Access tokens last 15 minutes. On a 401 we refresh once and replay; parallel 401s share one refresh.
let refreshing: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  const { refreshToken, signIn, clear } = useAuth.getState();
  if (!refreshToken) return null;
  try {
    const { data } = await axios.post<Session>(`${API_URL}/auth/refresh`, { refreshToken });
    signIn(data);
    return data.accessToken;
  } catch {
    clear();
    return null;
  }
}

api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as (InternalAxiosRequestConfig & { _retried?: boolean }) | undefined;
    const isAuthCall = original?.url?.startsWith('/auth/');
    if (error.response?.status !== 401 || !original || original._retried || isAuthCall) throw error;
    original._retried = true;
    refreshing ??= refreshAccessToken().finally(() => (refreshing = null));
    const token = await refreshing;
    if (!token) throw error;
    original.headers.Authorization = `Bearer ${token}`;
    return api(original);
  },
);

/** Turns any API/network error into one sentence a parent or child can read. */
export function friendlyError(error: unknown): string {
  if (isAxiosError(error)) {
    if (!error.response) return `We can't reach Nexus. Check your internet${__DEV__ ? ` (and that the API is running at ${API_URL})` : ''}.`;
    const message = (error.response.data as { message?: string | string[] } | undefined)?.message;
    if (typeof message === 'string') return message;
    if (Array.isArray(message) && message.length) return message[0];
    if (error.response.status >= 500) return 'Something went wrong on our side. Please try again.';
  }
  return 'Something went wrong. Please try again.';
}
