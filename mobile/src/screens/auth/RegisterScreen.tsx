import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Alert, KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { authAPI } from '../../services/api';

export default function RegisterScreen({ navigation }: any) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'parent' | 'child'>('parent');
  const [loading, setLoading] = useState(false);

  async function handleRegister() {
    if (!name || !email || !password) return Alert.alert('Error', 'Name, email and password are required');
    if (password.length < 8) return Alert.alert('Error', 'Password must be at least 8 characters');
    setLoading(true);
    try {
      const { data } = await authAPI.register({ name, email: email.trim().toLowerCase(), phone, password, role });
      Alert.alert(
        'Registration Successful',
        role === 'child'
          ? `Your pair code is: ${data.user.pairCode}\nShare this with your parent to link accounts.`
          : 'Account created! You can now log in.',
        [{ text: 'Go to Login', onPress: () => navigation.navigate('Login') }]
      );
    } catch (err: any) {
      Alert.alert('Registration Failed', err.response?.data?.error || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.inner} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Create Account</Text>

        <Text style={styles.label}>I am a:</Text>
        <View style={styles.roleRow}>
          {(['parent', 'child'] as const).map((r) => (
            <TouchableOpacity
              key={r}
              style={[styles.roleBtn, role === r && styles.roleBtnActive]}
              onPress={() => setRole(r)}
            >
              <Text style={[styles.roleBtnText, role === r && styles.roleBtnTextActive]}>
                {r === 'parent' ? '👨‍👩 Parent' : '👧 Child'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TextInput style={styles.input} placeholder="Full Name" placeholderTextColor="#9CA3AF" value={name} onChangeText={setName} />
        <TextInput style={styles.input} placeholder="Email" placeholderTextColor="#9CA3AF" keyboardType="email-address" autoCapitalize="none" value={email} onChangeText={setEmail} />
        <TextInput style={styles.input} placeholder="Phone (optional)" placeholderTextColor="#9CA3AF" keyboardType="phone-pad" value={phone} onChangeText={setPhone} />
        <TextInput style={styles.input} placeholder="Password (min 8 chars)" placeholderTextColor="#9CA3AF" secureTextEntry value={password} onChangeText={setPassword} />

        {role === 'child' && (
          <View style={styles.notice}>
            <Text style={styles.noticeText}>After registering, you will receive a pair code to share with your parent.</Text>
          </View>
        )}

        <TouchableOpacity style={[styles.btn, loading && styles.btnDisabled]} onPress={handleRegister} disabled={loading}>
          <Text style={styles.btnText}>{loading ? 'Creating...' : 'Create Account'}</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('Login')}>
          <Text style={styles.link}>Already have an account? <Text style={styles.linkBold}>Sign In</Text></Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  inner: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  title: { fontSize: 26, fontWeight: 'bold', color: '#111827', textAlign: 'center', marginBottom: 24 },
  label: { color: '#374151', fontWeight: '600', marginBottom: 8 },
  roleRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  roleBtn: {
    flex: 1, borderWidth: 2, borderColor: '#E5E7EB', borderRadius: 12,
    paddingVertical: 12, alignItems: 'center',
  },
  roleBtnActive: { borderColor: '#4F46E5', backgroundColor: '#EEF2FF' },
  roleBtnText: { fontSize: 15, color: '#6B7280', fontWeight: '600' },
  roleBtnTextActive: { color: '#4F46E5' },
  input: {
    backgroundColor: '#fff', borderWidth: 1, borderColor: '#E5E7EB',
    borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14,
    fontSize: 16, color: '#111827', marginBottom: 12,
  },
  notice: { backgroundColor: '#ECFDF5', padding: 12, borderRadius: 10, marginBottom: 12 },
  noticeText: { color: '#065F46', fontSize: 13 },
  btn: {
    backgroundColor: '#4F46E5', borderRadius: 12,
    paddingVertical: 14, alignItems: 'center', marginTop: 8,
  },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  link: { textAlign: 'center', marginTop: 20, color: '#6B7280', fontSize: 14 },
  linkBold: { color: '#4F46E5', fontWeight: '700' },
});
