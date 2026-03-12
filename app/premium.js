import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Image,
  Switch,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SHADOWS } from '../src/constants/theme';
import { useUserStore } from '../src/store/store';
import { auth } from '../src/firebase/config';
import { updatePremiumStatus } from '../src/firebase/services/userService';

const PremiumScreen = () => {
  const router = useRouter();
  const { setPremium, setTrialStatus, hasUsedTrial, isPremium } = useUserStore();
  const [selectedPlan, setSelectedPlan] = useState('trial'); // 'lifetime' or 'trial'
  const [freeTrialEnabled, setFreeTrialEnabled] = useState(true);

  // If user has used trial, default to lifetime plan
  useEffect(() => {
    if (hasUsedTrial) {
      setSelectedPlan('lifetime');
      setFreeTrialEnabled(false);
    }
  }, [hasUsedTrial]);

  const features = [
    {
      icon: 'people',
      title: 'Free Pro for partner',
      subtitle: '2 for 1',
    },
    {
      icon: 'mail',
      title: 'Unlimited love letters',
      subtitle: '',
    },
    {
      icon: 'star',
      title: 'Full access to all Pro features',
      subtitle: '',
    },
    
  ];

  const handlePurchase = async () => {
    const userId = auth.currentUser?.uid;
    if (!userId) return;

    // Calculate expiry date based on plan
    let expiry = null;
    let isTrialPurchase = false;
    
    if (selectedPlan === 'trial') {
      // 3-day trial
      expiry = new Date();
      expiry.setDate(expiry.getDate() + 3);
      isTrialPurchase = true;
    }
    // For lifetime, expiry is null (no expiry)

    // Save to Firebase
    await updatePremiumStatus(userId, true, expiry, isTrialPurchase || hasUsedTrial);
    
    // Update local store
    setPremium(true);
    if (isTrialPurchase) {
      setTrialStatus(true, expiry);
    }
    
    router.back();
  };

  const handleRestore = () => {
    // In real app, this would restore purchases
    alert('Restore purchases - Coming soon!');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Close Button */}
        <TouchableOpacity 
          style={styles.closeButton}
          onPress={() => router.back()}
        >
          <Ionicons name="close" size={28} color={COLORS.textSecondary} />
        </TouchableOpacity>

        {/* Pig Illustration */}
        <View style={styles.illustrationContainer}>
          <View style={styles.pigCircle}>
            <Text style={styles.pigEmoji}>🐷</Text>
          </View>
          <View style={styles.heartFloatLeft}>
            <Ionicons name="heart" size={20} color={COLORS.heart} />
          </View>
          <View style={styles.heartFloatRight}>
            <Ionicons name="heart" size={16} color={COLORS.heartLight} />
          </View>
        </View>

        {/* Title */}
        <Text style={styles.title}>Unlock Pro levels of love</Text>

        {/* Features List */}
        <View style={styles.featuresContainer}>
          {features.map((feature, index) => (
            <View key={index} style={styles.featureRow}>
              <View style={styles.featureIconContainer}>
                <Ionicons name={feature.icon} size={22} color={COLORS.secondary} />
              </View>
              <View style={styles.featureTextContainer}>
                <Text style={styles.featureTitle}>{feature.title}</Text>
                {feature.subtitle ? (
                  <Text style={styles.featureSubtitle}>{feature.subtitle}</Text>
                ) : null}
              </View>
              <Ionicons name="checkmark-circle" size={24} color={COLORS.accentGreen} />
            </View>
          ))}
        </View>

        {/* Pricing Options */}
        <View style={styles.plansContainer}>
          {/* Lifetime Plan */}
          <TouchableOpacity
            style={[
              styles.planCard,
              selectedPlan === 'lifetime' && styles.planCardSelected,
            ]}
            onPress={() => setSelectedPlan('lifetime')}
          >
            <View style={styles.planBadgeContainer}>
              <View style={[styles.planBadge, styles.payOnceBadge]}>
                <Text style={styles.planBadgeText}>PAY ONCE</Text>
              </View>
            </View>
            <View style={styles.planContent}>
              <Text style={styles.planTitle}>Lifetime</Text>
              <View style={styles.priceRow}>
                <Text style={styles.planPrice}>US$39.99</Text>
                <Text style={styles.planPeriod}> one-time</Text>
              </View>
            </View>
            <View style={[
              styles.radioCircle,
              selectedPlan === 'lifetime' && styles.radioCircleSelected
            ]}>
              {selectedPlan === 'lifetime' && (
                <View style={styles.radioInner} />
              )}
            </View>
          </TouchableOpacity>

          {/* Trial Plan */}
          <TouchableOpacity
            style={[
              styles.planCard,
              selectedPlan === 'trial' && styles.planCardSelected,
              hasUsedTrial && styles.planCardDisabled,
            ]}
            onPress={() => !hasUsedTrial && setSelectedPlan('trial')}
            disabled={hasUsedTrial}
          >
            <View style={styles.planBadgeContainer}>
              <View style={[styles.planBadge, hasUsedTrial ? styles.usedBadge : styles.freeBadge]}>
                <Text style={styles.planBadgeText}>{hasUsedTrial ? 'USED' : 'FREE'}</Text>
              </View>
            </View>
            <View style={styles.planContent}>
              <Text style={[styles.planTitle, hasUsedTrial && styles.planTitleDisabled]}>3-Day Trial</Text>
              <View style={styles.priceRow}>
                <Text style={[styles.planSubtitle, hasUsedTrial && styles.planTextDisabled]}>
                  {hasUsedTrial ? 'Trial already used' : 'then '}
                </Text>
                {!hasUsedTrial && (
                  <>
                    <Text style={styles.planPrice}>US$7.99</Text>
                    <Text style={styles.planPeriod}> per month</Text>
                  </>
                )}
              </View>
            </View>
            <View style={[
              styles.radioCircle,
              selectedPlan === 'trial' && !hasUsedTrial && styles.radioCircleSelected					
            ]}>
              {selectedPlan === 'trial' && !hasUsedTrial && (
                <View style={styles.radioInner} />
              )}
            </View>
          </TouchableOpacity>
        </View>

        {/* Free Trial Toggle - only show if trial not used */}
        {!hasUsedTrial && (
          <View style={styles.toggleContainer}>
            <Text style={styles.toggleLabel}>Free Trial Enabled</Text>
            <Switch
              value={freeTrialEnabled}
              onValueChange={setFreeTrialEnabled}
              trackColor={{ false: COLORS.border, true: COLORS.accentGreen }}
              thumbColor={COLORS.textWhite}
            />
          </View>
        )}

        {/* CTA Button */}
        <TouchableOpacity 
          style={styles.ctaButton}
          onPress={handlePurchase}
        >
          <Text style={styles.ctaButtonText}>
            {selectedPlan === 'trial' ? 'Try for free' : 'Purchase now'}
          </Text>
        </TouchableOpacity>

        {/* Footer Links */}
        <View style={styles.footerLinks}>
          <TouchableOpacity onPress={handleRestore}>
            <Text style={styles.footerLink}>Restore</Text>
          </TouchableOpacity>
          <Text style={styles.footerDivider}>|</Text>
          <TouchableOpacity>
            <Text style={styles.footerLink}>Terms of Use</Text>
          </TouchableOpacity>
          <Text style={styles.footerDivider}>|</Text>
          <TouchableOpacity>
            <Text style={styles.footerLink}>Privacy Policy</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    padding: 20,
    paddingTop: 10,
  },
  closeButton: {
    alignSelf: 'flex-end',
    padding: 8,
  },
  illustrationContainer: {
    alignItems: 'center',
    marginVertical: 20,
    position: 'relative',
  },
  pigCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.medium,
  },
  pigEmoji: {
    fontSize: 60,
  },
  heartFloatLeft: {
    position: 'absolute',
    left: '25%',
    top: 10,
  },
  heartFloatRight: {
    position: 'absolute',
    right: '28%',
    top: 30,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginBottom: 24,
  },
  featuresContainer: {
    marginBottom: 24,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: COLORS.backgroundCard,
    borderRadius: 12,
    marginBottom: 10,
    ...SHADOWS.small,
  },
  featureIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.backgroundPink,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  featureTextContainer: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  featureSubtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  plansContainer: {
    marginBottom: 16,
  },
  planCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: COLORS.backgroundCard,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
    ...SHADOWS.small,
  },
  planCardSelected: {
    borderColor: COLORS.secondary,
    backgroundColor: COLORS.backgroundPink,
  },
  planCardDisabled: {
    opacity: 0.6,
  },
  planBadgeContainer: {
    marginRight: 12,
  },
  planBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  payOnceBadge: {
    backgroundColor: COLORS.secondaryLight,
  },
  freeBadge: {
    backgroundColor: COLORS.accentGreen,
  },
  usedBadge: {
    backgroundColor: COLORS.textSecondary,
  },
  planBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textWhite,
    letterSpacing: 0.5,
  },
  planContent: {
    flex: 1,
  },
  planTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  planTitleDisabled: {
    color: COLORS.textLight,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  planPrice: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  planPeriod: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  planSubtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  planTextDisabled: {
    color: COLORS.textLight,
  },
  radioCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioCircleSelected: {
    borderColor: COLORS.secondary,
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.secondary,
  },
  toggleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: COLORS.backgroundCard,
    borderRadius: 12,
    marginBottom: 20,
    ...SHADOWS.small,
  },
  toggleLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  ctaButton: {
    backgroundColor: COLORS.secondary,
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: 'center',
    marginBottom: 20,
    ...SHADOWS.medium,
  },
  ctaButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.textWhite,
  },
  footerLinks: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 20,
  },
  footerLink: {
    fontSize: 13,
    color: COLORS.textSecondary,
    paddingHorizontal: 8,
  },
  footerDivider: {
    color: COLORS.textLight,
  },
});

export default PremiumScreen;
