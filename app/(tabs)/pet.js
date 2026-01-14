import { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity,
  Animated,
  Easing,
  Dimensions,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import LottieView from 'lottie-react-native';
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from '../../src/constants/theme';
import { usePetStore, useUserStore } from '../../src/store/store';
import { PET_SKINS } from '../../src/constants/data';
import Header from '../../src/components/Header';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Animation sources
const ANIMATIONS = {
  default: require('../../assets/animations/default.json'),
  eating : require('../../assets/animations/eating.json'),
  sleeping: require('../../assets/animations/sleeping.json'),
  playing: require('../../assets/animations/playing.json'),
  bathing: require('../../assets/animations/bathing.json'),
};

export default function PetScreen() {
  const router = useRouter();
  const petName = usePetStore((state) => state.petName);
  const petSkin = usePetStore((state) => state.petSkin);
  const petHappiness = usePetStore((state) => state.petHappiness);
  const petHunger = usePetStore((state) => state.petHunger);
  const feedPet = usePetStore((state) => state.feedPet);
  const playWithPet = usePetStore((state) => state.playWithPet);
  const hearts = useUserStore((state) => state.hearts);
  const addHearts = useUserStore((state) => state.addHearts);
  const spendHearts = useUserStore((state) => state.spendHearts);
  const isPremium = useUserStore((state) => state.isPremium);

  const [showHearts, setShowHearts] = useState(false);
  const [action, setAction] = useState(null);
  const [currentAnimation, setCurrentAnimation] = useState('default');
  const [isNight, setIsNight] = useState(false);
  const [loopCount, setLoopCount] = useState(0);
  const [isActionPlaying, setIsActionPlaying] = useState(false);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  
  // Animations
  const bounceAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const lottieRef = useRef(null);
  
  // Sky animations
  const cloud1Anim = useRef(new Animated.Value(0)).current;
  const cloud2Anim = useRef(new Animated.Value(0)).current;
  const starTwinkle1 = useRef(new Animated.Value(1)).current;
  const starTwinkle2 = useRef(new Animated.Value(1)).current;
  const starTwinkle3 = useRef(new Animated.Value(1)).current;

  // Get current pet emoji
  const currentPet = PET_SKINS.find(p => p.id === petSkin) || PET_SKINS[0];

  // Check time for day/night
  useEffect(() => {
    const checkTime = () => {
      const hour = new Date().getHours();
      setIsNight(hour >= 18 || hour < 6);
    };
    checkTime();
    const interval = setInterval(checkTime, 60000); // Check every minute
    return () => clearInterval(interval);
  }, []);

  // Cloud floating animation
  useEffect(() => {
    const animateClouds = () => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(cloud1Anim, {
            toValue: 30,
            duration: 4000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(cloud1Anim, {
            toValue: 0,
            duration: 4000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      ).start();

      Animated.loop(
        Animated.sequence([
          Animated.timing(cloud2Anim, {
            toValue: -25,
            duration: 3500,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(cloud2Anim, {
            toValue: 0,
            duration: 3500,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      ).start();
    };
    animateClouds();
  }, []);

  // Star twinkling animation
  useEffect(() => {
    const twinkle = (anim, delay) => {
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(anim, {
            toValue: 0.3,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      ).start();
    };
    
    twinkle(starTwinkle1, 0);
    twinkle(starTwinkle2, 400);
    twinkle(starTwinkle3, 800);
  }, []);

  useEffect(() => {
    // Play Lottie animation on mount
    if (lottieRef.current) {
      lottieRef.current.play();
    }
  }, [currentAnimation]);

  const playActionAnimation = (animationKey) => {
    if (isActionPlaying) return; // Prevent multiple triggers
    
    setIsActionPlaying(true);
    setLoopCount(0);
    setCurrentAnimation(animationKey);
    
    if (lottieRef.current) {
      lottieRef.current.reset();
      lottieRef.current.play();
    }
  };

  const handleAnimationFinish = (isCancelled) => {
    if (isCancelled) return;
    
    if (currentAnimation !== 'default') {
      const newLoopCount = loopCount + 1;
      setLoopCount(newLoopCount);
      
      if (newLoopCount < 2) {
        // Play again for second loop
        if (lottieRef.current) {
          lottieRef.current.reset();
          lottieRef.current.play();
        }
      } else {
        // Switch back to default after 2 loops
        setCurrentAnimation('default');
        setLoopCount(0);
        setIsActionPlaying(false);
      }
    }
  };

  const handleTapPet = () => {
    // Bounce animation
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 1.2,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
    
    // Reset and replay Lottie animation on tap
    if (lottieRef.current) {
      lottieRef.current.reset();
      lottieRef.current.play();
    }
  };

  const handleFeed = () => {
    if (hearts >= 5) {
      spendHearts(5);
      feedPet();
      setAction('feed');
      showActionFeedback();
      playActionAnimation('eating');
    }
  };

  const handlePlay = () => {
    playWithPet();
    addHearts(3);
    setAction('play');
    showActionFeedback();
    playActionAnimation('playing');
  };

  const handleBath = () => {
    if (!isPremium) {
      setShowPremiumModal(true);
      return;
    }
    if (hearts >= 10) {
      spendHearts(10);
      setAction('bath');
      showActionFeedback();
      playActionAnimation('bathing');
    }
  };

  const handleSleep = () => {
    if (!isPremium) {
      setShowPremiumModal(true);
      return;
    }
    setAction('sleep');
    showActionFeedback();
    playActionAnimation('sleeping');
  };

  const showActionFeedback = () => {
    setShowHearts(true);
    Animated.sequence([
      Animated.timing(bounceAnim, {
        toValue: -50,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(bounceAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setShowHearts(false);
      setAction(null);
    });
  };

  const getPetMood = () => {
    if (petHappiness >= 80) return { emoji: '😊', text: 'Very Happy!' };
    if (petHappiness >= 60) return { emoji: '🙂', text: 'Happy' };
    if (petHappiness >= 40) return { emoji: '😐', text: 'Okay' };
    if (petHappiness >= 20) return { emoji: '😢', text: 'Sad' };
    return { emoji: '😭', text: 'Very Sad' };
  };

  const petMood = getPetMood();

  return (
    <SafeAreaView style={styles.container}>
      <Header title="Your Pet" subtitle={`Care for ${petName} together!`} />

      {/* Pet Area */}
      <View style={styles.petArea}>
        {/* Background decorations - Clouds (always visible) */}
        <View style={styles.bgDecorations}>
          <Animated.Text 
            style={[
              styles.cloud,
              { transform: [{ translateX: cloud1Anim }] }
            ]}
          >
            ☁️
          </Animated.Text>
          <Animated.Text 
            style={[
              styles.cloud, 
              styles.cloud2,
              { transform: [{ translateX: cloud2Anim }] }
            ]}
          >
            ☁️
          </Animated.Text>
          <Animated.Text 
            style={[
              styles.cloud, 
              styles.cloud3,
              { transform: [{ translateX: cloud1Anim }] }
            ]}
          >
            ☁️
          </Animated.Text>
          
          {/* Day/Night elements */}
          {isNight ? (
            <>
              {/* Moon */}
              <Text style={styles.moon}>🌙</Text>
              
              {/* Stars */}
              <Animated.Text 
                style={[
                  styles.star, 
                  styles.star1,
                  { opacity: starTwinkle1 }
                ]}
              >
                ⭐
              </Animated.Text>
              <Animated.Text 
                style={[
                  styles.star, 
                  styles.star2,
                  { opacity: starTwinkle2 }
                ]}
              >
                ✨
              </Animated.Text>
              <Animated.Text 
                style={[
                  styles.star, 
                  styles.star3,
                  { opacity: starTwinkle3 }
                ]}
              >
                ⭐
              </Animated.Text>
              <Animated.Text 
                style={[
                  styles.star, 
                  styles.star4,
                  { opacity: starTwinkle1 }
                ]}
              >
                ✨
              </Animated.Text>
              <Animated.Text 
                style={[
                  styles.star, 
                  styles.star5,
                  { opacity: starTwinkle2 }
                ]}
              >
                ⭐
              </Animated.Text>
            </>
          ) : (
            <>
              {/* Sun */}
              <Text style={styles.sun}>☀️</Text>
            </>
          )}
        </View>

        {/* Pet */}
        <TouchableOpacity 
          onPress={handleTapPet}
          activeOpacity={0.9}
        >
          <Animated.View 
            style={[
              styles.petContainer,
              {
                transform: [
                  { scale: scaleAnim },
                ],
              },
            ]}
          >
            <LottieView
              ref={lottieRef}
              source={ANIMATIONS[currentAnimation]}
              style={styles.lottieAnimation}
              autoPlay
              loop={currentAnimation === 'default'}
              onAnimationFinish={handleAnimationFinish}
            />
            
            {/* Action feedback */}
            {showHearts && (
              <Animated.View 
                style={[
                  styles.actionFeedback,
                  { transform: [{ translateY: bounceAnim }] },
                ]}
              >
                <Text style={styles.actionEmoji}>
                  {action === 'feed' ? '🍖' : '💕'}
                </Text>
              </Animated.View>
            )}
          </Animated.View>
        </TouchableOpacity>

        {/* Pet name and mood */}
        <View style={styles.petInfo}>
          <Text style={styles.petName}>{petName}</Text>
          <Text style={styles.petMood}>
            {petMood.emoji} {petMood.text}
          </Text>
        </View>
      </View>

      {/* Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Happiness</Text>
          <View style={styles.statBarContainer}>
            <View style={[styles.statBar, styles.happinessBar, { width: `${petHappiness}%` }]} />
          </View>
          <Text style={styles.statValue}>{petHappiness}%</Text>
        </View>
        
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Fullness</Text>
          <View style={styles.statBarContainer}>
            <View style={[styles.statBar, styles.hungerBar, { width: `${petHunger}%` }]} />
          </View>
          <Text style={styles.statValue}>{petHunger}%</Text>
        </View>
      </View>

      {/* Actions */}
      <View style={styles.actionsContainer}>
        <TouchableOpacity 
          style={[styles.actionButton, hearts < 5 && styles.actionButtonDisabled]}
          onPress={handleFeed}
          disabled={hearts < 5}
        >
          <Text style={styles.actionButtonEmoji}>🍖</Text>
          <Text style={styles.actionButtonLabel}>Feed</Text>
          <Text style={styles.actionButtonCost}>💖 5</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.actionButton}
          onPress={handlePlay}
        >
          <Text style={styles.actionButtonEmoji}>🎾</Text>
          <Text style={styles.actionButtonLabel}>Play</Text>
          <Text style={styles.actionButtonReward}>+💖 3</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.actionButton, !isPremium && hearts < 10 && styles.actionButtonDisabled]}
          onPress={handleBath}
          disabled={!isPremium && hearts < 10}
        >
          {!isPremium && (
            <View style={styles.premiumBadge}>
              <Ionicons name="lock-closed" size={10} color={COLORS.textWhite} />
            </View>
          )}
          <Text style={styles.actionButtonEmoji}>🛁</Text>
          <Text style={styles.actionButtonLabel}>Bath</Text>
          {isPremium ? (
            <Text style={styles.actionButtonCost}>💖 10</Text>
          ) : (
            <Text style={styles.premiumTag}>PRO</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.actionButton}
          onPress={handleSleep}
        >
          {!isPremium && (
            <View style={styles.premiumBadge}>
              <Ionicons name="lock-closed" size={10} color={COLORS.textWhite} />
            </View>
          )}
          <Text style={styles.actionButtonEmoji}>😴</Text>
          <Text style={styles.actionButtonLabel}>Sleep</Text>
          {isPremium ? (
            <Text style={styles.actionButtonCost}>Free</Text>
          ) : (
            <Text style={styles.premiumTag}>PRO</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Tip */}
      <View style={styles.tipContainer}>
        <Text style={styles.tipText}>
          💡 Tip: Care for {petName} together with your partner to earn bonus hearts!
        </Text>
      </View>

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
            <Text style={styles.premiumModalTitle}>Premium Action 💎</Text>
            <Text style={styles.premiumModalSubtitle}>
              Upgrade to Pro to unlock Bath and Sleep actions for your pet!
            </Text>
            <TouchableOpacity
              style={styles.upgradeButton}
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
    backgroundColor: COLORS.backgroundPink,
  },
  petArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  bgDecorations: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  cloud: {
    position: 'absolute',
    fontSize: 60,
    top: 10,
    left: 20,
    opacity: 0.7,
  },
  cloud2: {
    top: 50,
    left: 'auto',
    right: 30,
    fontSize: 70,
  },
  cloud3: {
    top: 100,
    left: 100,
    fontSize: 50,
    opacity: 0.5,
  },
  sun: {
    position: 'absolute',
    fontSize: 70,
    top: 20,
    right: 30,
  },
  moon: {
    position: 'absolute',
    fontSize: 60,
    top: 15,
    right: 40,
  },
  star: {
    position: 'absolute',
    fontSize: 35,
  },
  star1: {
    top: 30,
    left: 50,
  },
  star2: {
    top: 80,
    right: 80,
  },
  star3: {
    top: 120,
    left: 30,
  },
  star4: {
    top: 60,
    left: 150,
  },
  star5: {
    top: 140,
    right: 40,
  },
  petContainer: {
    alignItems: 'center',
  },
  lottieAnimation: {
    width: 200,
    height: 200,
  },
  actionFeedback: {
    position: 'absolute',
    top: -20,
  },
  actionEmoji: {
    fontSize: 40,
  },
  petInfo: {
    alignItems: 'center',
    marginTop: SPACING.lg,
  },
  petName: {
    fontSize: FONTS.sizes.xxl,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  petMood: {
    fontSize: FONTS.sizes.md,
    color: COLORS.textSecondary,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.backgroundCard,
    borderRadius: RADIUS.xl,
    padding: SPACING.md,
    marginHorizontal: SPACING.xs,
    ...SHADOWS.small,
  },
  statLabel: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
  },
  statBarContainer: {
    height: 8,
    backgroundColor: COLORS.borderLight,
    borderRadius: RADIUS.full,
    marginBottom: SPACING.xs,
    overflow: 'hidden',
  },
  statBar: {
    height: '100%',
    borderRadius: RADIUS.full,
  },
  happinessBar: {
    backgroundColor: COLORS.moodHappy,
  },
  hungerBar: {
    backgroundColor: COLORS.accentGreen,
  },
  statValue: {
    fontSize: FONTS.sizes.sm,
    fontWeight: '600',
    color: COLORS.textPrimary,
    textAlign: 'right',
  },
  actionsContainer: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  actionButton: {
    flex: 1,
    backgroundColor: COLORS.backgroundCard,
    borderRadius: RADIUS.xl,
    padding: SPACING.md,
    alignItems: 'center',
    marginHorizontal: SPACING.xs,
    ...SHADOWS.small,
  },
  actionButtonDisabled: {
    opacity: 0.5,
  },
  actionButtonEmoji: {
    fontSize: 28,
    marginBottom: SPACING.xs,
  },
  actionButtonLabel: {
    fontSize: FONTS.sizes.sm,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  actionButtonCost: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.textSecondary,
  },
  actionButtonReward: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.success,
    fontWeight: '600',
  },
  tipContainer: {
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.xxxl,
    backgroundColor: COLORS.accentYellow + '30',
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
  },
  tipText: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
  // Premium styles
  premiumBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: COLORS.secondary,
    borderRadius: 10,
    width: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  premiumTag: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.secondary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: 'center',
    alignItems: 'center',
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
  upgradeButton: {
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
