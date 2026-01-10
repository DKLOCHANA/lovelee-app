import { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView,
  TouchableOpacity,
  Modal,
  Animated,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from '../../src/constants/theme';
import { useUserStore } from '../../src/store/store';
import { GIFTS } from '../../src/constants/data';
import Header from '../../src/components/Header';
import { auth } from '../../src/firebase/config';
import { getUserProfile } from '../../src/firebase/services/userService';
import { sendGift as firebaseSendGift, subscribeToGifts } from '../../src/firebase/services/giftsService';

export default function GiftsScreen() {
  const router = useRouter();
  const hearts = useUserStore((state) => state.hearts);
  const spendHearts = useUserStore((state) => state.spendHearts);
  const isPremium = useUserStore((state) => state.isPremium);
  
  const [profile, setProfile] = useState(null);
  const [firebaseGifts, setFirebaseGifts] = useState([]);
  const [selectedGift, setSelectedGift] = useState(null);
  const [showSentModal, setShowSentModal] = useState(false);
  const [sentGiftEmoji, setSentGiftEmoji] = useState('');
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load profile and subscribe to gifts
  useEffect(() => {
    let unsubscribe = null;
    
    const init = async () => {
      if (!auth.currentUser) return;
      
      const userProfile = await getUserProfile(auth.currentUser.uid);
      setProfile(userProfile);
      
      if (userProfile?.coupleId) {
        // Subscribe to real-time gift updates
        unsubscribe = subscribeToGifts(userProfile.coupleId, (gifts) => {
          setFirebaseGifts(gifts);
          setLoading(false);
        });
      } else {
        setLoading(false);
      }
    };
    
    init();
    
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  // Filter sent/received gifts
  const sentGifts = firebaseGifts.filter(g => g.senderId === auth.currentUser?.uid);
  const receivedGifts = firebaseGifts.filter(g => g.receiverId === auth.currentUser?.uid);

  const handleSelectGift = (gift) => {
    // Check if gift is premium and user is not premium
    if (gift.premium && !isPremium) {
      setShowPremiumModal(true);
      return;
    }
    setSelectedGift(gift);
  };

  const handleSendGift = async () => {
    if (!profile?.coupleId || !profile?.partnerId) {
      Alert.alert('Connect First', 'You need to connect with your partner before sending gifts.');
      return;
    }

    if (selectedGift && hearts >= selectedGift.hearts) {
      // Send to Firebase
      const result = await firebaseSendGift(
        profile.coupleId,
        auth.currentUser.uid,
        profile.partnerId,
        {
          giftId: selectedGift.id,
          emoji: selectedGift.emoji,
          label: selectedGift.label,
          hearts: selectedGift.hearts,
        }
      );
      
      if (result.success) {
        spendHearts(selectedGift.hearts);
        setSentGiftEmoji(selectedGift.emoji);
        setShowSentModal(true);
        setSelectedGift(null);
        setTimeout(() => setShowSentModal(false), 2500);
      } else {
        Alert.alert('Error', result.error || 'Failed to send gift. Please try again.');
      }
    }
  };

  const canAfford = selectedGift ? hearts >= selectedGift.hearts : false;

  return (
    <SafeAreaView style={styles.container}>
      <Header title="Send Gifts" subtitle="Show your love with cute gifts!" />

      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Quick Affections */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Affections</Text>
          <Text style={styles.sectionSubtitle}>Free to send!</Text>
          <View style={styles.quickGrid}>
            {GIFTS.slice(0, 4).map((gift) => (
              <TouchableOpacity
                key={gift.id}
                style={[
                  styles.quickCard,
                  selectedGift?.id === gift.id && styles.quickCardSelected,
                ]}
                onPress={() => handleSelectGift({ ...gift, hearts: 0 })}
              >
                <Text style={styles.quickEmoji}>{gift.emoji}</Text>
                <Text style={styles.quickLabel}>{gift.label}</Text>
                <Text style={styles.freeTag}>FREE</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* All Gifts */}
        <View style={styles.section}>
          
          <Text style={styles.sectionTitle}>All Gifts</Text>
          <Text style={styles.sectionSubtitle}>Turn your hearts into smiles!</Text>
          
          <View style={styles.giftsGrid}>
            {GIFTS.slice(4).map((gift) => (
              <TouchableOpacity
                key={gift.id}
                style={[
                  styles.giftCard,
                  selectedGift?.id === gift.id && styles.giftCardSelected,
                  hearts < gift.hearts && !gift.premium && styles.giftCardDisabled,
                  gift.premium && !isPremium && styles.giftCardPremium,
                ]}
                onPress={() => handleSelectGift(gift)}
              >
                {/* Premium Lock Badge */}
                {gift.premium && !isPremium && (
                  <View style={styles.premiumBadge}>
                    <Ionicons name="lock-closed" size={12} color={COLORS.textWhite} />
                  </View>
                )}
                <Text style={styles.giftEmoji}>{gift.emoji}</Text>
                <Text style={styles.giftLabel}>{gift.label}</Text>
                <View style={styles.giftCost}>
                  {gift.premium && !isPremium ? (
                    <Text style={styles.premiumText}>PRO</Text>
                  ) : (
                    <>
                      <Text style={styles.giftHeartIcon}>❤️</Text>
                      <Text style={[
                        styles.giftHeartCount,
                        hearts < gift.hearts && styles.giftHeartCountDisabled,
                      ]}>
                        {gift.hearts}
                      </Text>
                    </>
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        
      </ScrollView>

      {/* Send Button */}
      {selectedGift && (
        <View style={styles.footer}>
          <View style={styles.selectedInfo}>
            <Text style={styles.selectedEmoji}>{selectedGift.emoji}</Text>
            <View style={styles.selectedDetails}>
              <Text style={styles.selectedName}>{selectedGift.label}</Text>
              <Text style={styles.selectedCost}>
                {selectedGift.hearts === 0 ? 'Free!' : `❤️ ${selectedGift.hearts} hearts`}
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={[
              styles.sendButton,
              !canAfford && selectedGift.hearts > 0 && styles.sendButtonDisabled,
            ]}
            onPress={handleSendGift}
            disabled={!canAfford && selectedGift.hearts > 0}
          >
            <Text style={styles.sendButtonText}>
              {canAfford || selectedGift.hearts === 0 ? 'Send 💕' : 'Not enough 💔'}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Sent Confirmation Modal */}
      <Modal
        visible={showSentModal}
        transparent={true}
        animationType="fade"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.sentModal}>
            <Text style={styles.sentEmoji}>{sentGiftEmoji}</Text>
            <Text style={styles.sentTitle}>Gift Sent! 💕</Text>
            <Text style={styles.sentSubtitle}>
              Your partner will love it!
            </Text>
          </View>
        </View>
      </Modal>

      {/* Premium Modal */}
      <Modal
        visible={showPremiumModal}
        transparent={true}
        animationType="fade"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.premiumModal}>
            <View style={styles.premiumIconCircle}>
              <Ionicons name="lock-closed" size={32} color={COLORS.secondary} />
            </View>
            <Text style={styles.premiumModalTitle}>Premium Gift 💎</Text>
            <Text style={styles.premiumModalSubtitle}>
              Unlock Pro to send this special gift to your partner!
            </Text>
            <TouchableOpacity
              style={styles.upgradeBttn}
              onPress={() => {
                setShowPremiumModal(false);
                router.push('/premium');
              }}
            >
              <Text style={styles.upgradeButtonText}>Upgrade to Pro</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setShowPremiumModal(false)}
            >
              <Text style={styles.cancelButtonText}>Maybe Later</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    padding: SPACING.lg,
    paddingTop: 0,
    paddingBottom: 150,
  },
  section: {
    marginBottom: SPACING.xl,
  },
  sectionTitle: {
    fontSize: FONTS.sizes.lg,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  sectionSubtitle: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
  },
  quickGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  quickCard: {
    width: '23%',
    backgroundColor: COLORS.backgroundCard,
    borderRadius: RADIUS.xl,
    padding: SPACING.md,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
    ...SHADOWS.small,
  },
  quickCardSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
  },
  quickEmoji: {
    fontSize: 28,
    marginBottom: SPACING.xs,
  },
  quickLabel: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  freeTag: {
    fontSize: 8,
    fontWeight: '700',
    color: COLORS.success,
    backgroundColor: COLORS.accentGreen + '30',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
  },
  giftsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  giftCard: {
    width: '48%',
    backgroundColor: COLORS.backgroundCard,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    alignItems: 'center',
    marginBottom: SPACING.md,
    borderWidth: 2,
    borderColor: 'transparent',
    ...SHADOWS.small,
  },
  giftCardSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
  },
  giftCardDisabled: {
    opacity: 0.5,
  },
  giftEmoji: {
    fontSize: 50,
    marginBottom: SPACING.sm,
  },
  giftLabel: {
    fontSize: FONTS.sizes.md,
    fontWeight: '500',
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  giftCost: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  giftHeartIcon: {
    fontSize: 14,
    marginRight: 4,
  },
  giftHeartCount: {
    fontSize: FONTS.sizes.sm,
    fontWeight: '600',
    color: COLORS.heart,
  },
  giftHeartCountDisabled: {
    color: COLORS.textLight,
  },
  recentScroll: {
    paddingRight: SPACING.lg,
  },
  recentCard: {
    backgroundColor: COLORS.backgroundCard,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginRight: SPACING.sm,
    ...SHADOWS.small,
  },
  recentEmoji: {
    fontSize: 24,
  },
  footer: {
    position: 'absolute',
    bottom: 100,
   
    backgroundColor: COLORS.backgroundCard,
    padding: SPACING.lg,
    paddingBottom: SPACING.lg,
   
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: RADIUS.xl,
    marginHorizontal: SPACING.sm,
    ...SHADOWS.large,
  },
  selectedInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectedEmoji: {
    fontSize: 36,
    marginRight: SPACING.md,
  },
  selectedDetails: {
    flex: 1,
  },
  selectedName: {
    fontSize: FONTS.sizes.md,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  selectedCost: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textSecondary,
  },
  sendButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.full,
  },
  sendButtonDisabled: {
    backgroundColor: COLORS.border,
  },
  sendButtonText: {
    color: COLORS.textWhite,
    fontWeight: '600',
    fontSize: FONTS.sizes.md,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sentModal: {
    backgroundColor: COLORS.backgroundCard,
    borderRadius: RADIUS.xxl,
    padding: SPACING.xxxl,
    alignItems: 'center',
    ...SHADOWS.large,
  },
  sentEmoji: {
    fontSize: 80,
    marginBottom: SPACING.lg,
  },
  sentTitle: {
    fontSize: FONTS.sizes.xxl,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  sentSubtitle: {
    fontSize: FONTS.sizes.md,
    color: COLORS.textSecondary,
  },
  // Premium styles
  giftCardPremium: {
    opacity: 0.7,
    borderColor: COLORS.secondaryLight,
    borderWidth: 1,
  },
  premiumBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: COLORS.secondary,
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  premiumText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.secondary,
  },
  premiumModal: {
    backgroundColor: COLORS.backgroundCard,
    borderRadius: RADIUS.xxl,
    padding: SPACING.xxxl,
    alignItems: 'center',
    width: '80%',
    ...SHADOWS.large,
  },
  premiumIconCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: COLORS.backgroundPink,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  premiumModalTitle: {
    fontSize: FONTS.sizes.xl,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  premiumModalSubtitle: {
    fontSize: FONTS.sizes.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.xl,
  },
  upgradeBttn: {
    backgroundColor: COLORS.secondary,
    paddingHorizontal: SPACING.xxl,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.full,
    width: '100%',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  upgradeButtonText: {
    color: COLORS.textWhite,
    fontWeight: '700',
    fontSize: FONTS.sizes.md,
  },
  cancelButton: {
    paddingVertical: SPACING.sm,
  },
  cancelButtonText: {
    color: COLORS.textSecondary,
    fontSize: FONTS.sizes.sm,
  },
});
