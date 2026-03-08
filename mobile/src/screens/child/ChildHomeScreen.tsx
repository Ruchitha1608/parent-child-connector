import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Alert,
  ScrollView, Vibration, Animated,
} from 'react-native';
import { useStore } from '../../store/useStore';
import { alertAPI, activityAPI, userAPI } from '../../services/api';
import { connectSocket, getSocket, emitSOS } from '../../services/socket';
import { startLocationTracking, stopLocationTracking, getCurrentLocation } from '../../services/location';
import { getSocket as getSocketInstance } from '../../services/socket';
import * as Notifications from 'expo-notifications';

export default function ChildHomeScreen() {
  const { user, activityLogs, setActivityLogs } = useStore();
  const [isTracking, setIsTracking] = useState(false);
  const [parentName, setParentName] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const sosScale = React.useRef(new Animated.Value(1)).current;

  useEffect(() => {
    loadParent();
    loadActivity();

    connectSocket().then((socket) => {
      socket.on('reminder:fire', (data: any) => {
        Notifications.scheduleNotificationAsync({ content: { title: '⏰ Reminder', body: data.title + (data.body ? ': ' + data.body : ''), sound: true }, trigger: null });
        Alert.alert('⏰ Reminder', `${data.title}\n${data.body || ''}`);
      });
      socket.on('video:request', (data: any) => {
        Alert.alert(
          '📹 Video Check-in Request',
          'Your parent wants to do a live video check-in.',
          [
            { text: 'Decline', style: 'destructive', onPress: () => respondVideo(data.sessionId, false) },
            { text: 'Accept', onPress: () => respondVideo(data.sessionId, true) },
          ]
        );
      });
    });

    return () => {
      const socket = getSocket();
      socket?.off('reminder:fire');
      socket?.off('video:request');
    };
  }, []);

  async function respondVideo(sessionId: string, accept: boolean) {
    const { videoAPI } = await import('../../services/api');
    await videoAPI.respond(sessionId, accept);
  }

  async function loadParent() {
    try {
      const { data } = await userAPI.pairedParent();
      setParentName(data.name);
    } catch {}
  }

  async function loadActivity() {
    try {
      const { data } = await activityAPI.get(undefined, undefined, 10);
      setActivityLogs(data);
    } catch {}
  }

  async function toggleTracking() {
    if (isTracking) {
      stopLocationTracking();
      setIsTracking(false);
      await activityAPI.log('location_tracking_stopped', 'Child stopped sharing location');
    } else {
      await startLocationTracking();
      setIsTracking(true);
      await activityAPI.log('location_tracking_started', 'Child started sharing location');
    }
  }

  function animateSOS() {
    Animated.sequence([
      Animated.timing(sosScale, { toValue: 0.92, duration: 100, useNativeDriver: true }),
      Animated.timing(sosScale, { toValue: 1, duration: 100, useNativeDriver: true }),
    ]).start();
  }

  async function handleSOS() {
    animateSOS();
    Vibration.vibrate([0, 200, 100, 200]);

    Alert.alert(
      '🆘 Send SOS Alert?',
      'This will immediately alert your parent with your current location.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send SOS',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              const loc = await getCurrentLocation();
              // Emit via socket for speed
              emitSOS(loc?.coords.latitude, loc?.coords.longitude);
              // Also call REST as fallback
              await alertAPI.triggerSOS(loc?.coords.latitude, loc?.coords.longitude);
              Alert.alert('SOS Sent', 'Your parent has been notified!');
              await activityAPI.log('sos_triggered', 'Child sent SOS');
            } catch (err: any) {
              Alert.alert('Error', 'Failed to send SOS: ' + err.message);
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Status Card */}
      <View style={styles.card}>
        <Text style={styles.greeting}>Hello, {user?.name?.split(' ')[0]}! 👋</Text>
        {parentName && <Text style={styles.parentText}>Your parent: <Text style={styles.bold}>{parentName}</Text></Text>}
        <View style={styles.trackRow}>
          <View style={[styles.trackDot, isTracking ? styles.trackDotOn : styles.trackDotOff]} />
          <Text style={styles.trackText}>
            Location sharing: <Text style={[styles.bold, isTracking ? styles.green : styles.gray]}>
              {isTracking ? 'On' : 'Off'}
            </Text>
          </Text>
        </View>
      </View>

      {/* SOS Button */}
      <View style={styles.sosSection}>
        <Text style={styles.sosHint}>Hold if you need help</Text>
        <Animated.View style={{ transform: [{ scale: sosScale }] }}>
          <TouchableOpacity
            style={[styles.sosBtn, loading && styles.sosBtnDisabled]}
            onPress={handleSOS}
            disabled={loading}
            activeOpacity={0.85}
          >
            <Text style={styles.sosBtnText}>🆘</Text>
            <Text style={styles.sosBtnLabel}>SOS</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>

      {/* Toggle Location Tracking */}
      <TouchableOpacity style={[styles.trackBtn, isTracking && styles.trackBtnActive]} onPress={toggleTracking}>
        <Text style={[styles.trackBtnText, isTracking && styles.trackBtnTextActive]}>
          {isTracking ? '⏹ Stop Sharing Location' : '▶ Start Sharing Location'}
        </Text>
      </TouchableOpacity>

      {/* Recent Activity */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Recent Activity</Text>
        {activityLogs.slice(0, 5).map((log) => (
          <View key={log.id} style={styles.actRow}>
            <Text style={styles.actIcon}>
              {log.eventType === 'sos_triggered' ? '🆘' : log.eventType === 'location_update' ? '📍' : '📋'}
            </Text>
            <View>
              <Text style={styles.actType}>{log.eventType.replace(/_/g, ' ')}</Text>
              <Text style={styles.actTime}>{new Date(log.loggedAt).toLocaleString()}</Text>
            </View>
          </View>
        ))}
        {activityLogs.length === 0 && <Text style={styles.noData}>No recent activity</Text>}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  content: { padding: 16, paddingBottom: 32 },
  card: {
    backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 16,
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
  },
  greeting: { fontSize: 22, fontWeight: '800', color: '#111827', marginBottom: 4 },
  parentText: { fontSize: 14, color: '#6B7280', marginBottom: 12 },
  bold: { fontWeight: '700', color: '#111827' },
  trackRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  trackDot: { width: 10, height: 10, borderRadius: 5 },
  trackDotOn: { backgroundColor: '#10B981' },
  trackDotOff: { backgroundColor: '#D1D5DB' },
  trackText: { fontSize: 14, color: '#374151' },
  green: { color: '#10B981' },
  gray: { color: '#9CA3AF' },

  sosSection: { alignItems: 'center', marginBottom: 20 },
  sosHint: { fontSize: 13, color: '#9CA3AF', marginBottom: 12 },
  sosBtn: {
    width: 160, height: 160, borderRadius: 80,
    backgroundColor: '#EF4444', justifyContent: 'center', alignItems: 'center',
    shadowColor: '#EF4444', shadowOpacity: 0.4, shadowRadius: 20, elevation: 12,
    borderWidth: 6, borderColor: '#FCA5A5',
  },
  sosBtnDisabled: { opacity: 0.6 },
  sosBtnText: { fontSize: 48 },
  sosBtnLabel: { fontSize: 18, fontWeight: '900', color: '#fff', letterSpacing: 4, marginTop: 4 },

  trackBtn: {
    backgroundColor: '#fff', borderWidth: 2, borderColor: '#4F46E5',
    borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginBottom: 16,
  },
  trackBtnActive: { backgroundColor: '#4F46E5' },
  trackBtnText: { fontSize: 15, fontWeight: '700', color: '#4F46E5' },
  trackBtnTextActive: { color: '#fff' },

  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 10 },
  actRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  actIcon: { fontSize: 18 },
  actType: { fontSize: 13, fontWeight: '600', color: '#374151', textTransform: 'capitalize' },
  actTime: { fontSize: 11, color: '#9CA3AF' },
  noData: { fontSize: 13, color: '#9CA3AF', fontStyle: 'italic' },
});
