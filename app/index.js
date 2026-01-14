import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { COLORS, FONTS, SPACING } from '../src/constants/theme';
import { auth } from '../src/firebase/config';
import { getUserProfile } from '../src/firebase/services/userService';

export default function SplashScreen() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const fadeAnim = new Animated.Value(0);
  const scaleAnim = new Animated.Value(0.8);

  useEffect(() => {
    // Animate in
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 4,
        useNativeDriver: true,
      }),
    ]).start();

    // Check Firebase auth state after splash animation
    const timer = setTimeout(async () => {
      const currentUser = auth.currentUser;
      
      if (currentUser) {
        // User is logged in, check if they have completed onboarding
        try {
          const profile = await getUserProfile(currentUser.uid);
          if (profile && profile.displayName && profile.displayName !== 'User') {
            // User has set up their name - go to home
            // Partner connection is optional, can be done from home/profile
            router.replace('/(tabs)/home');
          } else {
            // No profile or name not set, go to onboarding
            router.replace('/onboarding');
          }
        } catch (error) {
          console.error('Error checking profile:', error);
          router.replace('/onboarding');
        }
      } else {
        // Not logged in - go to intro onboarding
        router.replace('/intro');
      }
      setChecking(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      <Animated.View 
        style={[
          styles.logoContainer,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <Text style={styles.heartEmoji}>💕</Text>
        <Text style={styles.title}>lovelee</Text>
        <Text style={styles.subtitle}>grow your love together</Text>
      </Animated.View>
      
      <Animated.View style={[styles.footer, { opacity: fadeAnim }]}>
        <Text style={styles.footerText}>Made with ❤️ for couples</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
  },
  heartEmoji: {
    fontSize: 80,
    marginBottom: SPACING.lg,
  },
  title: {
    fontSize: 48,
    fontWeight: '700',
    color: COLORS.primary,
    letterSpacing: 2,
  },
  subtitle: {
    fontSize: FONTS.sizes.lg,
    color: COLORS.textSecondary,
    marginTop: SPACING.sm,
  },
  footer: {
    position: 'absolute',
    bottom: 60,
  },
  footerText: {
    fontSize: FONTS.sizes.md,
    color: COLORS.textLight,
  },
});
