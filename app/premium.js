import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SHADOWS } from '../src/constants/theme';
import { useUserStore } from '../src/store/store';
import {
  getOfferings,
  purchasePackage,
  restorePurchases,
  parseCustomerInfo,
} from '../src/services/revenueCatService';

const PremiumScreen = () => {
  const router = useRouter();
  const { mode = 'paywall' } = useLocalSearchParams();
  const { setSubscriptionInfo } = useUserStore();
  const [selectedPlan, setSelectedPlan] = useState('yearly');
  const [offerings, setOfferings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);

  const isExpiredMode = mode === 'expired';

  useEffect(() => {
    loadOfferings();
  }, []);

  const loadOfferings = async () => {
    setLoading(true);
    const current = await getOfferings();
    setOfferings(current);
    setLoading(false);
  };

  const yearlyPackage = offerings?.availablePackages?.find(
    (p) => p.packageType === 'ANNUAL' || p.identifier === '$rc_annual'
  );
  const monthlyPackage = offerings?.availablePackages?.find(
    (p) => p.packageType === 'MONTHLY' || p.identifier === '$rc_monthly'
  );

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
    const pkg = selectedPlan === 'yearly' ? yearlyPackage : monthlyPackage;
    if (!pkg) return;

    setPurchasing(true);
    const { success, customerInfo, error } = await purchasePackage(pkg);
    setPurchasing(false);

    if (success && customerInfo) {
      setSubscriptionInfo(parseCustomerInfo(customerInfo));
      router.back();
    } else if (error && error !== 'cancelled') {
      console.error('Purchase failed:', error);
    }
  };

  const handleRestore = async () => {
    setPurchasing(true);
    const { success, customerInfo, error } = await restorePurchases();
    setPurchasing(false);

    if (success && customerInfo) {
      const info = parseCustomerInfo(customerInfo);
      setSubscriptionInfo(info);
      if (info.isPremium) {
        router.back();
      }
    }
  };

  const yearlyPrice = yearlyPackage?.product?.priceString || 'US$39.99';
  const monthlyPrice = monthlyPackage?.product?.priceString || 'US$7.99';
  const yearlyHasTrial = yearlyPackage?.product?.introPrice != null;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <TouchableOpacity
          style={styles.closeButton}
          onPress={() => router.back()}
        >
          <Ionicons name="close" size={28} color={COLORS.textSecondary} />
        </TouchableOpacity>

        <View style={styles.illustrationContainer}>
          <View style={styles.pigCircle}>
            <Text style={styles.pigEmoji}>{isExpiredMode ? '😢' : '🐷'}</Text>
          </View>
          <View style={styles.heartFloatLeft}>
            <Ionicons name="heart" size={20} color={COLORS.heart} />
          </View>
          <View style={styles.heartFloatRight}>
            <Ionicons name="heart" size={16} color={COLORS.heartLight} />
          </View>
        </View>

        <Text style={styles.title}>
          {isExpiredMode
            ? 'Your Pro subscription has ended'
            : 'Unlock Pro levels of love'}
        </Text>
        {isExpiredMode && (
          <Text style={styles.subtitle}>
            Resubscribe to continue enjoying Pro features with your partner
          </Text>
        )}

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

        {loading ? (
          <ActivityIndicator size="large" color={COLORS.secondary} style={{ marginVertical: 30 }} />
        ) : (
          <>
            <View style={styles.plansContainer}>
              {/* Yearly Plan */}
              <TouchableOpacity
                style={[
                  styles.planCard,
                  selectedPlan === 'yearly' && styles.planCardSelected,
                ]}
                onPress={() => setSelectedPlan('yearly')}
              >
                <View style={styles.planBadgeContainer}>
                  {yearlyHasTrial ? (
                    <View style={[styles.planBadge, styles.freeBadge]}>
                      <Text style={styles.planBadgeText}>FREE TRIAL</Text>
                    </View>
                  ) : (
                    <View style={[styles.planBadge, styles.bestValueBadge]}>
                      <Text style={styles.planBadgeText}>BEST VALUE</Text>
                    </View>
                  )}
                </View>
                <View style={styles.planContent}>
                  <Text style={styles.planTitle}>Yearly</Text>
                  <View style={styles.priceRow}>
                    {yearlyHasTrial && (
                      <Text style={styles.planSubtitle}>3-day free trial, then </Text>
                    )}
                    <Text style={styles.planPrice}>{yearlyPrice}</Text>
                    <Text style={styles.planPeriod}>/year</Text>
                  </View>
                </View>
                <View style={[
                  styles.radioCircle,
                  selectedPlan === 'yearly' && styles.radioCircleSelected,
                ]}>
                  {selectedPlan === 'yearly' && <View style={styles.radioInner} />}
                </View>
              </TouchableOpacity>

              {/* Monthly Plan */}
              <TouchableOpacity
                style={[
                  styles.planCard,
                  selectedPlan === 'monthly' && styles.planCardSelected,
                ]}
                onPress={() => setSelectedPlan('monthly')}
              >
                <View style={styles.planBadgeContainer}>
                  <View style={[styles.planBadge, styles.monthlyBadge]}>
                    <Text style={styles.planBadgeText}>MONTHLY</Text>
                  </View>
                </View>
                <View style={styles.planContent}>
                  <Text style={styles.planTitle}>Monthly</Text>
                  <View style={styles.priceRow}>
                    <Text style={styles.planPrice}>{monthlyPrice}</Text>
                    <Text style={styles.planPeriod}>/month</Text>
                  </View>
                </View>
                <View style={[
                  styles.radioCircle,
                  selectedPlan === 'monthly' && styles.radioCircleSelected,
                ]}>
                  {selectedPlan === 'monthly' && <View style={styles.radioInner} />}
                </View>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.ctaButton, purchasing && { opacity: 0.6 }]}
              onPress={handlePurchase}
              disabled={purchasing}
            >
              <Text style={styles.ctaButtonText}>
                {purchasing
                  ? 'Processing...'
                  : selectedPlan === 'yearly' && yearlyHasTrial
                    ? 'Try for free'
                    : 'Subscribe now'}
              </Text>
            </TouchableOpacity>
          </>
        )}

        <View style={styles.footerLinks}>
          <TouchableOpacity onPress={handleRestore} disabled={purchasing}>
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
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 16,
    paddingHorizontal: 20,
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
  planBadgeContainer: {
    marginRight: 12,
  },
  planBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  freeBadge: {
    backgroundColor: COLORS.accentGreen,
  },
  bestValueBadge: {
    backgroundColor: COLORS.secondaryLight,
  },
  monthlyBadge: {
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
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    flexWrap: 'wrap',
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
