import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.29.41:3000/api/v1';

const api: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    'bypass-tunnel-reminder': 'true',
  },
});

// Attach access token to every request
api.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  const token = await AsyncStorage.getItem('accessToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auto-refresh on 401
api.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refreshToken = await AsyncStorage.getItem('refreshToken');
        if (!refreshToken) throw new Error('No refresh token');

        const { data } = await axios.post(`${BASE_URL}/auth/refresh`, { refreshToken });
        await AsyncStorage.setItem('accessToken', data.accessToken);
        await AsyncStorage.setItem('refreshToken', data.refreshToken);

        originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
        return api(originalRequest);
      } catch {
        await AsyncStorage.multiRemove(['accessToken', 'refreshToken', 'user']);
        // App will detect missing token and redirect to login
        return Promise.reject(error);
      }
    }
    return Promise.reject(error);
  }
);

// ─── Auth ────────────────────────────────────────────────────────────────────

export const authAPI = {
  register: (data: { name: string; email: string; phone?: string; password: string; role: 'parent' | 'child' }) =>
    api.post('/auth/register', data),
  login: (data: { email: string; password: string }) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  pair: (pairCode: string) => api.post('/auth/pair', { pairCode }),
  me: () => api.get('/auth/me'),
};

// ─── Location ────────────────────────────────────────────────────────────────

export const locationAPI = {
  update: (data: { latitude: number; longitude: number; accuracy?: number; speed?: number; altitude?: number; heading?: number }) =>
    api.post('/location/update', data),
  latest: (childId?: string) => api.get('/location/latest', { params: { childId } }),
  history: (childId: string, date?: string, limit?: number) =>
    api.get('/location/history', { params: { childId, date, limit } }),
};

// ─── Messages ────────────────────────────────────────────────────────────────

export const messageAPI = {
  getMessages: (limit?: number, before?: string) =>
    api.get('/messages', { params: { limit, before } }),
  markRead: (messageIds: string[]) => api.patch('/messages/read', { messageIds }),
  unreadCount: () => api.get('/messages/unread'),
};

// ─── Alerts ──────────────────────────────────────────────────────────────────

export const alertAPI = {
  triggerSOS: (latitude?: number, longitude?: number) =>
    api.post('/alerts/sos', { latitude, longitude }),
  getAlerts: (resolved?: boolean) =>
    api.get('/alerts', { params: { resolved } }),
  resolve: (alertId: string) => api.patch(`/alerts/${alertId}/resolve`),
};

// ─── Geofences ───────────────────────────────────────────────────────────────

export const geofenceAPI = {
  create: (data: { childId: string; label: string; centerLat: number; centerLng: number; radiusM: number }) =>
    api.post('/geofences', data),
  list: (childId: string) => api.get('/geofences', { params: { childId } }),
  delete: (id: string) => api.delete(`/geofences/${id}`),
  toggle: (id: string, isActive: boolean) => api.patch(`/geofences/${id}/toggle`, { isActive }),
};

// ─── Activity ────────────────────────────────────────────────────────────────

export const activityAPI = {
  get: (childId?: string, eventType?: string, limit?: number) =>
    api.get('/activity', { params: { childId, eventType, limit } }),
  log: (eventType: string, description?: string, metadata?: any) =>
    api.post('/activity', { eventType, description, metadata }),
};

// ─── Reminders ───────────────────────────────────────────────────────────────

export const reminderAPI = {
  create: (data: { targetId: string; title: string; body?: string; remindAt: string }) =>
    api.post('/reminders', data),
  list: () => api.get('/reminders'),
  delete: (id: string) => api.delete(`/reminders/${id}`),
};

// ─── Video ───────────────────────────────────────────────────────────────────

export const videoAPI = {
  request: () => api.post('/video/request'),
  respond: (sessionId: string, accept: boolean) =>
    api.post('/video/respond', { sessionId, accept }),
  complete: (sessionId: string, snapshotUrl?: string) =>
    api.post('/video/complete', { sessionId, snapshotUrl }),
  selfie: (snapshotUrl: string) => api.post('/video/selfie', { snapshotUrl }),
  history: () => api.get('/video/history'),
  myHistory: () => api.get('/video/my-history'),
};

// ─── Media ───────────────────────────────────────────────────────────────────

export const mediaAPI = {
  upload: (uri: string, type: string, name: string, folder?: string) => {
    const form = new FormData();
    form.append('file', { uri, type, name } as any);
    if (folder) form.append('folder', folder);
    return api.post('/media/upload', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

// ─── Users ───────────────────────────────────────────────────────────────────

export const userAPI = {
  pairedChild: () => api.get('/users/paired-child'),
  pairedParent: () => api.get('/users/paired-parent'),
  updateProfile: (data: { name?: string; phone?: string }) => api.patch('/users/me', data),
};

export default api;
