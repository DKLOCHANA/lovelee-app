import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { View, ActivityIndicator, Text } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../src/firebase/config';
import { useUserStore } from '../src/store/store';
import { COLORS } from '../src/constants/theme';
import {
  initNotificationHandler,
  hasAskedForPermission,
  requestNotificationPermission,
  registerForPushNotifications,
  addNotificationReceivedListener,
  addNotificationResponseListener,
} from '../src/services/notificationService';

// Prevent splash screen from auto-hiding
SplashScreen.preventAutoHideAsync().catch(() => {
  // Ignore errors if called too early
});

export default function RootLayout() {
  const [isReady, setIsReady] = useState(false);
  const [firebaseError, setFirebaseError] = useState(null);
  const setUser = useUserStore((state) => state.setUser);
  const router = useRouter();

  // Initialize notification handler and set up listeners
  useEffect(() => {
<<<<<<< HEAD
    const setupNotifications = async () => {
      try {
        const hasAsked = await hasAskedForPermission();
        if (!hasAsked) {
          // First time - request permission
          await requestNotificationPermission();
        }
      } catch (error) {
        console.log('Notification setup error:', error);
      }
    };
=======
    let notificationListener = { remove: () => {} };
    let responseListener = { remove: () => {} };
>>>>>>> ce55440ebbc70156c2354a3e514aa4f95858474a

    try {
      // Initialize the notification handler (safe — wrapped internally)
      initNotificationHandler();

      // Request permission on first app open
      const setupNotifications = async () => {
        try {
          const hasAsked = await hasAskedForPermission();
          if (!hasAsked) {
            await requestNotificationPermission();
          }
        } catch (error) {
          console.error('[Layout] Notification permission setup failed:', error);
        }
      };

      setupNotifications();

      // Set up notification listeners (safe — return no-op on failure)
      notificationListener = addNotificationReceivedListener((notification) => {
        console.log('Notification received:', notification);
      });

      responseListener = addNotificationResponseListener((response) => {
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
    } catch (error) {
      console.error('[Layout] Notification setup failed:', error);
    }

    return () => {
      notificationListener.remove();
      responseListener.remove();
    };
  }, []);

  useEffect(() => {
    // Listen to Firebase auth state changes
<<<<<<< HEAD
    let unsubscribe = () => {};
    
    try {
      // Check if Firebase auth is properly initialized
      if (!auth) {
        setFirebaseError('Firebase authentication not initialized. Check your configuration.');
        setIsReady(true);
        SplashScreen.hideAsync().catch(() => {});
        return;
=======
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      try {
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
      } catch (error) {
        console.error('[Layout] Auth/notification registration error:', error);
>>>>>>> ce55440ebbc70156c2354a3e514aa4f95858474a
      }
      
      unsubscribe = onAuthStateChanged(auth, async (user) => {
        try {
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
        } catch (error) {
          console.log('Auth state change error:', error);
        }
        setIsReady(true);
        // Hide splash screen once ready
        SplashScreen.hideAsync().catch(() => {});
      }, (error) => {
        console.error('Auth state listener error:', error);
        setFirebaseError('Authentication error: ' + error.message);
        setIsReady(true);
        SplashScreen.hideAsync().catch(() => {});
      });
    } catch (error) {
      console.error('Firebase initialization error:', error);
      setFirebaseError('Failed to initialize Firebase: ' + error.message);
      setIsReady(true);
      SplashScreen.hideAsync().catch(() => {});
    }

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

  // Show error if Firebase failed to initialize
  if (firebaseError) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background, padding: 20 }}>
        <Text style={{ color: COLORS.error || '#FF6B6B', fontSize: 16, textAlign: 'center', marginBottom: 10 }}>
          Configuration Error
        </Text>
        <Text style={{ color: COLORS.textSecondary || '#666', fontSize: 14, textAlign: 'center' }}>
          {firebaseError}
        </Text>
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
