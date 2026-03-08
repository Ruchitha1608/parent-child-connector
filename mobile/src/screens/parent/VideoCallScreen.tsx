import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { videoAPI } from '../../services/api';
import { useStore } from '../../store/useStore';

export default function VideoCallScreen() {
  const { pairedChild } = useStore();
  const [requesting, setRequesting] = useState(false);

  async function requestVideoCall() {
    if (!pairedChild) return Alert.alert('No child paired', 'Pair with your child first');
    setRequesting(true);
    try {
      await videoAPI.request();
      Alert.alert('Request Sent', `Video check-in request sent to ${pairedChild.name}.\nWebRTC call requires a dev build to connect.`);
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.error || 'Failed to send request');
    } finally {
      setRequesting(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.icon}>📹</Text>
      <Text style={styles.title}>Video Check-in</Text>
      <Text style={styles.subtitle}>
        {pairedChild
          ? `Send a video check-in request to ${pairedChild.name}`
          : 'No child paired yet'}
      </Text>

      <TouchableOpacity
        style={[styles.btn, (requesting || !pairedChild) && styles.btnDisabled]}
        onPress={requestVideoCall}
        disabled={requesting || !pairedChild}
      >
        <Text style={styles.btnText}>
          {requesting ? 'Sending request...' : '📞 Request Video Check-in'}
        </Text>
      </TouchableOpacity>

      <View style={styles.note}>
        <Text style={styles.noteTitle}>Note</Text>
        <Text style={styles.noteText}>
          Live P2P video (WebRTC) requires a custom dev build.{'\n'}
          The request/signaling system is fully functional.{'\n'}
          Run with EAS Dev Build for full video support.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32, backgroundColor: '#111827' },
  icon: { fontSize: 72, marginBottom: 16 },
  title: { fontSize: 24, fontWeight: '800', color: '#fff', marginBottom: 8, textAlign: 'center' },
  subtitle: { fontSize: 14, color: '#9CA3AF', textAlign: 'center', marginBottom: 32 },
  btn: { backgroundColor: '#4F46E5', borderRadius: 14, paddingVertical: 14, paddingHorizontal: 32, marginBottom: 24 },
  btnDisabled: { opacity: 0.5 },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  note: { backgroundColor: '#1F2937', borderRadius: 12, padding: 16, width: '100%' },
  noteTitle: { fontSize: 13, fontWeight: '700', color: '#F59E0B', marginBottom: 6 },
  noteText: { fontSize: 12, color: '#6B7280', lineHeight: 22 },
});
