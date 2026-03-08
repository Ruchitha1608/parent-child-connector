export type UserRole = 'parent' | 'child';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  pairedWith?: string | null;
  avatarUrl?: string | null;
  pairCode?: string | null;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface LocationPoint {
  id: string;
  latitude: number;
  longitude: number;
  accuracy?: number;
  speed?: number;
  altitude?: number;
  heading?: number;
  recordedAt: string;
}

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content?: string;
  mediaUrl?: string;
  messageType: 'text' | 'image' | 'alert';
  isRead: boolean;
  sentAt: string;
  sender: {
    id: string;
    name: string;
    avatarUrl?: string | null;
  };
}

export interface Alert {
  id: string;
  childId: string;
  parentId: string;
  alertType: 'sos' | 'geofence_breach' | 'low_battery' | 'custom';
  latitude?: number;
  longitude?: number;
  message?: string;
  isResolved: boolean;
  resolvedAt?: string;
  createdAt: string;
  child?: {
    id: string;
    name: string;
    avatarUrl?: string | null;
  };
}

export interface Geofence {
  id: string;
  parentId: string;
  childId: string;
  label: string;
  centerLat: number;
  centerLng: number;
  radiusM: number;
  isActive: boolean;
  createdAt: string;
}

export interface ActivityLog {
  id: string;
  userId: string;
  eventType: string;
  description?: string;
  metadata?: Record<string, any>;
  loggedAt: string;
}

export interface Reminder {
  id: string;
  createdById: string;
  targetId: string;
  title: string;
  body?: string;
  remindAt: string;
  isSent: boolean;
  createdAt: string;
}

export interface VideoSession {
  id: string;
  childId: string;
  parentId: string;
  sessionStatus: 'requested' | 'accepted' | 'completed' | 'declined';
  requestedAt: string;
  completedAt?: string;
  snapshotUrl?: string;
}

export interface LiveLocation {
  childId: string;
  childName: string;
  latitude: number;
  longitude: number;
  accuracy?: number;
  speed?: number;
  timestamp: string;
}
