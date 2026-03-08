import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ActivityIndicator, View } from 'react-native';
import { useStore } from '../store/useStore';
import { ParentNavigator } from './ParentNavigator';
import { ChildNavigator } from './ChildNavigator';
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import PairScreen from '../screens/auth/PairScreen';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  const { isAuthenticated, user, hydrateAuth } = useStore();
  const [loading, setLoading] = React.useState(true);

  useEffect(() => {
    hydrateAuth().finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#4F46E5" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!isAuthenticated ? (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
          </>
        ) : user?.role === 'parent' && !user?.pairedWith ? (
          // Parent not yet paired
          <Stack.Screen name="Pair" component={PairScreen} />
        ) : user?.role === 'parent' ? (
          <Stack.Screen name="ParentApp" component={ParentNavigator} />
        ) : (
          <Stack.Screen name="ChildApp" component={ChildNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
