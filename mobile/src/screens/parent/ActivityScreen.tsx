import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, RefreshControl, TouchableOpacity,
  Modal, TextInput, Alert, ScrollView, Platform,
} from 'react-native';
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
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [dateStr, setDateStr] = useState('');
  const [timeStr, setTimeStr] = useState('');
  const [saving, setSaving] = useState(false);

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

  function openModal() {
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    setDateStr(`${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`);
    setTimeStr(`${pad(now.getHours())}:${pad(now.getMinutes())}`);
    setTitle('');
    setBody('');
    setShowModal(true);
  }

  async function saveReminder() {
    if (!title.trim()) { Alert.alert('Error', 'Title is required'); return; }
    if (!dateStr || !timeStr) { Alert.alert('Error', 'Date and time are required'); return; }
    if (!pairedChild?.id) { Alert.alert('Error', 'No child paired'); return; }

    const remindAt = new Date(`${dateStr}T${timeStr}:00`);
    if (isNaN(remindAt.getTime())) { Alert.alert('Error', 'Invalid date/time format'); return; }
    if (remindAt <= new Date()) { Alert.alert('Error', 'Reminder must be in the future'); return; }

    setSaving(true);
    try {
      await reminderAPI.create({
        targetId: pairedChild.id,
        title: title.trim(),
        body: body.trim() || undefined,
        remindAt: remindAt.toISOString(),
      });
      setShowModal(false);
      await loadAll();
      Alert.alert('Success', 'Reminder created!');
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.error || 'Failed to create reminder');
    } finally {
      setSaving(false);
    }
  }

  async function deleteReminder(id: string) {
    Alert.alert('Delete Reminder', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          try {
            await reminderAPI.delete(id);
            await loadAll();
          } catch {
            Alert.alert('Error', 'Failed to delete reminder');
          }
        },
      },
    ]);
  }

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
        <View style={styles.reminderHeader}>
          <Text style={styles.reminderTitle}>{item.title}</Text>
          <TouchableOpacity onPress={() => deleteReminder(item.id)}>
            <Text style={styles.deleteBtn}>🗑</Text>
          </TouchableOpacity>
        </View>
        {item.body ? <Text style={styles.reminderBody}>{item.body}</Text> : null}
        <Text style={styles.reminderTime}>
          {'🕐 '}{new Date(item.remindAt).toLocaleString()}
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
        <>
          <TouchableOpacity style={styles.addBtn} onPress={openModal}>
            <Text style={styles.addBtnText}>+ Set Reminder</Text>
          </TouchableOpacity>
          <FlatList
            data={reminders}
            keyExtractor={(r) => r.id}
            renderItem={renderReminder}
            contentContainerStyle={styles.list}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            ListEmptyComponent={<Text style={styles.empty}>No reminders set</Text>}
          />
        </>
      )}

      <Modal visible={showModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Set Reminder</Text>

            <Text style={styles.label}>Title *</Text>
            <TextInput
              style={styles.input}
              value={title}
              onChangeText={setTitle}
              placeholder="e.g. Take medicine"
              maxLength={100}
            />

            <Text style={styles.label}>Message (optional)</Text>
            <TextInput
              style={[styles.input, styles.multiline]}
              value={body}
              onChangeText={setBody}
              placeholder="Additional details..."
              multiline
              numberOfLines={3}
              maxLength={300}
            />

            <Text style={styles.label}>Date (YYYY-MM-DD) *</Text>
            <TextInput
              style={styles.input}
              value={dateStr}
              onChangeText={setDateStr}
              placeholder="2025-12-31"
              keyboardType="numbers-and-punctuation"
              maxLength={10}
            />

            <Text style={styles.label}>Time (HH:MM, 24h) *</Text>
            <TextInput
              style={styles.input}
              value={timeStr}
              onChangeText={setTimeStr}
              placeholder="14:30"
              keyboardType="numbers-and-punctuation"
              maxLength={5}
            />

            <View style={styles.modalBtns}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowModal(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.saveBtn, saving && { opacity: 0.6 }]} onPress={saveReminder} disabled={saving}>
                <Text style={styles.saveBtnText}>{saving ? 'Saving...' : 'Save'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  addBtn: {
    margin: 12, marginBottom: 0, backgroundColor: '#4F46E5',
    borderRadius: 12, paddingVertical: 12, alignItems: 'center',
  },
  addBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
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
  reminderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  reminderTitle: { fontSize: 15, fontWeight: '700', color: '#111827', flex: 1 },
  deleteBtn: { fontSize: 18, paddingLeft: 8 },
  reminderBody: { fontSize: 13, color: '#6B7280', marginTop: 4 },
  reminderTime: { fontSize: 12, color: '#9CA3AF', marginTop: 6 },
  empty: { textAlign: 'center', color: '#9CA3AF', marginTop: 60, fontSize: 16 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalBox: {
    backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 24, paddingBottom: 40,
  },
  modalTitle: { fontSize: 18, fontWeight: '800', color: '#111827', marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 4, marginTop: 12 },
  input: {
    borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: '#111827',
    backgroundColor: '#F9FAFB',
  },
  multiline: { height: 80, textAlignVertical: 'top' },
  modalBtns: { flexDirection: 'row', gap: 12, marginTop: 24 },
  cancelBtn: { flex: 1, borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  cancelBtnText: { fontSize: 15, fontWeight: '600', color: '#6B7280' },
  saveBtn: { flex: 1, backgroundColor: '#4F46E5', borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
  saveBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },
});
