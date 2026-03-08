import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Alert, KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { authAPI } from '../../services/api';
import { connectSocket } from '../../services/socket';
import { useStore } from '../../store/useStore';

export default function LoginScreen({ navigation }: any) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { setAuth } = useStore();

  async function handleLogin() {
    if (!email || !password) return Alert.alert('Error', 'Please fill all fields');
    setLoading(true);
    try {
      const { data } = await authAPI.login({ email: email.trim().toLowerCase(), password });
      await setAuth(data.user, data.accessToken, data.refreshToken);
      await connectSocket();
    } catch (err: any) {
      Alert.alert('Login Failed', err.response?.data?.error || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.inner} keyboardShouldPersistTaps="handled">
        <Text style={styles.logo}>👨‍👩‍👧</Text>
        <Text style={styles.title}>Parent-Child Connector</Text>
        <Text style={styles.subtitle}>Sign in to your account</Text>

        <TextInput
          style={styles.input}
          placeholder="Email address"
          placeholderTextColor="#9CA3AF"
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor="#9CA3AF"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        <TouchableOpacity style={[styles.btn, loading && styles.btnDisabled]} onPress={handleLogin} disabled={loading}>
          <Text style={styles.btnText}>{loading ? 'Signing in...' : 'Sign In'}</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('Register')}>
          <Text style={styles.link}>Don't have an account? <Text style={styles.linkBold}>Register</Text></Text>
        </TouchableOpacity>

        <View style={styles.demo}>
          <Text style={styles.demoText}>Demo accounts:</Text>
          <Text style={styles.demoText}>Parent: parent@demo.com / password123</Text>
          <Text style={styles.demoText}>Child:  child@demo.com  / password123</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  inner: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  logo: { fontSize: 64, textAlign: 'center', marginBottom: 12 },
  title: { fontSize: 26, fontWeight: 'bold', color: '#111827', textAlign: 'center' },
  subtitle: { fontSize: 14, color: '#6B7280', textAlign: 'center', marginBottom: 32 },
  input: {
    backgroundColor: '#fff', borderWidth: 1, borderColor: '#E5E7EB',
    borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14,
    fontSize: 16, color: '#111827', marginBottom: 12,
  },
  btn: {
    backgroundColor: '#4F46E5', borderRadius: 12,
    paddingVertical: 14, alignItems: 'center', marginTop: 8,
  },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  link: { textAlign: 'center', marginTop: 20, color: '#6B7280', fontSize: 14 },
  linkBold: { color: '#4F46E5', fontWeight: '700' },
  demo: { marginTop: 32, padding: 12, backgroundColor: '#EEF2FF', borderRadius: 10 },
  demoText: { fontSize: 12, color: '#4338CA', textAlign: 'center', lineHeight: 20 },
});
