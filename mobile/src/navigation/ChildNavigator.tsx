import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';
import ChildHomeScreen from '../screens/child/ChildHomeScreen';
import ChildChatScreen from '../screens/child/ChildChatScreen';
import ChildVideoScreen from '../screens/child/ChildVideoScreen';
import ProfileScreen from '../screens/ProfileScreen';
import { useStore } from '../store/useStore';

const Tab = createBottomTabNavigator();

function TabIcon({ emoji }: { emoji: string }) {
  return <Text style={{ fontSize: 20 }}>{emoji}</Text>;
}

export function ChildNavigator() {
  const { unreadCount } = useStore();

  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#059669',
        tabBarInactiveTintColor: '#9CA3AF',
        tabBarStyle: { height: 60, paddingBottom: 8 },
        headerStyle: { backgroundColor: '#059669' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: 'bold' },
      }}
    >
      <Tab.Screen
        name="ChildHome"
        component={ChildHomeScreen}
        options={{
          title: 'Home',
          tabBarIcon: () => <TabIcon emoji="🏠" />,
        }}
      />
      <Tab.Screen
        name="ChildChat"
        component={ChildChatScreen}
        options={{
          title: 'Chat',
          tabBarIcon: () => <TabIcon emoji="💬" />,
          tabBarBadge: unreadCount > 0 ? unreadCount : undefined,
        }}
      />
      <Tab.Screen
        name="ChildVideo"
        component={ChildVideoScreen}
        options={{
          title: 'Video',
          tabBarIcon: () => <TabIcon emoji="📹" />,
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          title: 'Profile',
          tabBarIcon: () => <TabIcon emoji="👤" />,
        }}
      />
    </Tab.Navigator>
  );
}
