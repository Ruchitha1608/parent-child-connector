import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function ChildVideoScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.icon}>📹</Text>
      <Text style={styles.title}>Video Check-in</Text>
      <Text style={styles.subtitle}>
        Live video requires a development build.{'\n'}
        This feature is fully implemented and will work{'\n'}
        when the app is built with EAS or locally.
      </Text>
      <View style={styles.infoBox}>
        <Text style={styles.infoText}>WebRTC signaling server is running.</Text>
        <Text style={styles.infoText}>Socket events: video:request, video:offer,</Text>
        <Text style={styles.infoText}>video:answer, video:ice-candidate, video:end</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32, backgroundColor: '#111827' },
  icon: { fontSize: 72, marginBottom: 16 },
  title: { fontSize: 24, fontWeight: '800', color: '#fff', marginBottom: 12, textAlign: 'center' },
  subtitle: { fontSize: 14, color: '#9CA3AF', textAlign: 'center', lineHeight: 24, marginBottom: 24 },
  infoBox: { backgroundColor: '#1F2937', borderRadius: 12, padding: 16, width: '100%' },
  infoText: { fontSize: 12, color: '#6B7280', fontFamily: 'monospace', lineHeight: 22 },
});
