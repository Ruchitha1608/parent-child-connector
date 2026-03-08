import { io, Socket } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SOCKET_URL = process.env.EXPO_PUBLIC_SOCKET_URL || 'http://192.168.29.41:3000';

let socket: Socket | null = null;

export async function connectSocket(): Promise<Socket> {
  if (socket?.connected) return socket;

  const token = await AsyncStorage.getItem('accessToken');
  if (!token) throw new Error('No access token for socket connection');

  socket = io(SOCKET_URL, {
    auth: { token },
    transports: ['websocket'],
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 2000,
  });

  socket.on('connect', () => console.log('[Socket] Connected:', socket?.id));
  socket.on('disconnect', (reason) => console.log('[Socket] Disconnected:', reason));
  socket.on('connect_error', (err) => console.error('[Socket] Error:', err.message));

  return socket;
}

export function getSocket(): Socket | null {
  return socket;
}

export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

export function emitLocation(data: {
  latitude: number;
  longitude: number;
  accuracy?: number;
  speed?: number | null;
  altitude?: number | null;
  heading?: number | null;
}): void {
  socket?.emit('location:update', data);
}

export function emitSOS(latitude?: number, longitude?: number): void {
  socket?.emit('alert:sos', { latitude, longitude });
}

export function emitMessage(content: string, mediaUrl?: string, messageType?: string): void {
  socket?.emit('message:send', { content, mediaUrl, messageType: messageType || 'text' });
}

export function emitTyping(): void {
  socket?.emit('message:typing');
}

// WebRTC signaling emitters
export function emitVideoOffer(sessionId: string, targetUserId: string, sdp: any): void {
  socket?.emit('video:offer', { sessionId, targetUserId, sdp });
}

export function emitVideoAnswer(sessionId: string, targetUserId: string, sdp: any): void {
  socket?.emit('video:answer', { sessionId, targetUserId, sdp });
}

export function emitIceCandidate(sessionId: string, targetUserId: string, candidate: any): void {
  socket?.emit('video:ice-candidate', { sessionId, targetUserId, candidate });
}

export function emitVideoEnd(sessionId: string, targetUserId: string): void {
  socket?.emit('video:end', { sessionId, targetUserId });
}
