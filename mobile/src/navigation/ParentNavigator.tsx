import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';
import DashboardScreen from '../screens/parent/DashboardScreen';
import MapScreen from '../screens/parent/MapScreen';
import ChatScreen from '../screens/parent/ChatScreen';
import AlertsScreen from '../screens/parent/AlertsScreen';
import ActivityScreen from '../screens/parent/ActivityScreen';
import { useStore } from '../store/useStore';

const Tab = createBottomTabNavigator();

function TabIcon({ label, emoji }: { label: string; emoji: string }) {
  return <Text style={{ fontSize: 20 }}>{emoji}</Text>;
}

export function ParentNavigator() {
  const { hasNewAlert, unreadCount } = useStore();

  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#4F46E5',
        tabBarInactiveTintColor: '#9CA3AF',
        tabBarStyle: { height: 60, paddingBottom: 8 },
        headerStyle: { backgroundColor: '#4F46E5' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: 'bold' },
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          title: 'Dashboard',
          tabBarIcon: () => <TabIcon label="home" emoji="🏠" />,
        }}
      />
      <Tab.Screen
        name="Map"
        component={MapScreen}
        options={{
          title: 'Live Map',
          tabBarIcon: () => <TabIcon label="map" emoji="🗺️" />,
        }}
      />
      <Tab.Screen
        name="Chat"
        component={ChatScreen}
        options={{
          title: 'Chat',
          tabBarIcon: () => <TabIcon label="chat" emoji="💬" />,
          tabBarBadge: unreadCount > 0 ? unreadCount : undefined,
        }}
      />
      <Tab.Screen
        name="Alerts"
        component={AlertsScreen}
        options={{
          title: 'Alerts',
          tabBarIcon: () => <TabIcon label="alerts" emoji="🔔" />,
          tabBarBadge: hasNewAlert ? '!' : undefined,
        }}
      />
      <Tab.Screen
        name="Activity"
        component={ActivityScreen}
        options={{
          title: 'Activity',
          tabBarIcon: () => <TabIcon label="activity" emoji="📋" />,
        }}
      />
    </Tab.Navigator>
  );
}
