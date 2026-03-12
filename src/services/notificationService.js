// Notification Service - Handles push notification setup and permissions
// Native modules are lazy-loaded to prevent TurboModule crashes at import time
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const NOTIFICATION_ASKED_KEY = '@notification_permission_asked';

// Lazy-load native modules to catch TurboModule init errors
let _Notifications = null;
let _Device = null;
let _Constants = null;

function getNotifications() {
  if (!_Notifications) {
    try {
      _Notifications = require('expo-notifications');
    } catch (error) {
      console.error('[Notifications] Failed to load expo-notifications:', error);
      return null;
    }
  }
  return _Notifications;
}

function getDevice() {
  if (!_Device) {
    try {
      _Device = require('expo-device');
    } catch (error) {
      console.error('[Notifications] Failed to load expo-device:', error);
      return null;
    }
  }
  return _Device;
}

function getConstants() {
  if (!_Constants) {
    try {
      _Constants = require('expo-constants');
    } catch (error) {
      console.error('[Notifications] Failed to load expo-constants:', error);
      return null;
    }
  }
  return _Constants;
}

/**
 * Initialize the notification handler (call once at app startup).
 * Must be called explicitly instead of running at module scope.
 */
export const initNotificationHandler = () => {
  try {
    const Notifications = getNotifications();
    if (!Notifications) return;

    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      }),
    });
  } catch (error) {
    console.error('[Notifications] Failed to set notification handler:', error);
  }
};

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
    const Notifications = getNotifications();
    if (!Notifications) return false;

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
    const Notifications = getNotifications();
    const Device = getDevice();
    if (!Notifications) return { granted: false, status: 'error' };

    // Check if it's a physical device (notifications don't work on simulators for iOS)
    if (Device && !Device.isDevice) {
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
    const Notifications = getNotifications();
    const ExpoConstants = getConstants();
    if (!Notifications) return null;

    const { granted } = await requestNotificationPermission();
    
    if (!granted) {
      return null;
    }

    // Get the project ID from expo config
    const projectId = ExpoConstants?.default?.expoConfig?.extra?.eas?.projectId ?? 
                      ExpoConstants?.default?.easConfig?.projectId;

    if (!projectId) {
      console.warn('[Notifications] No projectId found — push token may fail');
    }

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
      const { updateExpoPushToken } = require('../firebase/services/userService');
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
    const Notifications = getNotifications();
    if (!Notifications) return;

    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        sound: true,
      },
      trigger: {
        type: 'timeInterval',
        seconds,
        repeats: false,
      },
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
    const Notifications = getNotifications();
    if (!Notifications) return;

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
  try {
    const Notifications = getNotifications();
    if (!Notifications) return { remove: () => {} };

    return Notifications.addNotificationReceivedListener(callback);
  } catch (error) {
    console.error('[Notifications] Failed to add received listener:', error);
    return { remove: () => {} };
  }
};

/**
 * Add listener for notification responses (when user taps notification)
 * @param {function} callback 
 * @returns {object} subscription to remove
 */
export const addNotificationResponseListener = (callback) => {
  try {
    const Notifications = getNotifications();
    if (!Notifications) return { remove: () => {} };

    return Notifications.addNotificationResponseReceivedListener(callback);
  } catch (error) {
    console.error('[Notifications] Failed to add response listener:', error);
    return { remove: () => {} };
  }
};
