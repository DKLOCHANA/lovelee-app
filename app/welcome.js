import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from '../src/constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Logo Section */}
        <View style={styles.logoSection}>
          <View style={styles.heartContainer}>
            <Text style={styles.heartEmoji}>💕</Text>
          </View>
          <Text style={styles.title}>lovelee</Text>
          <Text style={styles.subtitle}>grow your love together</Text>
        </View>

        {/* Features */}
        <View style={styles.featuresContainer}>
          <FeatureItem 
            icon="mail" 
            title="Love Notes" 
            description="Send doodles and messages" 
          />
          <FeatureItem 
            icon="happy" 
            title="Mood Check-ins" 
            description="Share how you're feeling" 
          />
          <FeatureItem 
            icon="heart" 
            title="Virtual Pet" 
            description="Care for your pet together" 
          />
          <FeatureItem 
            icon="gift" 
            title="Gifts & Hearts" 
            description="Show love with cute gifts" 
          />
        </View>

        {/* Buttons */}
        <View style={styles.buttonsContainer}>
          {/* Sign Up Button */}
          <TouchableOpacity 
            style={styles.signUpButton}
            onPress={() => router.push('/signup')}
          >
            <Text style={styles.signUpButtonText}>Create Account</Text>
          </TouchableOpacity>

          {/* Login Button */}
          <TouchableOpacity 
            style={styles.loginButton}
            onPress={() => router.push('/login')}
          >
            <Text style={styles.loginButtonText}>Sign In</Text>
          </TouchableOpacity>

          
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            By continuing, you agree to our{' '}
            <Text style={styles.footerLink}>Terms</Text>
            {' '}and{' '}
            <Text style={styles.footerLink}>Privacy Policy</Text>
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

function FeatureItem({ icon, title, description }) {
  return (
    <View style={styles.featureItem}>
      <View style={styles.featureIcon}>
        <Ionicons name={icon} size={22} color={COLORS.primary} />
      </View>
      <View style={styles.featureText}>
        <Text style={styles.featureTitle}>{title}</Text>
        <Text style={styles.featureDescription}>{description}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    flex: 1,
    padding: SPACING.xl,
  },
  logoSection: {
    alignItems: 'center',
    marginTop: SPACING.xxl,
    marginBottom: SPACING.xxxl,
  },
  heartContainer: {
    marginBottom: SPACING.md,
  },
  heartEmoji: {
    fontSize: 80,
  },
  title: {
    fontSize: 36,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  subtitle: {
    fontSize: FONTS.sizes.md,
    color: COLORS.textSecondary,
  },
  featuresContainer: {
    marginBottom: SPACING.xxxl,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  featureIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  featureText: {
    flex: 1,
  },
  featureTitle: {
    fontSize: FONTS.sizes.md,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  featureDescription: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textSecondary,
  },
  buttonsContainer: {
    marginTop: 'auto',
  },
  signUpButton: {
    backgroundColor: COLORS.secondary,
    paddingVertical: SPACING.lg,
    borderRadius: RADIUS.full,
    alignItems: 'center',
    marginBottom: SPACING.md,
    ...SHADOWS.medium,
  },
  signUpButtonText: {
    fontSize: FONTS.sizes.lg,
    fontWeight: '700',
    color: COLORS.textWhite,
  },
  loginButton: {
    backgroundColor: COLORS.backgroundCard,
    paddingVertical: SPACING.lg,
    borderRadius: RADIUS.full,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.secondary,
    marginBottom: SPACING.md,
  },
  loginButtonText: {
    fontSize: FONTS.sizes.lg,
    fontWeight: '700',
    color: COLORS.secondary,
  },
  guestButton: {
    paddingVertical: SPACING.md,
    alignItems: 'center',
  },
  guestButtonText: {
    fontSize: FONTS.sizes.md,
    color: COLORS.textSecondary,
  },
  footer: {
    marginTop: SPACING.xl,
    alignItems: 'center',
  },
  footerText: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textLight,
    textAlign: 'center',
    lineHeight: 20,
  },
  footerLink: {
    color: COLORS.primary,
    fontWeight: '600',
  },
});
