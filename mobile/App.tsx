import 'react-native-gesture-handler';
import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import * as Notifications from 'expo-notifications';
import AppNavigator from './src/navigation';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: string; stack: string }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: '', stack: '' };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error: String(error), stack: error?.stack || '' };
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>App Error — Copy this and share it</Text>
          <ScrollView style={styles.errorScroll}>
            <Text style={styles.errorText}>{this.state.error}</Text>
            <Text style={styles.errorStack}>{this.state.stack}</Text>
          </ScrollView>
        </View>
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  errorContainer: { flex: 1, backgroundColor: '#1a1a1a', padding: 16, paddingTop: 60 },
  errorTitle: { color: '#EF4444', fontSize: 14, fontWeight: 'bold', marginBottom: 12 },
  errorScroll: { flex: 1 },
  errorText: { color: '#FCA5A5', fontSize: 13, marginBottom: 12 },
  errorStack: { color: '#6B7280', fontSize: 11, fontFamily: 'monospace' },
});

export default function App() {
  useEffect(() => {
    Notifications.requestPermissionsAsync();
  }, []);

  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <StatusBar style="auto" />
        <AppNavigator />
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}
