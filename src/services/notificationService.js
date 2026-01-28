// Notification Service - Handles push notification setup and permissions
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { updateExpoPushToken } from '../firebase/services/userService';

const NOTIFICATION_ASKED_KEY = '@notification_permission_asked';

// Configure how notifications appear when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

/**
 * Check if we've already asked for notification permission
 */
export const hasAskedForPermission = async () => {
  try {
    const asked = await AsyncStorage.getItem(NOTIFICATION_ASKED_KEY);
    return asked === 'true';
  } catch {
    return false;
  }
};

/**
 * Mark that we've asked for notification permission
 */
export const setPermissionAsked = async () => {
  try {
    await AsyncStorage.setItem(NOTIFICATION_ASKED_KEY, 'true');
  } catch (error) {
    console.error('Error saving permission asked state:', error);
  }
};

/**
 * Get current notification permission status
 * @returns {Promise<boolean>} - true if notifications are enabled
 */
export const getNotificationStatus = async () => {
  try {
    const { status } = await Notifications.getPermissionsAsync();
    return status === 'granted';
  } catch {
    return false;
  }
};

/**
 * Request notification permission
 * @returns {Promise<{granted: boolean, status: string}>}
 */
export const requestNotificationPermission = async () => {
  try {
    // Check if it's a physical device (notifications don't work on simulators for iOS)
    if (!Device.isDevice) {
      console.log('Notifications only work on physical devices');
      return { granted: false, status: 'unavailable' };
    }

    // Check existing permissions
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    
    let finalStatus = existingStatus;
    
    // If not determined, request permission
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    // Mark that we've asked
    await setPermissionAsked();

    return {
      granted: finalStatus === 'granted',
      status: finalStatus,
    };
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return { granted: false, status: 'error' };
  }
};

/**
 * Register for push notifications and get the expo push token
 * @param {string|null} userId - Optional user ID to save token to Firebase
 * @returns {Promise<string|null>}
 */
export const registerForPushNotifications = async (userId = null) => {
  try {
    const { granted } = await requestNotificationPermission();
    
    if (!granted) {
      return null;
    }

    // Get the project ID from expo config
    const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? 
                      Constants.easConfig?.projectId;

    // Get the Expo push token
    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId,
    });

    // For Android, set up notification channel
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF69B4', // Pink color matching app theme
      });
    }

    // Save token to Firebase if user is logged in
    if (userId && tokenData.data) {
      await updateExpoPushToken(userId, tokenData.data);
    }

    return tokenData.data;
  } catch (error) {
    console.error('Error registering for push notifications:', error);
    return null;
  }
};

/**
 * Schedule a local notification (for testing or local reminders)
 * @param {string} title 
 * @param {string} body 
 * @param {number} seconds - delay in seconds
 */
export const scheduleLocalNotification = async (title, body, seconds = 1) => {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        sound: true,
      },
      trigger: { seconds },
    });
  } catch (error) {
    console.error('Error scheduling notification:', error);
  }
};

/**
 * Cancel all scheduled notifications
 */
export const cancelAllNotifications = async () => {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch (error) {
    console.error('Error canceling notifications:', error);
  }
};

/**
 * Add listener for received notifications
 * @param {function} callback 
 * @returns {object} subscription to remove
 */
export const addNotificationReceivedListener = (callback) => {
  return Notifications.addNotificationReceivedListener(callback);
};

/**
 * Add listener for notification responses (when user taps notification)
 * @param {function} callback 
 * @returns {object} subscription to remove
 */
export const addNotificationResponseListener = (callback) => {
  return Notifications.addNotificationResponseReceivedListener(callback);
};
