import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../src/firebase/config';
import { useUserStore } from '../src/store/store';
import { COLORS } from '../src/constants/theme';
import {
  hasAskedForPermission,
  requestNotificationPermission,
  registerForPushNotifications,
  addNotificationReceivedListener,
  addNotificationResponseListener,
} from '../src/services/notificationService';

export default function RootLayout() {
  const [isReady, setIsReady] = useState(false);
  const setUser = useUserStore((state) => state.setUser);
  const router = useRouter();

  // Request notification permission on first app open
  useEffect(() => {
    const setupNotifications = async () => {
      const hasAsked = await hasAskedForPermission();
      if (!hasAsked) {
        // First time - request permission
        await requestNotificationPermission();
      }
    };

    setupNotifications();

    // Set up notification listeners
    const notificationListener = addNotificationReceivedListener((notification) => {
      console.log('Notification received:', notification);
    });

    const responseListener = addNotificationResponseListener((response) => {
      console.log('Notification tapped:', response);
      // Handle navigation based on notification data
      const data = response.notification.request.content.data;
      if (data?.type) {
        switch (data.type) {
          case 'note':
            router.push('/notes');
            break;
          case 'mood':
            router.push('/mood');
            break;
          case 'gift':
            router.push('/gifts');
            break;
          case 'pet':
            router.push('/pet');
            break;
          case 'plant':
            router.push('/plant');
            break;
          case 'date':
            router.push('/dates');
            break;
          default:
            router.push('/activity');
        }
      }
    });

    return () => {
      notificationListener.remove();
      responseListener.remove();
    };
  }, []);

  useEffect(() => {
    // Listen to Firebase auth state changes
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Update Zustand store with basic user info for local state
        setUser({
          uid: user.uid,
          email: user.email,
        });

        // Register for push notifications and save token to Firebase
        await registerForPushNotifications(user.uid);
      } else {
        setUser(null);
      }
      setIsReady(true);
    });

    return () => unsubscribe();
  }, []);

  // Show loading while checking auth state
  if (!isReady) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background }}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: COLORS.background },
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen 
          name="intro" 
          options={{ 
            animation: 'fade',
            gestureEnabled: false 
          }} 
        />
        <Stack.Screen 
          name="welcome" 
          options={{ 
            animation: 'slide_from_right',
            gestureEnabled: false 
          }} 
        />
        <Stack.Screen 
          name="onboarding" 
          options={{ 
            animation: 'fade',
            gestureEnabled: false 
          }} 
        />
      </Stack>
    </>
  );
}
