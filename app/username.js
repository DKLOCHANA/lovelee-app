import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from '../src/constants/theme';
import { useUserStore } from '../src/store/store';

export default function UsernameScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const setUser = useUserStore((state) => state.setUser);
  
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const validateUsername = () => {
    if (!username.trim()) {
      setError('Username is required');
      return false;
    }
    
    if (username.trim().length < 3) {
      setError('Username must be at least 3 characters');
      return false;
    }
    
    if (username.trim().length > 20) {
      setError('Username must be less than 20 characters');
      return false;
    }
    
    if (!/^[a-zA-Z0-9_]+$/.test(username.trim())) {
      setError('Username can only contain letters, numbers, and underscores');
      return false;
    }
    
    setError('');
    return true;
  };

  const handleContinue = async () => {
    if (!validateUsername()) return;
    
    setIsLoading(true);
    
    // Simulate API call to check username availability
    setTimeout(() => {
      // Save user data to store
      setUser({
        email: params.email || '',
        username: username.trim(),
        createdAt: new Date().toISOString(),
      });
      
      setIsLoading(false);
      // Navigate to onboarding or home
      router.replace('/onboarding');
    }, 1000);
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
          keyboardShouldPersistTaps="handled"
        >
          {/* Progress Indicator */}
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: '50%' }]} />
            </View>
            <Text style={styles.progressText}>Step 1 of 2</Text>
          </View>

          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.emoji}>👋</Text>
            <Text style={styles.title}>What's your name?</Text>
            <Text style={styles.subtitle}>
              This is how you'll appear to your partner
            </Text>
          </View>

          {/* Username Input */}
          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <View style={[styles.inputWrapper, error && styles.inputError]}>
                <Ionicons name="person-outline" size={22} color={COLORS.textSecondary} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter your username"
                  placeholderTextColor={COLORS.textLight}
                  value={username}
                  onChangeText={(text) => {
                    setUsername(text);
                    if (error) setError('');
                  }}
                  autoCapitalize="none"
                  autoCorrect={false}
                  maxLength={20}
                />
                {username.length > 0 && !error && (
                  <Ionicons name="checkmark-circle" size={22} color={COLORS.success} />
                )}
              </View>
              {error ? (
                <Text style={styles.errorText}>{error}</Text>
              ) : (
                <Text style={styles.hintText}>
                  Letters, numbers, and underscores only
                </Text>
              )}
            </View>

            {/* Character Count */}
            <Text style={styles.charCount}>{username.length}/20</Text>

            {/* Username Preview */}
            {username.trim().length >= 3 && (
              <View style={styles.previewCard}>
                <View style={styles.previewAvatar}>
                  <Ionicons name="person" size={28} color={COLORS.textWhite} />
                </View>
                <View style={styles.previewInfo}>
                  <Text style={styles.previewName}>{username.trim()}</Text>
                  <Text style={styles.previewEmail}>{params.email || 'your@email.com'}</Text>
                </View>
              </View>
            )}
          </View>

          {/* Continue Button */}
          <View style={styles.bottomSection}>
            <TouchableOpacity 
              style={[
                styles.continueButton, 
                (!username.trim() || isLoading) && styles.continueButtonDisabled
              ]}
              onPress={handleContinue}
              disabled={!username.trim() || isLoading}
            >
              {isLoading ? (
                <Text style={styles.continueButtonText}>Setting up...</Text>
              ) : (
                <>
                  <Text style={styles.continueButtonText}>Continue</Text>
                  <Ionicons name="arrow-forward" size={20} color={COLORS.textWhite} />
                </>
              )}
            </TouchableOpacity>

            {/* Skip for now */}
            <TouchableOpacity 
              style={styles.skipButton}
              onPress={() => {
                setUser({
                  email: params.email || '',
                  username: 'User',
                  createdAt: new Date().toISOString(),
                });
                router.replace('/onboarding');
              }}
            >
              <Text style={styles.skipButtonText}>Skip for now</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
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
  progressContainer: {
    marginBottom: SPACING.xxl,
  },
  progressBar: {
    height: 4,
    backgroundColor: COLORS.border,
    borderRadius: 2,
    marginBottom: SPACING.sm,
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 2,
  },
  progressText: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textSecondary,
  },
  header: {
    alignItems: 'center',
    marginBottom: SPACING.xxxl,
  },
  emoji: {
    fontSize: 60,
    marginBottom: SPACING.md,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: FONTS.sizes.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  form: {
    flex: 1,
  },
  inputContainer: {
    marginBottom: SPACING.sm,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.backgroundCard,
    borderRadius: RADIUS.xl,
    borderWidth: 2,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.lg,
    ...SHADOWS.small,
  },
  inputError: {
    borderColor: COLORS.error,
  },
  input: {
    flex: 1,
    fontSize: FONTS.sizes.lg,
    color: COLORS.textPrimary,
    marginLeft: SPACING.sm,
  },
  errorText: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.error,
    marginTop: SPACING.sm,
    marginLeft: SPACING.sm,
  },
  hintText: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textLight,
    marginTop: SPACING.sm,
    marginLeft: SPACING.sm,
  },
  charCount: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textLight,
    textAlign: 'right',
    marginBottom: SPACING.xl,
  },
  previewCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.backgroundCard,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    ...SHADOWS.medium,
  },
  previewAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  previewInfo: {
    flex: 1,
  },
  previewName: {
    fontSize: FONTS.sizes.lg,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  previewEmail: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textSecondary,
  },
  bottomSection: {
    marginTop: 'auto',
    paddingTop: SPACING.xl,
  },
  continueButton: {
    backgroundColor: COLORS.secondary,
    paddingVertical: SPACING.lg,
    borderRadius: RADIUS.full,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    ...SHADOWS.medium,
  },
  continueButtonDisabled: {
    opacity: 0.5,
  },
  continueButtonText: {
    fontSize: FONTS.sizes.lg,
    fontWeight: '700',
    color: COLORS.textWhite,
  },
  skipButton: {
    paddingVertical: SPACING.lg,
    alignItems: 'center',
  },
  skipButtonText: {
    fontSize: FONTS.sizes.md,
    color: COLORS.textSecondary,
  },
});
