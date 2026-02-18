import { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Animated,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from '../src/constants/theme';
import { auth } from '../src/firebase/config';
import { getUserProfile, updateUserProfile } from '../src/firebase/services/userService';
import { connectWithPartner } from '../src/firebase/services/coupleService';

export default function OnboardingScreen() {
  const router = useRouter();
  
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [partnerCode, setPartnerCode] = useState('');
  const [myCode, setMyCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [profile, setProfile] = useState(null);

  // Load user profile on mount
  useEffect(() => {
    const loadProfile = async () => {
      if (auth.currentUser) {
        const userProfile = await getUserProfile(auth.currentUser.uid);
        if (userProfile) {
          setProfile(userProfile);
          setMyCode(userProfile.inviteCode || '');
          if (userProfile.displayName && userProfile.displayName !== 'User') {
            setName(userProfile.displayName);
          }
        }
      }
    };
    loadProfile();
  }, []);

  const handleNext = async () => {
    if (step === 1 && name.trim()) {
      setIsLoading(true);
      try {
        // Update user profile in Firebase
        if (auth.currentUser) {
          await updateUserProfile(auth.currentUser.uid, {
            displayName: name.trim(),
          });
        }
        setStep(2);
      } catch (error) {
        Alert.alert('Error', 'Failed to update profile. Please try again.');
      } finally {
        setIsLoading(false);
      }
    } else if (step === 2) {
      setStep(3);
    }
  };

  const handleConnect = async () => {
    if (partnerCode.trim().length < 6) return;
    
    setIsLoading(true);
    try {
      if (auth.currentUser) {
        const { success, error } = await connectWithPartner(
          auth.currentUser.uid, 
          partnerCode.trim()
        );
        
        if (error) {
          Alert.alert('Connection Failed', error);
        } else if (success) {
          router.replace('/(tabs)/home');
        }
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to connect. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkip = () => {
    // Skip partner connection
    router.replace('/(tabs)/home');
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.heartEmoji}>💕</Text>
            <Text style={styles.title}>pairly</Text>
          </View>

          {/* Step 1: Enter Name */}
          {step === 1 && (
            <View style={styles.stepContainer}>
              <Text style={styles.stepTitle}>What's your name?</Text>
              <Text style={styles.stepSubtitle}>
                Let your partner know who's sending all that love!
              </Text>
              
              <TextInput
                style={styles.input}
                placeholder="Enter your name"
                placeholderTextColor={COLORS.textLight}
                value={name}
                onChangeText={setName}
                autoFocus
              />
              
              <TouchableOpacity 
                style={[styles.button, !name.trim() && styles.buttonDisabled]}
                onPress={handleNext}
                disabled={!name.trim()}
              >
                <Text style={styles.buttonText}>Continue</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Step 2: Show Your Code */}
          {step === 2 && (
            <View style={styles.stepContainer}>
              <Text style={styles.stepTitle}>Your invite code</Text>
              <Text style={styles.stepSubtitle}>
                Share this code with your partner to connect your hearts!
              </Text>
              
              <View style={styles.codeContainer}>
                <Text style={styles.codeText}>{myCode}</Text>
              </View>
              
              <Text style={styles.orText}>— or —</Text>
              
              <TouchableOpacity 
                style={styles.button}
                onPress={handleNext}
              >
                <Text style={styles.buttonText}>I have a partner's code</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.skipButton}
                onPress={handleSkip}
              >
                <Text style={styles.skipText}>Skip for now</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Step 3: Enter Partner Code */}
          {step === 3 && (
            <View style={styles.stepContainer}>
              <Text style={styles.stepTitle}>Enter partner's code</Text>
              <Text style={styles.stepSubtitle}>
                Enter the code your partner shared with you
              </Text>
              
              <TextInput
                style={styles.input}
                placeholder="Enter 6-digit code"
                placeholderTextColor={COLORS.textLight}
                value={partnerCode}
                onChangeText={setPartnerCode}
                autoCapitalize="characters"
                maxLength={6}
                autoFocus
              />
              
              <TouchableOpacity 
                style={[styles.button, partnerCode.length < 6 && styles.buttonDisabled]}
                onPress={handleConnect}
                disabled={partnerCode.length < 6}
              >
                <Text style={styles.buttonText}>Connect 💕</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.skipButton}
                onPress={() => setStep(2)}
              >
                <Text style={styles.skipText}>Go back</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Features Preview */}
          <View style={styles.featuresContainer}>
            <FeatureItem emoji="💌" text="Send love notes" />
            <FeatureItem emoji="😊" text="Share your mood" />
            <FeatureItem emoji="🐷" text="Care for your pet" />
            <FeatureItem emoji="🎁" text="Send gifts" />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function FeatureItem({ emoji, text }) {
  return (
    <View style={styles.featureItem}>
      <Text style={styles.featureEmoji}>{emoji}</Text>
      <Text style={styles.featureText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: SPACING.xl,
  },
  header: {
    alignItems: 'center',
    marginTop: SPACING.xxl,
    marginBottom: SPACING.xxxl,
  },
  heartEmoji: {
    fontSize: 60,
    marginBottom: SPACING.md,
  },
  title: {
    fontSize: 36,
    fontWeight: '700',
    color: COLORS.primary,
    letterSpacing: 1,
  },
  stepContainer: {
    alignItems: 'center',
  },
  stepTitle: {
    fontSize: FONTS.sizes.xxl,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  stepSubtitle: {
    fontSize: FONTS.sizes.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.xxl,
    paddingHorizontal: SPACING.lg,
  },
  input: {
    width: '100%',
    backgroundColor: COLORS.backgroundCard,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    fontSize: FONTS.sizes.lg,
    color: COLORS.textPrimary,
    borderWidth: 2,
    borderColor: COLORS.border,
    marginBottom: SPACING.xl,
    textAlign: 'center',
    ...SHADOWS.small,
  },
  codeContainer: {
    backgroundColor: COLORS.primaryLight,
    paddingVertical: SPACING.xl,
    paddingHorizontal: SPACING.xxxl,
    borderRadius: RADIUS.xl,
    marginBottom: SPACING.xl,
    ...SHADOWS.medium,
  },
  codeText: {
    fontSize: 32,
    fontWeight: '700',
    color: COLORS.primaryDark,
    letterSpacing: 8,
  },
  orText: {
    fontSize: FONTS.sizes.md,
    color: COLORS.textLight,
    marginBottom: SPACING.xl,
  },
  button: {
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.xxxl,
    borderRadius: RADIUS.full,
    width: '100%',
    alignItems: 'center',
    ...SHADOWS.medium,
  },
  buttonDisabled: {
    backgroundColor: COLORS.border,
  },
  buttonText: {
    fontSize: FONTS.sizes.lg,
    fontWeight: '600',
    color: COLORS.textWhite,
  },
  skipButton: {
    marginTop: SPACING.lg,
    padding: SPACING.md,
  },
  skipText: {
    fontSize: FONTS.sizes.md,
    color: COLORS.textSecondary,
  },
  featuresContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginTop: 'auto',
    paddingTop: SPACING.xxxl,
  },
  featureItem: {
    alignItems: 'center',
    width: '45%',
    marginBottom: SPACING.lg,
  },
  featureEmoji: {
    fontSize: 32,
    marginBottom: SPACING.xs,
  },
  featureText: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textSecondary,
  },
});
