import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated, Dimensions, Modal, PanResponder } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from '../../src/constants/theme';
import { auth, db } from '../../src/firebase/config';
import { getUserProfile, updateUserProfile } from '../../src/firebase/services/userService';
import { useActivityStore } from '../../src/store/store';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  doc, 
  updateDoc, 
  deleteDoc,
  writeBatch 
} from 'firebase/firestore';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SWIPE_THRESHOLD = -80;
const DELETE_BUTTON_WIDTH = 80;

// Notification types configuration
const NOTIFICATION_CONFIG = {
  msg: {
    icon: 'chatbubble-ellipses',
    color: COLORS.primary,
    route: '/notes',
    label: 'Message',
  },
  mood: {
    icon: 'happy',
    color: '#FFB946',
    route: '/mood',
    label: 'Mood',
  },
  pet: {
    icon: 'paw',
    color: COLORS.secondary,
    route: '/pet',
    label: 'Pet',
  },
  plant: {
    icon: 'leaf',
    color: '#4CAF50',
    route: '/plant',
    label: 'Plant',
  },
  gift: {
    icon: 'gift',
    color: COLORS.accentPurple,
    route: '/gifts',
    label: 'Gift',
  },
  date: {
    icon: 'calendar-heart',
    color: COLORS.heart,
    route: '/dates',
    label: 'Date',
  },
  app: {
    icon: 'heart',
    color: COLORS.heart,
    route: null, // Shows modal instead
    label: 'Pairly',
  },
};

// Swipeable Notification Card Component
function NotificationCard({ notification, onDelete, onPress, index }) {
  const slideAnim = useRef(new Animated.Value(-SCREEN_WIDTH)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const swipeAnim = useRef(new Animated.Value(0)).current;
  const isSwipeOpenRef = useRef(false);
  const [, forceUpdate] = useState(0);

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

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => false,
        onMoveShouldSetPanResponder: (_, gestureState) => {
          return Math.abs(gestureState.dx) > 10 && Math.abs(gestureState.dy) < 10;
        },
        onPanResponderMove: (_, gestureState) => {
          const isOpen = isSwipeOpenRef.current;
          if (isOpen) {
            // Already open - allow swiping back (right)
            const newValue = -DELETE_BUTTON_WIDTH + gestureState.dx;
            swipeAnim.setValue(Math.max(Math.min(newValue, 0), -DELETE_BUTTON_WIDTH));
          } else {
            // Closed - only allow swiping left
            if (gestureState.dx < 0) {
              swipeAnim.setValue(Math.max(gestureState.dx, -DELETE_BUTTON_WIDTH));
            }
          }
        },
        onPanResponderRelease: (_, gestureState) => {
          const isOpen = isSwipeOpenRef.current;
          const velocity = gestureState.vx;
          
          if (isOpen) {
            // If open and swiped right quickly, or moved more than half
            if (velocity > 0.3 || gestureState.dx > DELETE_BUTTON_WIDTH / 2) {
              // Close it
              Animated.spring(swipeAnim, {
                toValue: 0,
                friction: 8,
                tension: 40,
                useNativeDriver: true,
              }).start();
              isSwipeOpenRef.current = false;
              forceUpdate(n => n + 1);
            } else {
              // Keep open
              Animated.spring(swipeAnim, {
                toValue: -DELETE_BUTTON_WIDTH,
                friction: 8,
                tension: 40,
                useNativeDriver: true,
              }).start();
            }
          } else {
            // If closed and swiped left quickly, or past threshold
            if (velocity < -0.3 || gestureState.dx < SWIPE_THRESHOLD) {
              // Open delete button
              Animated.spring(swipeAnim, {
                toValue: -DELETE_BUTTON_WIDTH,
                friction: 8,
                tension: 40,
                useNativeDriver: true,
              }).start();
              isSwipeOpenRef.current = true;
              forceUpdate(n => n + 1);
            } else {
              // Keep closed
              Animated.spring(swipeAnim, {
                toValue: 0,
                friction: 8,
                tension: 40,
                useNativeDriver: true,
              }).start();
            }
          }
        },
      }),
    []
  );

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

  const handleCardPress = () => {
    if (isSwipeOpenRef.current) {
      // Close swipe first
      Animated.spring(swipeAnim, {
        toValue: 0,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }).start();
      isSwipeOpenRef.current = false;
      forceUpdate(n => n + 1);
    } else {
      onPress(notification);
    }
  };

  const config = NOTIFICATION_CONFIG[notification.type] || NOTIFICATION_CONFIG.app;

  return (
    <Animated.View
      style={[
        styles.cardContainer,
        {
          transform: [{ translateX: slideAnim }, { scale: scaleAnim }],
          opacity: fadeAnim,
        },
      ]}
    >
      {/* Delete Button (behind the card) */}
      <View style={styles.deleteButtonContainer}>
        <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
          <Ionicons name="trash" size={24} color={COLORS.textWhite} />
        </TouchableOpacity>
      </View>

      {/* Main Card */}
      <Animated.View
        style={[
          styles.notificationCard,
          !notification.read && styles.unreadCard,
          { transform: [{ translateX: swipeAnim }] },
        ]}
        {...panResponder.panHandlers}
      >
        <TouchableOpacity 
          style={styles.cardTouchable}
          onPress={handleCardPress}
          activeOpacity={0.7}
        >
          <View style={[styles.iconContainer, { backgroundColor: `${config.color}20` }]}>
            <Ionicons name={config.icon} size={24} color={config.color} />
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
            <View style={styles.bottomRow}>
              <View style={styles.typeTag}>
                <Text style={[styles.typeText, { color: config.color }]}>{config.label}</Text>
              </View>
              <Text style={styles.notificationTime}>{notification.time}</Text>
            </View>
          </View>
        </TouchableOpacity>
      </Animated.View>
    </Animated.View>
  );
}

export default function ActivityScreen() {
  const router = useRouter();
  const [profile, setProfile] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [showAppModal, setShowAppModal] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState(null);
  const markAsChecked = useActivityStore(state => state.markAsChecked);
  const setNotificationCount = useActivityStore(state => state.setNotificationCount);

  // Mark activity as checked when user visits this page
  useEffect(() => {
    markAsChecked();
  }, []);

  // Format time helper
  const formatTime = (timestamp) => {
    if (!timestamp) return 'Just now';
    
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  useEffect(() => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      // Clear notifications if no user
      setNotifications([]);
      setNotificationCount(0);
      return;
    }

    const userId = currentUser.uid;
    let unsubscribe = null;

    const loadProfile = async () => {
      try {
        const userProfile = await getUserProfile(userId);
        setProfile(userProfile);
        
        // Show welcome notification for new users
        if (userProfile && !userProfile.welcomeNotificationShown) {
          const welcomeNotification = {
            id: 'welcome-1',
            type: 'app',
            title: 'Welcome to Pairly! 💕',
            message: `Hey ${userProfile?.displayName || 'there'}! Your account was created successfully.`,
            fullMessage: `Hey ${userProfile?.displayName || 'there'}! Your account was created successfully.\n\nEmail: ${currentUser.email}\n\nStart exploring and connect with your partner! Send love notes, track moods, care for your virtual pet together, and create beautiful memories.\n\nEnjoy your journey! 💕`,
            time: 'Just now',
            read: false,
            isLocal: true,
            createdAt: new Date(),
          };
          
          setNotifications(prev => [welcomeNotification, ...prev]);
          
          // Mark welcome notification as shown in Firebase
          await updateUserProfile(userId, {
            welcomeNotificationShown: true,
          });
        }
      } catch (error) {
        console.error('Error loading profile:', error);
      }
    };
    loadProfile();

    // Subscribe to Firestore notifications with a slight delay to ensure auth is ready
    const setupSubscription = () => {
      try {
        const notificationsRef = collection(db, 'notifications');
        const q = query(
          notificationsRef,
          where('userId', '==', userId),
          orderBy('createdAt', 'desc')
        );

        unsubscribe = onSnapshot(q, (snapshot) => {
          const firestoreNotifications = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            time: formatTime(doc.data().createdAt),
            isLocal: false,
          }));
          
          setNotifications(prev => {
            // Keep local notifications (like welcome) and add Firestore notifications
            const localNotifications = prev.filter(n => n.isLocal);
            return [...localNotifications, ...firestoreNotifications];
          });

          // Update unread count in store
          const unreadCount = firestoreNotifications.filter(n => !n.read).length;
          setNotificationCount(unreadCount);
        }, (error) => {
          // Handle permission errors gracefully
          if (error.code === 'permission-denied') {
            console.warn('Notifications: Permission denied - user may have logged out');
            setNotifications(prev => prev.filter(n => n.isLocal));
          } else {
            console.error('Error fetching notifications:', error);
          }
        });
      } catch (error) {
        console.error('Error setting up notifications subscription:', error);
      }
    };

    // Small delay to ensure auth token is fully ready
    const timeoutId = setTimeout(setupSubscription, 100);

    return () => {
      clearTimeout(timeoutId);
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [auth.currentUser?.uid]);

  const handleNotificationPress = async (notification) => {
    // Mark as read in Firestore
    if (!notification.isLocal && !notification.read) {
      try {
        const notificationRef = doc(db, 'notifications', notification.id);
        await updateDoc(notificationRef, { read: true });
      } catch (error) {
        console.error('Error marking notification as read:', error);
      }
    }
    
    // Mark local notifications as read in state
    if (notification.isLocal) {
      setNotifications(prev => 
        prev.map(n => n.id === notification.id ? { ...n, read: true } : n)
      );
    }

    const config = NOTIFICATION_CONFIG[notification.type];

    if (notification.type === 'app' || !config?.route) {
      // Show modal for app notifications
      setSelectedNotification(notification);
      setShowAppModal(true);
    } else {
      // Navigate to related page
      router.push(config.route);
    }
  };

  const handleDelete = async (id) => {
    const notification = notifications.find(n => n.id === id);
    
    // Delete from Firestore if not a local notification
    if (notification && !notification.isLocal) {
      try {
        const notificationRef = doc(db, 'notifications', id);
        await deleteDoc(notificationRef);
      } catch (error) {
        console.error('Error deleting notification:', error);
      }
    }
    
    // Remove from local state
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const handleMarkAllRead = async () => {
    // Mark all Firestore notifications as read
    const unreadNotifications = notifications.filter(n => !n.read && !n.isLocal);
    
    if (unreadNotifications.length > 0) {
      try {
        const batch = writeBatch(db);
        unreadNotifications.forEach(n => {
          const notificationRef = doc(db, 'notifications', n.id);
          batch.update(notificationRef, { read: true });
        });
        await batch.commit();
      } catch (error) {
        console.error('Error marking all as read:', error);
      }
    }
    
    // Update local state for local notifications
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const closeModal = () => {
    setShowAppModal(false);
    setSelectedNotification(null);
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
                onDelete={handleDelete}
                onPress={handleNotificationPress}
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

      {/* App Notification Modal */}
      <Modal
        visible={showAppModal}
        animationType="fade"
        transparent={true}
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={[styles.modalIconContainer, { backgroundColor: `${COLORS.heart}20` }]}>
                <Ionicons name="heart" size={32} color={COLORS.heart} />
              </View>
              <Text style={styles.modalTitle}>{selectedNotification?.title}</Text>
            </View>
            
            <Text style={styles.modalMessage}>
              {selectedNotification?.fullMessage || selectedNotification?.message}
            </Text>

            <TouchableOpacity style={styles.modalButton} onPress={closeModal}>
              <Text style={styles.modalButtonText}>Got it!</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  hintContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.sm,
  },
  hintText: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textLight,
    marginLeft: SPACING.xs,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.lg,
    paddingBottom: 120,
  },
  // Card styles
  cardContainer: {
    marginBottom: SPACING.md,
    position: 'relative',
  },
  deleteButtonContainer: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: DELETE_BUTTON_WIDTH,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.error,
    borderRadius: RADIUS.xl,
  },
  deleteButton: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationCard: {
    backgroundColor: COLORS.backgroundCard,
    borderRadius: RADIUS.xl,
    ...SHADOWS.medium,
  },
  unreadCard: {
    borderLeftWidth: 4,
    borderLeftColor: COLORS.heart,
  },
  cardTouchable: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: SPACING.lg,
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
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: SPACING.sm,
  },
  typeTag: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    backgroundColor: COLORS.borderLight,
    borderRadius: RADIUS.sm,
  },
  typeText: {
    fontSize: FONTS.sizes.xs,
    fontWeight: '600',
  },
  notificationTime: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textLight,
  },
  // Empty state
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
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
  },
  modalContent: {
    backgroundColor: COLORS.backgroundCard,
    borderRadius: RADIUS.xxl,
    padding: SPACING.xl,
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
    ...SHADOWS.large,
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  modalIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  modalTitle: {
    fontSize: FONTS.sizes.xl,
    fontWeight: '700',
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: FONTS.sizes.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: SPACING.xl,
  },
  modalButton: {
    backgroundColor: COLORS.secondary,
    paddingHorizontal: SPACING.xxl,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.lg,
    width: '100%',
  },
  modalButtonText: {
    fontSize: FONTS.sizes.md,
    fontWeight: '600',
    color: COLORS.textWhite,
    textAlign: 'center',
  },
});
