import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useEffect, useRef } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from '../../src/constants/theme';
import { auth } from '../../src/firebase/config';
import { getUserProfile } from '../../src/firebase/services/userService';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Notification Card Component with slide animation
function NotificationCard({ notification, onMarkRead, onDelete, index }) {
  const slideAnim = useRef(new Animated.Value(-SCREEN_WIDTH)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    // Staggered slide-in animation
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        delay: index * 100,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        delay: index * 100,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 6,
        tension: 40,
        delay: index * 100,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleDelete = () => {
    // Slide out animation before delete
    Animated.timing(slideAnim, {
      toValue: SCREEN_WIDTH,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      onDelete(notification.id);
    });
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'welcome':
        return 'heart';
      case 'note':
        return 'mail';
      case 'mood':
        return 'happy';
      case 'gift':
        return 'gift';
      case 'pet':
        return 'paw';
      case 'partner':
        return 'people';
      default:
        return 'notifications';
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case 'welcome':
        return COLORS.heart;
      case 'note':
        return COLORS.primary;
      case 'mood':
        return COLORS.moodHappy;
      case 'gift':
        return COLORS.accentPurple;
      case 'pet':
        return COLORS.secondary;
      case 'partner':
        return COLORS.accentBlue;
      default:
        return COLORS.textLight;
    }
  };

  return (
    <Animated.View
      style={[
        styles.notificationCard,
        !notification.read && styles.unreadCard,
        {
          transform: [
            { translateX: slideAnim },
            { scale: scaleAnim },
          ],
          opacity: fadeAnim,
        },
      ]}
    >
      <View style={styles.notificationContent}>
        <View style={[styles.iconContainer, { backgroundColor: `${getNotificationColor(notification.type)}20` }]}>
          <Ionicons 
            name={getNotificationIcon(notification.type)} 
            size={24} 
            color={getNotificationColor(notification.type)} 
          />
        </View>
        
        <View style={styles.textContainer}>
          <View style={styles.titleRow}>
            <Text style={[styles.notificationTitle, !notification.read && styles.unreadTitle]}>
              {notification.title}
            </Text>
            {!notification.read && <View style={styles.unreadDot} />}
          </View>
          <Text style={styles.notificationMessage} numberOfLines={2}>
            {notification.message}
          </Text>
          <Text style={styles.notificationTime}>{notification.time}</Text>
        </View>
      </View>

      <View style={styles.actionButtons}>
        {!notification.read && (
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => onMarkRead(notification.id)}
          >
            <Ionicons name="checkmark-circle" size={22} color={COLORS.success} />
          </TouchableOpacity>
        )}
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={handleDelete}
        >
          <Ionicons name="trash" size={22} color={COLORS.error} />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

export default function ActivityScreen() {
  const [profile, setProfile] = useState(null);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    const loadProfile = async () => {
      if (auth.currentUser) {
        const userProfile = await getUserProfile(auth.currentUser.uid);
        setProfile(userProfile);
        
        // Create welcome notification with account details
        const welcomeNotification = {
          id: 'welcome-1',
          type: 'welcome',
          title: 'Welcome to Lovelee! 💕',
          message: `Hey ${userProfile?.displayName || 'there'}! Your account was created successfully. Email: ${auth.currentUser.email}. Start exploring and connect with your partner!`,
          time: 'Just now',
          read: false,
          createdAt: new Date(),
        };

        // Sample notifications
        const sampleNotifications = [
          welcomeNotification,
          {
            id: 'tip-1',
            type: 'note',
            title: 'Send Your First Love Letter 💌',
            message: 'Express your feelings by sending a sweet love letter to your partner!',
            time: '2 min ago',
            read: false,
            createdAt: new Date(),
          },
          {
            id: 'tip-2',
            type: 'mood',
            title: 'Share Your Mood 😊',
            message: 'Let your partner know how you\'re feeling today. It helps build connection!',
            time: '5 min ago',
            read: false,
            createdAt: new Date(),
          },
          {
            id: 'tip-3',
            type: 'pet',
            title: 'Meet Your Pet Piggy 🐷',
            message: 'Take care of your shared pet together! Feed, play, and watch it grow.',
            time: '10 min ago',
            read: true,
            createdAt: new Date(),
          },
          {
            id: 'tip-4',
            type: 'gift',
            title: 'Surprise Your Partner! 🎁',
            message: 'Send virtual gifts to show your love and appreciation.',
            time: '15 min ago',
            read: true,
            createdAt: new Date(),
          },
          {
            id: 'partner-1',
            type: 'partner',
            title: 'Connect with Partner 👫',
            message: 'Share your unique code with your partner to start your love journey together!',
            time: '20 min ago',
            read: true,
            createdAt: new Date(),
          },
        ];

        setNotifications(sampleNotifications);
      }
    };
    loadProfile();
  }, []);

  const handleMarkRead = (id) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  };

  const handleDelete = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const handleMarkAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Activity</Text>
            <Text style={styles.headerSubtitle}>
              {unreadCount > 0 ? `${unreadCount} unread notifications` : 'All caught up! 💕'}
            </Text>
          </View>
          {unreadCount > 0 && (
            <TouchableOpacity style={styles.markAllButton} onPress={handleMarkAllRead}>
              <Text style={styles.markAllText}>Mark all read</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Notifications List */}
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {notifications.length > 0 ? (
            notifications.map((notification, index) => (
              <NotificationCard
                key={notification.id}
                notification={notification}
                onMarkRead={handleMarkRead}
                onDelete={handleDelete}
                index={index}
              />
            ))
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="notifications-off" size={64} color={COLORS.textLight} />
              <Text style={styles.emptyTitle}>No notifications</Text>
              <Text style={styles.emptySubtitle}>You're all caught up!</Text>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.md,
  },
  headerTitle: {
    fontSize: FONTS.sizes.xxxl,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  headerSubtitle: {
    fontSize: FONTS.sizes.md,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  markAllButton: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.primaryLight,
    borderRadius: RADIUS.lg,
  },
  markAllText: {
    fontSize: FONTS.sizes.sm,
    fontWeight: '600',
    color: COLORS.secondary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.lg,
    paddingBottom: 120,
  },
  notificationCard: {
    backgroundColor: COLORS.backgroundCard,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    ...SHADOWS.medium,
  },
  unreadCard: {
    borderLeftWidth: 4,
    borderLeftColor: COLORS.heart,
  },
  notificationContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: RADIUS.lg,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  textContainer: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  notificationTitle: {
    fontSize: FONTS.sizes.lg,
    fontWeight: '600',
    color: COLORS.textPrimary,
    flex: 1,
  },
  unreadTitle: {
    fontWeight: '700',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.heart,
    marginLeft: SPACING.sm,
  },
  notificationMessage: {
    fontSize: FONTS.sizes.md,
    color: COLORS.textSecondary,
    marginTop: 4,
    lineHeight: 20,
  },
  notificationTime: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textLight,
    marginTop: SPACING.sm,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: SPACING.md,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  actionButton: {
    padding: SPACING.sm,
    marginLeft: SPACING.md,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyTitle: {
    fontSize: FONTS.sizes.xl,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginTop: SPACING.lg,
  },
  emptySubtitle: {
    fontSize: FONTS.sizes.md,
    color: COLORS.textSecondary,
    marginTop: SPACING.sm,
  },
});
