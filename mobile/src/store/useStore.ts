import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, Message, Alert, Geofence, ActivityLog, LiveLocation, Reminder } from '../types';

interface AppState {
  // Auth
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;

  // Live data
  liveLocation: LiveLocation | null;
  pairedChild: { id: string; name: string; avatarUrl?: string | null } | null;

  // Feeds
  messages: Message[];
  alerts: Alert[];
  geofences: Geofence[];
  activityLogs: ActivityLog[];
  reminders: Reminder[];

  // UI state
  unreadCount: number;
  hasNewAlert: boolean;

  // Actions
  setAuth: (user: User, accessToken: string, refreshToken: string) => Promise<void>;
  clearAuth: () => Promise<void>;
  hydrateAuth: () => Promise<void>;

  setLiveLocation: (loc: LiveLocation) => void;
  setPairedChild: (child: { id: string; name: string; avatarUrl?: string | null } | null) => void;

  addMessage: (msg: Message) => void;
  setMessages: (msgs: Message[]) => void;
  markMessagesRead: (messageIds: string[]) => void;

  addAlert: (alert: Alert) => void;
  setAlerts: (alerts: Alert[]) => void;
  resolveAlert: (alertId: string) => void;
  setHasNewAlert: (value: boolean) => void;

  setGeofences: (fences: Geofence[]) => void;
  addGeofence: (fence: Geofence) => void;
  removeGeofence: (id: string) => void;

  setActivityLogs: (logs: ActivityLog[]) => void;
  setReminders: (reminders: Reminder[]) => void;
  addReminder: (reminder: Reminder) => void;
  removeReminder: (id: string) => void;

  setUnreadCount: (count: number) => void;
}

export const useStore = create<AppState>((set) => ({
  user: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
  liveLocation: null,
  pairedChild: null,
  messages: [],
  alerts: [],
  geofences: [],
  activityLogs: [],
  reminders: [],
  unreadCount: 0,
  hasNewAlert: false,

  setAuth: async (user, accessToken, refreshToken) => {
    await AsyncStorage.setItem('accessToken', accessToken);
    await AsyncStorage.setItem('refreshToken', refreshToken);
    await AsyncStorage.setItem('user', JSON.stringify(user));
    set({ user, accessToken, refreshToken, isAuthenticated: true });
  },

  clearAuth: async () => {
    await AsyncStorage.multiRemove(['accessToken', 'refreshToken', 'user']);
    set({
      user: null, accessToken: null, refreshToken: null,
      isAuthenticated: false, liveLocation: null, pairedChild: null,
      messages: [], alerts: [], geofences: [], activityLogs: [], reminders: [],
    });
  },

  hydrateAuth: async () => {
    const [token, refresh, userStr] = await AsyncStorage.multiGet(['accessToken', 'refreshToken', 'user']);
    if (token[1] && userStr[1]) {
      set({
        accessToken: token[1],
        refreshToken: refresh[1],
        user: JSON.parse(userStr[1]),
        isAuthenticated: true,
      });
    }
  },

  setLiveLocation: (loc) => set({ liveLocation: loc }),
  setPairedChild: (child) => set({ pairedChild: child }),

  addMessage: (msg) => set((s) => ({ messages: [msg, ...s.messages] })),
  setMessages: (msgs) => set({ messages: msgs }),
  markMessagesRead: (messageIds) =>
    set((s) => ({
      messages: s.messages.map((m) => messageIds.includes(m.id) ? { ...m, isRead: true } : m),
    })),

  addAlert: (alert) => set((s) => ({ alerts: [alert, ...s.alerts], hasNewAlert: true })),
  setAlerts: (alerts) => set({ alerts }),
  resolveAlert: (alertId) =>
    set((s) => ({
      alerts: s.alerts.map((a) => (a.id === alertId ? { ...a, isResolved: true } : a)),
    })),
  setHasNewAlert: (value) => set({ hasNewAlert: value }),

  setGeofences: (fences) => set({ geofences: fences }),
  addGeofence: (fence) => set((s) => ({ geofences: [fence, ...s.geofences] })),
  removeGeofence: (id) => set((s) => ({ geofences: s.geofences.filter((g) => g.id !== id) })),

  setActivityLogs: (logs) => set({ activityLogs: logs }),
  setReminders: (reminders) => set({ reminders }),
  addReminder: (reminder) => set((s) => ({ reminders: [...s.reminders, reminder] })),
  removeReminder: (id) => set((s) => ({ reminders: s.reminders.filter((r) => r.id !== id) })),

  setUnreadCount: (count) => set({ unreadCount: count }),
}));
