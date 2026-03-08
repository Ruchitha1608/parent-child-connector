import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, TouchableOpacity } from 'react-native';
import { useStore } from '../../store/useStore';
import { activityAPI, reminderAPI } from '../../services/api';
import { ActivityLog, Reminder } from '../../types';

const EVENT_ICONS: Record<string, string> = {
  location_update: '📍',
  message_sent: '💬',
  sos_triggered: '🆘',
  geofence_breach: '⚠️',
  app_open: '📱',
  video_call: '📹',
  default: '📋',
};

export default function ActivityScreen() {
  const { activityLogs, setActivityLogs, pairedChild, reminders, setReminders } = useStore();
  const [refreshing, setRefreshing] = useState(false);
  const [tab, setTab] = useState<'activity' | 'reminders'>('activity');

  useEffect(() => {
    loadAll();
  }, []);

  async function loadAll() {
    try {
      const [actRes, remRes] = await Promise.allSettled([
        activityAPI.get(pairedChild?.id, undefined, 100),
        reminderAPI.list(),
      ]);
      if (actRes.status === 'fulfilled') setActivityLogs(actRes.value.data);
      if (remRes.status === 'fulfilled') setReminders(remRes.value.data);
    } catch {}
  }

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAll();
    setRefreshing(false);
  };

  function renderActivity({ item }: { item: ActivityLog }) {
    const icon = EVENT_ICONS[item.eventType] || EVENT_ICONS.default;
    return (
      <View style={styles.row}>
        <View style={styles.iconWrap}><Text style={styles.icon}>{icon}</Text></View>
        <View style={{ flex: 1 }}>
          <Text style={styles.eventType}>{item.eventType.replace(/_/g, ' ')}</Text>
          {item.description && <Text style={styles.desc}>{item.description}</Text>}
          <Text style={styles.time}>{new Date(item.loggedAt).toLocaleString()}</Text>
        </View>
      </View>
    );
  }

  function renderReminder({ item }: { item: Reminder }) {
    const past = new Date(item.remindAt) < new Date();
    return (
      <View style={[styles.reminderCard, past && styles.pastReminder]}>
        <Text style={styles.reminderTitle}>{item.title}</Text>
        {item.body && <Text style={styles.reminderBody}>{item.body}</Text>}
        <Text style={styles.reminderTime}>
          🕐 {new Date(item.remindAt).toLocaleString()}
          {item.isSent ? '  ✓ Sent' : '  ⏳ Pending'}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.tabs}>
        <TouchableOpacity style={[styles.tab, tab === 'activity' && styles.activeTab]} onPress={() => setTab('activity')}>
          <Text style={[styles.tabText, tab === 'activity' && styles.activeTabText]}>Activity Log</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.tab, tab === 'reminders' && styles.activeTab]} onPress={() => setTab('reminders')}>
          <Text style={[styles.tabText, tab === 'reminders' && styles.activeTabText]}>Reminders</Text>
        </TouchableOpacity>
      </View>

      {tab === 'activity' ? (
        <FlatList
          data={activityLogs}
          keyExtractor={(l) => l.id}
          renderItem={renderActivity}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={<Text style={styles.empty}>No activity yet</Text>}
        />
      ) : (
        <FlatList
          data={reminders}
          keyExtractor={(r) => r.id}
          renderItem={renderReminder}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={<Text style={styles.empty}>No reminders set</Text>}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  tabs: { flexDirection: 'row', backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  tab: { flex: 1, paddingVertical: 14, alignItems: 'center' },
  activeTab: { borderBottomWidth: 2, borderBottomColor: '#4F46E5' },
  tabText: { fontSize: 14, fontWeight: '600', color: '#9CA3AF' },
  activeTabText: { color: '#4F46E5' },
  list: { padding: 12, paddingBottom: 24 },
  row: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 12,
    backgroundColor: '#fff', borderRadius: 12, padding: 12, marginBottom: 8,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 2,
  },
  iconWrap: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#EEF2FF', justifyContent: 'center', alignItems: 'center' },
  icon: { fontSize: 18 },
  eventType: { fontSize: 14, fontWeight: '600', color: '#374151', textTransform: 'capitalize' },
  desc: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  time: { fontSize: 11, color: '#9CA3AF', marginTop: 4 },
  reminderCard: {
    backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 8,
    borderLeftWidth: 4, borderLeftColor: '#4F46E5',
  },
  pastReminder: { borderLeftColor: '#D1D5DB', opacity: 0.7 },
  reminderTitle: { fontSize: 15, fontWeight: '700', color: '#111827' },
  reminderBody: { fontSize: 13, color: '#6B7280', marginTop: 4 },
  reminderTime: { fontSize: 12, color: '#9CA3AF', marginTop: 6 },
  empty: { textAlign: 'center', color: '#9CA3AF', marginTop: 60, fontSize: 16 },
});
