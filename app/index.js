import { useEffect, useState, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import LottieView from 'lottie-react-native';
import NetInfo from '@react-native-community/netinfo';
import { COLORS, FONTS, SPACING, RADIUS } from '../src/constants/theme';
import { auth } from '../src/firebase/config';
import { getUserProfile } from '../src/firebase/services/userService';

const { width, height } = Dimensions.get('window');

// Floating heart component
const FloatingHeart = ({ delay, startX, size, duration }) => {
  const translateY = useRef(new Animated.Value(height + 50)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const rotate = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animate = () => {
      translateY.setValue(height + 50);
      translateX.setValue(0);
      opacity.setValue(0);

      Animated.sequence([
        Animated.delay(delay),
        Animated.parallel([
          Animated.timing(translateY, {
            toValue: -100,
            duration: duration,
            useNativeDriver: true,
          }),
          Animated.sequence([
            Animated.timing(opacity, {
              toValue: 0.8,
              duration: 500,
              useNativeDriver: true,
            }),
            Animated.delay(duration - 1500),
            Animated.timing(opacity, {
              toValue: 0,
              duration: 500,
              useNativeDriver: true,
            }),
          ]),
          Animated.sequence([
            Animated.timing(translateX, {
              toValue: 30,
              duration: duration / 4,
              useNativeDriver: true,
            }),
            Animated.timing(translateX, {
              toValue: -30,
              duration: duration / 2,
              useNativeDriver: true,
            }),
            Animated.timing(translateX, {
              toValue: 0,
              duration: duration / 4,
              useNativeDriver: true,
            }),
          ]),
          Animated.timing(rotate, {
            toValue: 1,
            duration: duration,
            useNativeDriver: true,
          }),
        ]),
      ]).start(() => animate());
    };

    animate();
  }, []);

  const spin = rotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Animated.Text
      style={[
        styles.floatingHeart,
        {
          left: startX,
          fontSize: size,
          opacity,
          transform: [{ translateY }, { translateX }, { rotate: spin }],
        },
      ]}
    >
      💕
    </Animated.Text>
  );
};

// Decorative circle component
const DecorativeCircle = ({ size, color, top, left, delay }) => {
  const scale = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.delay(delay),
      Animated.parallel([
        Animated.spring(scale, {
          toValue: 1,
          friction: 4,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.6,
          duration: 600,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={[
        styles.decorativeCircle,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
          top,
          left,
          opacity,
          transform: [{ scale }],
        },
      ]}
    />
  );
};

export default function SplashScreen() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [isConnected, setIsConnected] = useState(true);
  const [isCheckingConnection, setIsCheckingConnection] = useState(true);
  const [retrying, setRetrying] = useState(false);
  const lottieRef = useRef(null);
  const timerRef = useRef(null);
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.3)).current;
  const titleSlideAnim = useRef(new Animated.Value(50)).current;
  const subtitleSlideAnim = useRef(new Animated.Value(30)).current;
  const footerFadeAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const shimmerAnim = useRef(new Animated.Value(0)).current;
  const errorFadeAnim = useRef(new Animated.Value(0)).current;
  const errorScaleAnim = useRef(new Animated.Value(0.8)).current;

  // Check internet and navigate
  const checkAuthAndNavigate = useCallback(async () => {
    const currentUser = auth.currentUser;
    
    if (currentUser) {
      try {
        const profile = await getUserProfile(currentUser.uid);
        if (profile && profile.displayName && profile.displayName !== 'User') {
          router.replace('/(tabs)/home');
        } else {
          router.replace('/onboarding');
        }
      } catch (error) {
        console.error('Error checking profile:', error);
        router.replace('/onboarding');
      }
    } else {
      router.replace('/intro');
    }
    setChecking(false);
  }, [router]);

  // Check internet connectivity
  const checkInternetConnection = useCallback(async () => {
    setIsCheckingConnection(true);
    try {
      const state = await NetInfo.fetch();
      const connected = state.isConnected && state.isInternetReachable !== false;
      setIsConnected(connected);
      setIsCheckingConnection(false);
      return connected;
    } catch (error) {
      console.error('Error checking connectivity:', error);
      setIsConnected(false);
      setIsCheckingConnection(false);
      return false;
    }
  }, []);

  // Retry connection
  const handleRetry = useCallback(async () => {
    setRetrying(true);
    const connected = await checkInternetConnection();
    setRetrying(false);
    
    if (connected) {
      // Hide error overlay
      Animated.parallel([
        Animated.timing(errorFadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(errorScaleAnim, {
          toValue: 0.8,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => {
        // Proceed with auth check after short delay
        timerRef.current = setTimeout(checkAuthAndNavigate, 1500);
      });
    }
  }, [checkInternetConnection, checkAuthAndNavigate, errorFadeAnim, errorScaleAnim]);

  // Show error overlay animation
  const showErrorOverlay = useCallback(() => {
    Animated.parallel([
      Animated.timing(errorFadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.spring(errorScaleAnim, {
        toValue: 1,
        friction: 6,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  }, [errorFadeAnim, errorScaleAnim]);

  useEffect(() => {
    // Start lottie animation
    if (lottieRef.current) {
      lottieRef.current.play();
    }

    // Entrance animations sequence
    Animated.sequence([
      // First: fade in and scale the lottie
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 5,
          tension: 40,
          useNativeDriver: true,
        }),
      ]),
      // Then: slide in title
      Animated.parallel([
        Animated.spring(titleSlideAnim, {
          toValue: 0,
          friction: 6,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.timing(subtitleSlideAnim, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
      ]),
      // Finally: fade in footer
      Animated.timing(footerFadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();

    // Continuous pulse animation for glow effect
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Shimmer animation
    Animated.loop(
      Animated.timing(shimmerAnim, {
        toValue: 1,
        duration: 2000,
        useNativeDriver: true,
      })
    ).start();

    // Check internet connectivity first
    const initializeApp = async () => {
      const connected = await checkInternetConnection();
      
      if (connected) {
        // Internet available - proceed with auth check after animation
        timerRef.current = setTimeout(checkAuthAndNavigate, 3000);
      } else {
        // No internet - show error overlay after a short delay
        setTimeout(showErrorOverlay, 1000);
      }
    };

    initializeApp();

    // Subscribe to network state changes
    const unsubscribe = NetInfo.addEventListener((state) => {
      const connected = state.isConnected && state.isInternetReachable !== false;
      setIsConnected(connected);
      
      if (!connected && !isCheckingConnection) {
        // Lost connection - show error overlay
        showErrorOverlay();
        // Clear any pending navigation
        if (timerRef.current) {
          clearTimeout(timerRef.current);
        }
      }
    });

    return () => {
      unsubscribe();
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  const shimmerTranslate = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-width, width],
  });

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[
          COLORS.backgroundPink,
          COLORS.primaryLight,
          COLORS.background,
          COLORS.accentBlue + '30',
        ]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      />

      {/* Decorative circles */}
      <DecorativeCircle size={120} color={COLORS.accentPurple + '40'} top={80} left={-30} delay={200} />
      <DecorativeCircle size={80} color={COLORS.accentYellow + '50'} top={150} left={width - 60} delay={400} />
      <DecorativeCircle size={60} color={COLORS.accentGreen + '40'} top={height - 200} left={30} delay={600} />
      <DecorativeCircle size={100} color={COLORS.primaryLight + '60'} top={height - 150} left={width - 80} delay={300} />
      <DecorativeCircle size={50} color={COLORS.heart + '30'} top={300} left={50} delay={500} />

      {/* Floating hearts */}
      <FloatingHeart delay={0} startX={width * 0.1} size={24} duration={4000} />
      <FloatingHeart delay={800} startX={width * 0.8} size={20} duration={5000} />
      <FloatingHeart delay={1600} startX={width * 0.5} size={28} duration={4500} />
      <FloatingHeart delay={2400} startX={width * 0.3} size={22} duration={5500} />
      <FloatingHeart delay={1200} startX={width * 0.7} size={18} duration={4200} />

      {/* Main content */}
      <View style={styles.content}>
        {/* Lottie Animation */}
        <Animated.View 
          style={[
            styles.lottieContainer,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }, { scale: pulseAnim }],
            },
          ]}
        >
          <View style={styles.lottieGlow} />
          <LottieView
            ref={lottieRef}
            source={require('../assets/animations/default.json')}
            style={styles.lottie}
            autoPlay
            loop
          />
        </Animated.View>

        {/* App Title */}
        <Animated.View 
          style={[
            styles.titleContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: titleSlideAnim }],
            },
          ]}
        >
          <View style={styles.titleWrapper}>
            <Text style={styles.title}>pairly</Text>
            {/* Shimmer effect */}
            <Animated.View 
              style={[
                styles.shimmer,
                { transform: [{ translateX: shimmerTranslate }] },
              ]} 
            />
          </View>
        </Animated.View>

        {/* Subtitle */}
        <Animated.View 
          style={[
            styles.subtitleContainer,
            {
              opacity: fadeAnim,
              transform: [{ translateY: subtitleSlideAnim }],
            },
          ]}
        >
          <View style={styles.subtitleLine} />
          <Text style={styles.subtitle}>grow your love together</Text>
          <View style={styles.subtitleLine} />
        </Animated.View>

        {/* Tagline badges */}
        <Animated.View 
          style={[
            styles.badgeContainer,
            { opacity: footerFadeAnim },
          ]}
        >
          <View style={[styles.badge, { backgroundColor: COLORS.accentPurple + '30' }]}>
            <Text style={styles.badgeText}>✨ Connect</Text>
          </View>
          <View style={[styles.badge, { backgroundColor: COLORS.heart + '20' }]}>
            <Text style={styles.badgeText}>💕 Love</Text>
          </View>
          <View style={[styles.badge, { backgroundColor: COLORS.accentGreen + '30' }]}>
            <Text style={styles.badgeText}>🌱 Grow</Text>
          </View>
        </Animated.View>
      </View>

      {/* Footer */}
      <Animated.View style={[styles.footer, { opacity: footerFadeAnim }]}>
        <View style={styles.footerDivider} />
        <Text style={styles.footerText}>Made with ❤️ for couples</Text>
      </Animated.View>

      {/* No Internet Overlay */}
      {!isConnected && !isCheckingConnection && (
        <Animated.View 
          style={[
            styles.errorOverlay,
            {
              opacity: errorFadeAnim,
            },
          ]}
        >
          <LinearGradient
            colors={[
              'rgba(255, 249, 245, 0.98)',
              'rgba(255, 240, 240, 0.98)',
            ]}
            style={styles.errorGradient}
          />
          <Animated.View 
            style={[
              styles.errorCard,
              {
                transform: [{ scale: errorScaleAnim }],
              },
            ]}
          >
            {/* Error Icon */}
            <View style={styles.errorIconContainer}>
              <Text style={styles.errorIcon}>📡</Text>
              <View style={styles.errorIconBadge}>
                <Text style={styles.errorIconBadgeText}>!</Text>
              </View>
            </View>

            {/* Error Title */}
            <Text style={styles.errorTitle}>No Internet Connection</Text>
            
            {/* Error Message */}
            <Text style={styles.errorMessage}>
              Pairly needs an internet connection to sync your love journey with your partner. Please check your connection and try again.
            </Text>

            {/* Retry Button */}
            <TouchableOpacity
              style={styles.retryButton}
              onPress={handleRetry}
              disabled={retrying}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={[COLORS.primary, COLORS.primaryDark]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.retryButtonGradient}
              >
                {retrying ? (
                  <ActivityIndicator size="small" color={COLORS.textWhite} />
                ) : (
                  <>
                    <Text style={styles.retryButtonIcon}>🔄</Text>
                    <Text style={styles.retryButtonText}>Try Again</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>

            {/* Tips */}
            <View style={styles.errorTips}>
              <Text style={styles.errorTipsTitle}>Quick Tips:</Text>
              <Text style={styles.errorTipItem}>• Check your Wi-Fi or mobile data</Text>
              <Text style={styles.errorTipItem}>• Move closer to your router</Text>
              <Text style={styles.errorTipItem}>• Toggle airplane mode on/off</Text>
            </View>
          </Animated.View>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    ...StyleSheet.absoluteFillObject,
  },
  decorativeCircle: {
    position: 'absolute',
  },
  floatingHeart: {
    position: 'absolute',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.xl,
  },
  lottieContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.xl,
  },
  lottieGlow: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: COLORS.primaryLight,
    opacity: 0.4,
  },
  lottie: {
    width: 200,
    height: 200,
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  titleWrapper: {
    overflow: 'hidden',
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
  },
  title: {
    fontSize: 52,
    fontWeight: '800',
    color: COLORS.primaryDark,
    letterSpacing: 4,
    textShadowColor: COLORS.primary + '60',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 8,
  },
  shimmer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    width: 60,
    transform: [{ skewX: '-20deg' }],
  },
  subtitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xxl,
  },
  subtitleLine: {
    width: 30,
    height: 2,
    backgroundColor: COLORS.primaryLight,
    borderRadius: 1,
    marginHorizontal: SPACING.md,
  },
  subtitle: {
    fontSize: FONTS.sizes.lg,
    color: COLORS.textSecondary,
    fontWeight: '500',
    fontStyle: 'italic',
  },
  badgeContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: SPACING.sm,
    marginTop: SPACING.lg,
  },
  badge: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.full,
  },
  badgeText: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textPrimary,
    fontWeight: '600',
  },
  footer: {
    position: 'absolute',
    bottom: 60,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  footerDivider: {
    width: 60,
    height: 3,
    backgroundColor: COLORS.primaryLight,
    borderRadius: 2,
    marginBottom: SPACING.md,
  },
  footerText: {
    fontSize: FONTS.sizes.md,
    color: COLORS.textLight,
    fontWeight: '500',
  },
  // Error Overlay Styles
  errorOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
  },
  errorGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  errorCard: {
    backgroundColor: COLORS.backgroundCard,
    borderRadius: RADIUS.xxl,
    padding: SPACING.xxl,
    alignItems: 'center',
    width: '100%',
    maxWidth: 340,
    shadowColor: COLORS.secondary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 12,
  },
  errorIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.backgroundPink,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.lg,
    position: 'relative',
  },
  errorIcon: {
    fontSize: 40,
  },
  errorIconBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.error,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: COLORS.backgroundCard,
  },
  errorIconBadgeText: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.textWhite,
  },
  errorTitle: {
    fontSize: FONTS.sizes.xxl,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: FONTS.sizes.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: SPACING.xl,
  },
  retryButton: {
    width: '100%',
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    marginBottom: SPACING.lg,
  },
  retryButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xl,
    gap: SPACING.sm,
  },
  retryButtonIcon: {
    fontSize: 18,
  },
  retryButtonText: {
    fontSize: FONTS.sizes.lg,
    fontWeight: '600',
    color: COLORS.textWhite,
  },
  errorTips: {
    width: '100%',
    backgroundColor: COLORS.backgroundPink,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
  },
  errorTipsTitle: {
    fontSize: FONTS.sizes.sm,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  errorTipItem: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
});
