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
import { useUserStore } from '../../src/store/store';
import Header from '../../src/components/Header';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Animation sources (using pig animations for now - will be replaced with plant animations)
const ANIMATIONS = {
  default: require('../../assets/animations/plant-default.json'),
  watering: require('../../assets/animations/watering.json'),
  fertilizing: require('../../assets/animations/fertilizing.json'),
  growing: require('../../assets/animations/growing.json'),
  pruning: require('../../assets/animations/pruning.json'),
};

export default function PlantScreen() {
  const router = useRouter();
  const hearts = useUserStore((state) => state.hearts);
  const addHearts = useUserStore((state) => state.addHearts);
  const spendHearts = useUserStore((state) => state.spendHearts);
  const isPremium = useUserStore((state) => state.isPremium);

  const [plantName, setPlantName] = useState('Rosie');
  const [plantHealth, setPlantHealth] = useState(75);
  const [plantGrowth, setPlantGrowth] = useState(60);
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
  const butterflyAnim = useRef(new Animated.Value(0)).current;
  const starTwinkle1 = useRef(new Animated.Value(1)).current;
  const starTwinkle2 = useRef(new Animated.Value(1)).current;
  const starTwinkle3 = useRef(new Animated.Value(1)).current;

  // Check time for day/night
  useEffect(() => {
    const checkTime = () => {
      const hour = new Date().getHours();
      setIsNight(hour >= 18 || hour < 6);
    };
    checkTime();
    const interval = setInterval(checkTime, 60000);
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

  // Butterfly animation
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(butterflyAnim, {
          toValue: 20,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(butterflyAnim, {
          toValue: 0,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();
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
    if (lottieRef.current) {
      lottieRef.current.play();
    }
  }, [currentAnimation]);

  const playActionAnimation = (animationKey) => {
    if (isActionPlaying) return;
    
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
        if (lottieRef.current) {
          lottieRef.current.reset();
          lottieRef.current.play();
        }
      } else {
        setCurrentAnimation('default');
        setLoopCount(0);
        setIsActionPlaying(false);
      }
    }
  };

  const handleTapPlant = () => {
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
    
    if (lottieRef.current) {
      lottieRef.current.reset();
      lottieRef.current.play();
    }
  };

  const handleWater = () => {
    if (hearts >= 5) {
      spendHearts(5);
      setPlantHealth(Math.min(100, plantHealth + 10));
      setAction('water');
      showActionFeedback();
      playActionAnimation('watering');
    }
  };

  const handleSunlight = () => {
    setPlantGrowth(Math.min(100, plantGrowth + 5));
    addHearts(3);
    setAction('sunlight');
    showActionFeedback();
    playActionAnimation('growing');
  };

  const handleFertilize = () => {
    if (!isPremium) {
      setShowPremiumModal(true);
      return;
    }
    if (hearts >= 10) {
      spendHearts(10);
      setPlantHealth(Math.min(100, plantHealth + 15));
      setPlantGrowth(Math.min(100, plantGrowth + 10));
      setAction('fertilize');
      showActionFeedback();
      playActionAnimation('fertilizing');
    }
  };

  const handlePrune = () => {
    if (!isPremium) {
      setShowPremiumModal(true);
      return;
    }
    setPlantHealth(Math.min(100, plantHealth + 5));
    setAction('prune');
    showActionFeedback();
    playActionAnimation('growing');
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

  const getPlantMood = () => {
    if (plantHealth >= 80) return { emoji: '🌸', text: 'Blooming!' };
    if (plantHealth >= 60) return { emoji: '🌿', text: 'Healthy' };
    if (plantHealth >= 40) return { emoji: '🌱', text: 'Growing' };
    if (plantHealth >= 20) return { emoji: '🥀', text: 'Wilting' };
    return { emoji: '🍂', text: 'Needs Care' };
  };

  const plantMood = getPlantMood();

  return (
    <SafeAreaView style={styles.container}>
      <Header title="Love Plant" subtitle={`Grow ${plantName} together!`} />

      {/* Plant Area */}
      <View style={styles.plantArea}>
        {/* Background decorations */}
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
          
          {/* Butterflies (day) or fireflies (night) */}
          {isNight ? (
            <>
              <Text style={styles.moon}>🌙</Text>
              <Animated.Text 
                style={[styles.star, styles.star1, { opacity: starTwinkle1 }]}
              >
                ✨
              </Animated.Text>
              <Animated.Text 
                style={[styles.star, styles.star2, { opacity: starTwinkle2 }]}
              >
                ⭐
              </Animated.Text>
              <Animated.Text 
                style={[styles.star, styles.star3, { opacity: starTwinkle3 }]}
              >
                ✨
              </Animated.Text>
              <Animated.Text 
                style={[styles.firefly, styles.firefly1, { opacity: starTwinkle1 }]}
              >
                ✨
              </Animated.Text>
              <Animated.Text 
                style={[styles.firefly, styles.firefly2, { opacity: starTwinkle2 }]}
              >
                ✨
              </Animated.Text>
            </>
          ) : (
            <>
              <Text style={styles.sun}>☀️</Text>
              <Animated.Text 
                style={[
                  styles.butterfly,
                  styles.butterfly1,
                  { transform: [{ translateY: butterflyAnim }] }
                ]}
              >
                🦋
              </Animated.Text>
              <Animated.Text 
                style={[
                  styles.butterfly,
                  styles.butterfly2,
                  { transform: [{ translateY: Animated.multiply(butterflyAnim, -1) }] }
                ]}
              >
                🐝
              </Animated.Text>
            </>
          )}
        </View>

        {/* Plant */}
        <TouchableOpacity 
          onPress={handleTapPlant}
          activeOpacity={0.9}
        >
          <Animated.View 
            style={[
              styles.plantContainer,
              { transform: [{ scale: scaleAnim }] },
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
                  {action === 'water' ? '💧' : action === 'fertilize' ? '🌟' : '💕'}
                </Text>
              </Animated.View>
            )}
          </Animated.View>
        </TouchableOpacity>

        {/* Plant name and mood */}
        <View style={styles.plantInfo}>
          <Text style={styles.plantName}>{plantName}</Text>
          <Text style={styles.plantMood}>
            {plantMood.emoji} {plantMood.text}
          </Text>
        </View>
      </View>

      {/* Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Health</Text>
          <View style={styles.statBarContainer}>
            <View style={[styles.statBar, styles.healthBar, { width: `${plantHealth}%` }]} />
          </View>
          <Text style={styles.statValue}>{plantHealth}%</Text>
        </View>
        
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Growth</Text>
          <View style={styles.statBarContainer}>
            <View style={[styles.statBar, styles.growthBar, { width: `${plantGrowth}%` }]} />
          </View>
          <Text style={styles.statValue}>{plantGrowth}%</Text>
        </View>
      </View>

      {/* Actions */}
      <View style={styles.actionsContainer}>
        <TouchableOpacity 
          style={[styles.actionButton, hearts < 5 && styles.actionButtonDisabled]}
          onPress={handleWater}
          disabled={hearts < 5}
        >
          <Text style={styles.actionButtonEmoji}>💧</Text>
          <Text style={styles.actionButtonLabel}>Water</Text>
          <Text style={styles.actionButtonCost}>💖 5</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.actionButton}
          onPress={handleSunlight}
        >
          <Text style={styles.actionButtonEmoji}>☀️</Text>
          <Text style={styles.actionButtonLabel}>Sunlight</Text>
          <Text style={styles.actionButtonReward}>+💖 3</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.actionButton, !isPremium && hearts < 10 && styles.actionButtonDisabled]}
          onPress={handleFertilize}
          disabled={!isPremium && hearts < 10}
        >
          {!isPremium && (
            <View style={styles.premiumBadge}>
              <Ionicons name="lock-closed" size={10} color={COLORS.textWhite} />
            </View>
          )}
          <Text style={styles.actionButtonEmoji}>🌟</Text>
          <Text style={styles.actionButtonLabel}>Fertilize</Text>
          {isPremium ? (
            <Text style={styles.actionButtonCost}>💖 10</Text>
          ) : (
            <Text style={styles.premiumTag}>PRO</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.actionButton}
          onPress={handlePrune}
        >
          {!isPremium && (
            <View style={styles.premiumBadge}>
              <Ionicons name="lock-closed" size={10} color={COLORS.textWhite} />
            </View>
          )}
          <Text style={styles.actionButtonEmoji}>✂️</Text>
          <Text style={styles.actionButtonLabel}>Prune</Text>
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
          💡 Tip: Water {plantName} together with your partner to make it bloom faster!
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
              Upgrade to Pro to unlock Fertilize and Prune actions for your plant!
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
  plantArea: {
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
  butterfly: {
    position: 'absolute',
    fontSize: 30,
  },
  butterfly1: {
    top: 100,
    left: 40,
  },
  butterfly2: {
    top: 150,
    right: 50,
  },
  firefly: {
    position: 'absolute',
    fontSize: 20,
  },
  firefly1: {
    top: 180,
    left: 60,
  },
  firefly2: {
    top: 200,
    right: 70,
  },
  plantContainer: {
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
  plantInfo: {
    alignItems: 'center',
    marginTop: SPACING.lg,
  },
  plantName: {
    fontSize: FONTS.sizes.xxl,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs,
  },
  plantMood: {
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
  healthBar: {
    backgroundColor: COLORS.accentGreen,
  },
  growthBar: {
    backgroundColor: COLORS.accentPurple,
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
    backgroundColor: COLORS.accentGreen + '30',
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
  },
  tipText: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
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
