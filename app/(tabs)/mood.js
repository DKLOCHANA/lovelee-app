import { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from '../../src/constants/theme';
import { useUserStore } from '../../src/store/store';
import { MOODS } from '../../src/constants/data';
import Header from '../../src/components/Header';
import { auth } from '../../src/firebase/config';
import { getUserProfile } from '../../src/firebase/services/userService';
import { setMood as firebaseSetMood, subscribeToMoods } from '../../src/firebase/services/moodService';

export default function MoodScreen() {
  const addHearts = useUserStore((state) => state.addHearts);

  const [profile, setProfile] = useState(null);
  const [currentMood, setCurrentMood] = useState(null);
  const [partnerMood, setPartnerMood] = useState(null);
  const [selectedMood, setSelectedMood] = useState(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load profile and subscribe to moods
  useEffect(() => {
    let unsubscribe = null;
    
    const init = async () => {
      if (!auth.currentUser) return;
      
      const userProfile = await getUserProfile(auth.currentUser.uid);
      setProfile(userProfile);
      
      if (userProfile?.coupleId) {
        // Subscribe to real-time mood updates
        unsubscribe = subscribeToMoods(userProfile.coupleId, (moods) => {
          // Get current user's latest mood
          const myMood = moods.find(m => m.userId === auth.currentUser.uid);
          if (myMood) {
            setCurrentMood({ emoji: myMood.emoji, label: myMood.label, id: myMood.moodId });
            setSelectedMood({ emoji: myMood.emoji, label: myMood.label, id: myMood.moodId });
          }
          
          // Get partner's latest mood
          if (userProfile.partnerId) {
            const partnerMoodData = moods.find(m => m.userId === userProfile.partnerId);
            if (partnerMoodData) {
              setPartnerMood({ emoji: partnerMoodData.emoji, label: partnerMoodData.label, id: partnerMoodData.moodId });
            }
          }
          
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

  const handleSelectMood = (mood) => {
    setSelectedMood(mood);
  };

  const handleConfirmMood = async () => {
    if (!profile?.coupleId) {
      Alert.alert('Connect First', 'You need to connect with your partner before sharing moods.');
      return;
    }

    if (selectedMood) {
      const result = await firebaseSetMood(
        profile.coupleId,
        auth.currentUser.uid,
        {
          moodId: selectedMood.id,
          emoji: selectedMood.emoji,
          label: selectedMood.label,
        }
      );
      
      if (result.success) {
        setCurrentMood(selectedMood);
        addHearts(2); // Small reward for sharing mood
        setShowConfirmation(true);
        setTimeout(() => setShowConfirmation(false), 2000);
      } else {
        Alert.alert('Error', 'Failed to share mood. Please try again.');
      }
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Header title="How are you feeling? 😊" subtitle="Share your mood with your partner" />
      
      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Current Moods Display */}
        <View style={styles.currentMoodsContainer}>
          <View style={styles.moodDisplay}>
            <Text style={styles.moodDisplayEmoji}>
              {currentMood?.emoji || '❓'}
            </Text>
            <Text style={styles.moodDisplayLabel}>You</Text>
            <Text style={styles.moodDisplayStatus}>
              {currentMood?.label || 'Not set'}
            </Text>
          </View>
          
          <View style={styles.heartConnector}>
            <Text style={styles.heartEmoji}>💕</Text>
          </View>
          
          <View style={styles.moodDisplay}>
            <Text style={styles.moodDisplayEmoji}>
              {partnerMood?.emoji || '❓'}
            </Text>
            <Text style={styles.moodDisplayLabel}>Partner</Text>
            <Text style={styles.moodDisplayStatus}>
              {partnerMood?.label || 'Waiting...'}
            </Text>
          </View>
        </View>

        {/* Mood Grid */}
        <View style={styles.moodSection}>
          <Text style={styles.sectionTitle}>Select your mood</Text>
          <View style={styles.moodGrid}>
            {MOODS.map((mood) => (
              <TouchableOpacity
                key={mood.id}
                style={[
                  styles.moodCard,
                  selectedMood?.id === mood.id && styles.moodCardSelected,
                ]}
                onPress={() => handleSelectMood(mood)}
              >
                <Text style={styles.moodEmoji}>{mood.emoji}</Text>
                <Text style={[
                  styles.moodLabel,
                  selectedMood?.id === mood.id && styles.moodLabelSelected,
                ]}>
                  {mood.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Fixed Bottom Share Button */}
      {selectedMood && (
        <View style={styles.footer}>
          <View style={styles.selectedInfo}>
            <Text style={styles.selectedEmoji}>{selectedMood.emoji}</Text>
            <View style={styles.selectedDetails}>
              <Text style={styles.selectedName}>{selectedMood.label}</Text>
              <Text style={styles.selectedHint}>Ready to share</Text>
            </View>
          </View>
          {showConfirmation ? (
            <View style={styles.confirmationBadge}>
              <Text style={styles.confirmationText}>Shared! 💕</Text>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.shareButton}
              onPress={handleConfirmMood}
            >
              <Text style={styles.shareButtonText}>Share 💕</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    paddingBottom: SPACING.xl,
  },
  currentMoodsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.lg,
    marginHorizontal: SPACING.lg,
    backgroundColor: COLORS.backgroundCard,
    borderRadius: RADIUS.xxl,
    ...SHADOWS.medium,
  },
  moodDisplay: {
    flex: 1,
    alignItems: 'center',
  },
  moodDisplayEmoji: {
    fontSize: 48,
    marginBottom: SPACING.sm,
  },
  moodDisplayLabel: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textLight,
    marginBottom: SPACING.xs,
  },
  moodDisplayStatus: {
    fontSize: FONTS.sizes.md,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  heartConnector: {
    paddingHorizontal: SPACING.md,
  },
  heartEmoji: {
    fontSize: 28,
  },
  moodSection: {
    padding: SPACING.lg,
  },
  sectionTitle: {
    fontSize: FONTS.sizes.lg,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: SPACING.lg,
    textAlign: 'center',
  },
  moodGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  moodCard: {
    width: '31%',
    backgroundColor: COLORS.backgroundCard,
    borderRadius: RADIUS.xl,
    padding: SPACING.md,
    alignItems: 'center',
    marginBottom: SPACING.md,
    borderWidth: 2,
    borderColor: 'transparent',
    ...SHADOWS.small,
  },
  moodCardSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
  },
  moodEmoji: {
    fontSize: 32,
    marginBottom: SPACING.xs,
  },
  moodLabel: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  moodLabelSelected: {
    color: COLORS.primaryDark,
    fontWeight: '600',
  },
  footer: {
    marginBottom:100,
    backgroundColor: COLORS.backgroundCard,
    padding: SPACING.lg,
    paddingBottom: SPACING.xl,
    marginHorizontal: SPACING.sm,
  
   
    borderRadius: RADIUS.xl,
    flexDirection: 'row',
    alignItems: 'center',
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
  selectedHint: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textSecondary,
  },
  shareButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.full,
  },
  shareButtonText: {
    color: COLORS.textWhite,
    fontWeight: '600',
    fontSize: FONTS.sizes.md,
  },
  confirmationBadge: {
    backgroundColor: COLORS.accentGreen + '30',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.full,
  },
  confirmationText: {
    color: COLORS.success,
    fontWeight: '600',
    fontSize: FONTS.sizes.sm,
  },
});
