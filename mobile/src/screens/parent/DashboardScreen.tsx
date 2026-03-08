import React, { useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, Alert,
} from 'react-native';
import { useStore } from '../../store/useStore';
import { alertAPI, activityAPI, userAPI, messageAPI } from '../../services/api';
import { getSocket, connectSocket } from '../../services/socket';
import { Alert as AlertType, LiveLocation } from '../../types';

export default function DashboardScreen({ navigation }: any) {
  const {
    user, liveLocation, pairedChild, alerts, activityLogs,
    setLiveLocation, setPairedChild, setAlerts, setActivityLogs,
    addAlert, setHasNewAlert, setUnreadCount,
  } = useStore();

  const [refreshing, setRefreshing] = React.useState(false);

  const loadData = useCallback(async () => {
    try {
      const [childRes, alertsRes, activityRes, unreadRes] = await Promise.allSettled([
        userAPI.pairedChild(),
        alertAPI.getAlerts(false),
        activityAPI.get(undefined, undefined, 20),
        messageAPI.unreadCount(),
      ]);

      if (childRes.status === 'fulfilled') setPairedChild(childRes.value.data);
      if (alertsRes.status === 'fulfilled') setAlerts(alertsRes.value.data);
      if (activityRes.status === 'fulfilled') setActivityLogs(activityRes.value.data);
      if (unreadRes.status === 'fulfilled') setUnreadCount(unreadRes.value.data.count);
    } catch (err) {
      console.error('Dashboard load error:', err);
    }
  }, []);

  useEffect(() => {
    loadData();

    // Set up real-time socket listeners
    connectSocket().then((socket) => {
      socket.on('child:location', (loc: LiveLocation) => {
        setLiveLocation(loc);
      });

      socket.on('alert:sos', (data: any) => {
        addAlert({ ...data, alertType: 'sos', isResolved: false, createdAt: data.timestamp });
        setHasNewAlert(true);
        Alert.alert(
          '🆘 SOS Alert!',
          `${data.childName || 'Your child'} triggered an SOS alert!\nLocation: ${data.latitude?.toFixed(4)}, ${data.longitude?.toFixed(4)}`,
          [
            { text: 'View Map', onPress: () => navigation.navigate('Map') },
            { text: 'OK' },
          ]
        );
      });

      socket.on('alert:incoming', (data: any) => {
        addAlert({ ...data, isResolved: false, createdAt: data.timestamp });
        setHasNewAlert(true);
      });
    });

    return () => {
      const socket = getSocket();
      socket?.off('child:location');
      socket?.off('alert:sos');
      socket?.off('alert:incoming');
    };
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const openAlerts = alerts.filter((a) => !a.isResolved);

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Child Status Card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Child Status</Text>
        <View style={styles.childRow}>
          <View style={styles.avatar}><Text style={styles.avatarText}>👧</Text></View>
          <View style={{ flex: 1 }}>
            <Text style={styles.childName}>{pairedChild?.name || 'Not paired'}</Text>
            {liveLocation ? (
              <>
                <Text style={styles.locationText}>
                  📍 {liveLocation.latitude.toFixed(5)}, {liveLocation.longitude.toFixed(5)}
                </Text>
                <Text style={styles.timestampText}>
                  Updated: {new Date(liveLocation.timestamp).toLocaleTimeString()}
                </Text>
              </>
            ) : (
              <Text style={styles.noDataText}>No location data yet</Text>
            )}
          </View>
          <View style={[styles.statusDot, liveLocation ? styles.statusOnline : styles.statusOffline]} />
        </View>
        <TouchableOpacity style={styles.viewMapBtn} onPress={() => navigation.navigate('Map')}>
          <Text style={styles.viewMapText}>View on Map →</Text>
        </TouchableOpacity>
      </View>

      {/* Active Alerts */}
      <View style={styles.card}>
        <View style={styles.rowBetween}>
          <Text style={styles.cardTitle}>Active Alerts</Text>
          {openAlerts.length > 0 && (
            <View style={styles.badge}><Text style={styles.badgeText}>{openAlerts.length}</Text></View>
          )}
        </View>
        {openAlerts.length === 0 ? (
          <Text style={styles.noDataText}>No active alerts</Text>
        ) : (
          openAlerts.slice(0, 3).map((alert) => (
            <View key={alert.id} style={[styles.alertRow, alert.alertType === 'sos' && styles.sosRow]}>
              <Text style={styles.alertIcon}>{alert.alertType === 'sos' ? '🆘' : '⚠️'}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.alertText}>{alert.message}</Text>
                <Text style={styles.alertTime}>{new Date(alert.createdAt).toLocaleString()}</Text>
              </View>
            </View>
          ))
        )}
        {openAlerts.length > 0 && (
          <TouchableOpacity onPress={() => navigation.navigate('Alerts')}>
            <Text style={styles.viewAllText}>View all alerts →</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Recent Activity */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Recent Activity</Text>
        {activityLogs.slice(0, 5).map((log) => (
          <View key={log.id} style={styles.activityRow}>
            <Text style={styles.activityIcon}>{eventIcon(log.eventType)}</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.activityText}>{log.eventType.replace(/_/g, ' ')}</Text>
              {log.description && <Text style={styles.activityDesc}>{log.description}</Text>}
              <Text style={styles.activityTime}>{new Date(log.loggedAt).toLocaleString()}</Text>
            </View>
          </View>
        ))}
        {activityLogs.length === 0 && <Text style={styles.noDataText}>No recent activity</Text>}
      </View>
    </ScrollView>
  );
}

function eventIcon(type: string) {
  const map: Record<string, string> = {
    location_update: '📍',
    message_sent: '💬',
    sos_triggered: '🆘',
    geofence_breach: '⚠️',
    app_open: '📱',
  };
  return map[type] || '📋';
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6', padding: 16 },
  card: {
    backgroundColor: '#fff', borderRadius: 16, padding: 16,
    marginBottom: 16, shadowColor: '#000', shadowOpacity: 0.06,
    shadowRadius: 8, elevation: 3,
  },
  cardTitle: { fontSize: 17, fontWeight: '700', color: '#111827', marginBottom: 12 },
  childRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: {
    width: 48, height: 48, borderRadius: 24, backgroundColor: '#EEF2FF',
    justifyContent: 'center', alignItems: 'center',
  },
  avatarText: { fontSize: 24 },
  childName: { fontSize: 16, fontWeight: '700', color: '#111827' },
  locationText: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  timestampText: { fontSize: 11, color: '#9CA3AF' },
  noDataText: { fontSize: 13, color: '#9CA3AF', fontStyle: 'italic' },
  statusDot: { width: 12, height: 12, borderRadius: 6 },
  statusOnline: { backgroundColor: '#10B981' },
  statusOffline: { backgroundColor: '#D1D5DB' },
  viewMapBtn: { marginTop: 12, backgroundColor: '#EEF2FF', borderRadius: 8, padding: 10 },
  viewMapText: { color: '#4F46E5', fontWeight: '600', textAlign: 'center' },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  badge: { backgroundColor: '#EF4444', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2 },
  badgeText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  alertRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    padding: 10, backgroundColor: '#FEF3C7', borderRadius: 10, marginBottom: 8,
  },
  sosRow: { backgroundColor: '#FEE2E2' },
  alertIcon: { fontSize: 20 },
  alertText: { fontSize: 13, fontWeight: '600', color: '#374151' },
  alertTime: { fontSize: 11, color: '#9CA3AF' },
  viewAllText: { color: '#4F46E5', fontSize: 13, fontWeight: '600', textAlign: 'center', marginTop: 4 },
  activityRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 10 },
  activityIcon: { fontSize: 18, marginTop: 2 },
  activityText: { fontSize: 13, fontWeight: '600', color: '#374151', textTransform: 'capitalize' },
  activityDesc: { fontSize: 12, color: '#6B7280' },
  activityTime: { fontSize: 11, color: '#9CA3AF' },
});
