import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useRef } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from '../../src/constants/theme';

const SHORTCUTS = [
  {
    id: 'love-letter',
    title: 'Send Love Letter',
    icon: 'mail',
    route: '/notes?compose=true',
    emoji: '✉️',
  },
  {
    id: 'mood',
    title: 'Share Your Mood',
    icon: 'happy',
    route: '/mood',
    emoji: '😊',
    iconColor: COLORS.accentBlue,
  },
  {
    id: 'love-mailbox',
    title: 'Love Mailbox & Affections',
    icon: 'heart',
    route: '/notes',
    emoji: '💌',
  },
  {
    id: 'check-ins',
    title: 'Check-Ins',
    icon: 'checkbox',
    route: '/checkins',
    emoji: '📋',
  },
  
  {
    id: 'music',
    title: 'Music Together',
    icon: 'musical-notes',
    route: '/music',
    emoji: '🎵',
  },
  {
    id: 'pet',
    title: 'Pet Piggy',
    icon: 'paw',
    route: '/pet',
    emoji: '🐷',
  },
  {
    id: 'love-plant',
    title: 'Love Plant',
    icon: 'leaf',
    route: '/plant',
    emoji: '🌱',
  },
  {
    id: 'gifts',
    title: 'Gift Shop',
    icon: 'gift',
    route: '/gifts',
    emoji: '🎁',
  },
  {
    id: 'customize',
    title: 'Customize Widget',
    icon: 'color-palette',
    route: '/home',
    emoji: '🎨',
  },
  {
    id: 'calendar',
    title: 'Special Dates',
    icon: 'calendar',
    route: '/dates',
    emoji: '📅',
  },
 
];

// Shortcut Card Component with press animation
function ShortcutCard({ shortcut, onPress, index }) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(30)).current;

  // Entrance animation
  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        delay: index * 50,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 400,
        delay: index * 50,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.97,
      friction: 5,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 5,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Animated.View
      style={{
        transform: [
          { scale: scaleAnim },
          { translateY: translateY },
        ],
        opacity: fadeAnim,
      }}
    >
      <TouchableOpacity
        style={styles.shortcutCard}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
      >
        <View style={styles.shortcutContent}>
          <View style={[styles.emojiContainer, shortcut.iconColor && { backgroundColor: `${shortcut.iconColor}20` }]}>
            <Text style={styles.emoji}>{shortcut.emoji}</Text>
          </View>
          <Text style={styles.shortcutTitle}>{shortcut.title}</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={COLORS.textLight} />
      </TouchableOpacity>
    </Animated.View>
  );
}

import React from 'react';

export default function ShortcutsScreen() {
  const router = useRouter();

  const handleShortcutPress = (route) => {
    router.push(route);
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Shortcuts</Text>
          <Text style={styles.headerSubtitle}>Tap to access any feature from your shared space</Text>
        </View>

        {/* Shortcuts List */}
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {SHORTCUTS.map((shortcut, index) => (
            <ShortcutCard
              key={shortcut.id}
              shortcut={shortcut}
              index={index}
              onPress={() => handleShortcutPress(shortcut.route)}
            />
          ))}
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.lg,
    paddingBottom: 120,
  },
  shortcutCard: {
    backgroundColor: COLORS.backgroundCard,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...SHADOWS.small,
  },
  shortcutContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  emojiContainer: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.backgroundPink,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  emoji: {
    fontSize: 22,
  },
  shortcutTitle: {
    fontSize: FONTS.sizes.lg,
    fontWeight: '600',
    color: COLORS.textPrimary,
    flex: 1,
  },
});
