import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  RefreshControl, Alert,
} from 'react-native';
import { useStore } from '../../store/useStore';
import { alertAPI } from '../../services/api';
import { Alert as AlertType } from '../../types';

const ALERT_CONFIG = {
  sos: { icon: '🆘', label: 'SOS Emergency', color: '#FEE2E2', textColor: '#991B1B' },
  geofence_breach: { icon: '⚠️', label: 'Geofence Breach', color: '#FEF3C7', textColor: '#92400E' },
  low_battery: { icon: '🔋', label: 'Low Battery', color: '#FFF7ED', textColor: '#9A3412' },
  custom: { icon: '🔔', label: 'Alert', color: '#F3F4F6', textColor: '#374151' },
};

export default function AlertsScreen({ navigation }: any) {
  const { alerts, setAlerts, resolveAlert, setHasNewAlert } = useStore();
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'open' | 'resolved'>('open');

  useEffect(() => {
    loadAlerts();
    setHasNewAlert(false);
  }, []);

  async function loadAlerts() {
    try {
      const resolved = filter === 'all' ? undefined : filter === 'resolved';
      const { data } = await alertAPI.getAlerts(resolved);
      setAlerts(data);
    } catch {}
  }

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAlerts();
    setRefreshing(false);
  };

  async function handleResolve(alertId: string) {
    try {
      await alertAPI.resolve(alertId);
      resolveAlert(alertId);
    } catch {
      Alert.alert('Error', 'Failed to resolve alert');
    }
  }

  const filtered = alerts.filter((a) => {
    if (filter === 'open') return !a.isResolved;
    if (filter === 'resolved') return a.isResolved;
    return true;
  });

  function renderAlert({ item }: { item: AlertType }) {
    const cfg = ALERT_CONFIG[item.alertType] || ALERT_CONFIG.custom;
    return (
      <View style={[styles.alertCard, { backgroundColor: cfg.color }]}>
        <View style={styles.alertHeader}>
          <Text style={styles.alertIcon}>{cfg.icon}</Text>
          <View style={{ flex: 1 }}>
            <Text style={[styles.alertLabel, { color: cfg.textColor }]}>{cfg.label}</Text>
            <Text style={styles.alertTime}>{new Date(item.createdAt).toLocaleString()}</Text>
          </View>
          {item.isResolved && (
            <View style={styles.resolvedBadge}><Text style={styles.resolvedText}>Resolved</Text></View>
          )}
        </View>

        {item.message && <Text style={styles.alertMessage}>{item.message}</Text>}

        {item.latitude != null && (
          <Text style={styles.alertCoords}>
            📍 {item.latitude.toFixed(5)}, {item.longitude?.toFixed(5)}
          </Text>
        )}

        {!item.isResolved && (
          <View style={styles.alertActions}>
            {item.latitude != null && (
              <TouchableOpacity style={styles.mapBtn} onPress={() => navigation.navigate('Map')}>
                <Text style={styles.mapBtnText}>View on Map</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.resolveBtn} onPress={() => handleResolve(item.id)}>
              <Text style={styles.resolveBtnText}>Mark Resolved</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Filter tabs */}
      <View style={styles.filterRow}>
        {(['open', 'all', 'resolved'] as const).map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterBtn, filter === f && styles.filterBtnActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(a) => a.id}
        renderItem={renderAlert}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={<Text style={styles.empty}>No alerts found</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  filterRow: { flexDirection: 'row', padding: 12, gap: 8, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  filterBtn: { flex: 1, paddingVertical: 8, borderRadius: 8, backgroundColor: '#F3F4F6', alignItems: 'center' },
  filterBtnActive: { backgroundColor: '#4F46E5' },
  filterText: { fontSize: 13, fontWeight: '600', color: '#6B7280' },
  filterTextActive: { color: '#fff' },
  list: { padding: 12, paddingBottom: 24 },
  alertCard: { borderRadius: 16, padding: 14, marginBottom: 12 },
  alertHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  alertIcon: { fontSize: 24 },
  alertLabel: { fontSize: 15, fontWeight: '700' },
  alertTime: { fontSize: 11, color: '#9CA3AF', marginTop: 2 },
  resolvedBadge: { backgroundColor: '#D1FAE5', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  resolvedText: { color: '#065F46', fontSize: 11, fontWeight: '700' },
  alertMessage: { fontSize: 13, color: '#374151', marginBottom: 6 },
  alertCoords: { fontSize: 12, color: '#6B7280', marginBottom: 8 },
  alertActions: { flexDirection: 'row', gap: 8, marginTop: 4 },
  mapBtn: { flex: 1, backgroundColor: 'rgba(255,255,255,0.7)', borderRadius: 8, paddingVertical: 8, alignItems: 'center' },
  mapBtnText: { fontSize: 13, fontWeight: '600', color: '#374151' },
  resolveBtn: { flex: 1, backgroundColor: '#10B981', borderRadius: 8, paddingVertical: 8, alignItems: 'center' },
  resolveBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  empty: { textAlign: 'center', color: '#9CA3AF', marginTop: 60, fontSize: 16 },
});
