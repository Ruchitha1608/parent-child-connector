import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, Alert,
} from 'react-native';
import { authAPI } from '../../services/api';
import { useStore } from '../../store/useStore';

export default function PairScreen() {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const { setAuth, user, accessToken, refreshToken, clearAuth } = useStore();

  async function handlePair() {
    if (!code.trim()) return Alert.alert('Error', 'Please enter a pair code');
    setLoading(true);
    try {
      await authAPI.pair(code.trim().toUpperCase());
      // Refresh user profile
      const { data: updatedUser } = await authAPI.me();
      await setAuth({ ...user!, ...updatedUser, pairedWith: updatedUser.id }, accessToken!, refreshToken!);
      Alert.alert('Success', 'Paired with child successfully!');
    } catch (err: any) {
      Alert.alert('Pairing Failed', err.response?.data?.error || 'Invalid pair code');
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Link to Your Child</Text>
      <Text style={styles.subtitle}>
        Ask your child to open the app and find their 6-character pair code, then enter it below.
      </Text>

      <TextInput
        style={styles.input}
        placeholder="Enter Pair Code (e.g. DEMO01)"
        placeholderTextColor="#9CA3AF"
        value={code}
        onChangeText={setCode}
        autoCapitalize="characters"
        maxLength={8}
      />

      <TouchableOpacity style={[styles.btn, loading && styles.btnDisabled]} onPress={handlePair} disabled={loading}>
        <Text style={styles.btnText}>{loading ? 'Linking...' : 'Link Account'}</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.logoutBtn} onPress={clearAuth}>
        <Text style={styles.logoutText}>Log Out</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB', justifyContent: 'center', padding: 24 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#111827', textAlign: 'center', marginBottom: 12 },
  subtitle: { fontSize: 14, color: '#6B7280', textAlign: 'center', marginBottom: 32, lineHeight: 22 },
  input: {
    backgroundColor: '#fff', borderWidth: 1, borderColor: '#E5E7EB',
    borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14,
    fontSize: 20, color: '#111827', textAlign: 'center', letterSpacing: 4, marginBottom: 16,
  },
  btn: {
    backgroundColor: '#4F46E5', borderRadius: 12,
    paddingVertical: 14, alignItems: 'center',
  },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  logoutBtn: { marginTop: 20, alignItems: 'center' },
  logoutText: { color: '#EF4444', fontSize: 14 },
});
