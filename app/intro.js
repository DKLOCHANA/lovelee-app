import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
  Image,
  Animated,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import LottieView from 'lottie-react-native';
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from '../src/constants/theme';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Intro slides data with Lottie animations
const INTRO_SLIDES = [
  {
    id: 1,
    animation: require('../assets/animations/default.json'),
    title: 'welcome to lovelee',
    subtitle: 'a shared place for your love',
  },
  {
    id: 2,
    animation: require('../assets/animations/playing.json'),
    title: 'keep the love alive',
    subtitle: 'by sending love letters, playing games, and doing check-ins',
  },
  {
    id: 3,
    animation: require('../assets/animations/bathing.json'),
    title: 'deepen your connection',
    subtitle: 'by answering deep questions and taking care of your pet',
  },
  {
    id: 4,
    animation: require('../assets/animations/sleeping.json'),
    title: 'get a constant reminder',
    subtitle: 'get new love letters right to your homescreen using our widgets + track days together and your partners mood!',
  },
];

// Emotional questions with their analytics responses
const QUESTIONS = [
  {
    id: 1,
    question: 'How would you describe your relationship right now?',
    subtitle: 'This helps us personalize your experience',
    options: [
      { id: 'new', emoji: '🌱', label: 'Just starting out', description: 'We\'re in the early stages of our journey' },
      { id: 'growing', emoji: '🌸', label: 'Growing stronger', description: 'We\'re building something beautiful' },
      { id: 'stable', emoji: '🏠', label: 'Solid and stable', description: 'We have a strong foundation' },
      { id: 'distance', emoji: '🌍', label: 'Long distance', description: 'Miles apart but hearts together' },
    ],
    analytics: {
      title: 'Every love story is unique! 💕',
      subtitle: 'Lovelee adapts to your journey',
      stats: [
        { value: '92%', label: 'of couples feel more connected within the first week' },
      ],
      tip: 'Daily check-ins help couples at every stage feel closer and more understood.',
    },
  },
  {
    id: 2,
    question: 'What matters most in your relationship?',
    subtitle: 'We\'ll focus on what you value',
    options: [
      { id: 'communication', emoji: '💬', label: 'Communication', description: 'Staying connected every day' },
      { id: 'quality', emoji: '⏰', label: 'Quality time', description: 'Making moments count' },
      { id: 'affection', emoji: '💕', label: 'Showing affection', description: 'Expressing love regularly' },
      { id: 'fun', emoji: '🎮', label: 'Having fun together', description: 'Keeping things playful' },
    ],
    analytics: {
      title: 'Connect 3x more with Lovelee',
      subtitle: 'vs trying to remember on your own',
      showComparison: true,
      comparison: {
        cardTitle: 'Your Daily Connection',
        leftLabel: 'Without\nLovelee',
        leftValue: '1x',
        leftHeight: 80,
        rightLabel: 'With\nLovelee',
        rightValue: '3x',
        rightHeight: 200,
        bottomText: 'Lovelee makes staying connected effortless and fun',
      },
      tip: 'Our love notes and mood check-ins help you stay connected in the way that matters most to you.',
    },
  },
  {
    id: 3,
    question: 'How often do you want to connect with your partner?',
    subtitle: 'We\'ll remind you at the right times',
    options: [
      { id: 'always', emoji: '💫', label: 'Throughout the day', description: 'Little moments all day long' },
      { id: 'daily', emoji: '🌅', label: 'Once a day', description: 'A meaningful daily check-in' },
      { id: 'weekly', emoji: '📅', label: 'A few times a week', description: 'Quality over quantity' },
      { id: 'spontaneous', emoji: '🎲', label: 'Spontaneously', description: 'When the mood strikes' },
    ],
    analytics: {
      title: 'Perfect timing matters! ⏰',
      subtitle: 'We\'ll help you build loving habits',
      stats: [
        { value: '89%', label: 'of couples say Lovelee reminds them to show love more often' },
      ],
      tip: 'Whether it\'s a quick doodle or a heartfelt note, we make connecting effortless.',
    },
  },
  {
    id: 4,
    question: 'What would make your relationship even better?',
    subtitle: 'We\'ll help you get there',
    options: [
      { id: 'surprise', emoji: '🎁', label: 'More surprises', description: 'Keep the spark alive' },
      { id: 'understand', emoji: '🤝', label: 'Better understanding', description: 'Know each other deeper' },
      { id: 'memories', emoji: '📸', label: 'Creating memories', description: 'Build your love story' },
      { id: 'support', emoji: '🤗', label: 'More emotional support', description: 'Be there for each other' },
    ],
    analytics: {
      title: 'You\'re ready to grow together! 🌟',
      subtitle: 'Couples like you thrive with Lovelee',
      stats: [
        { value: '94%', label: 'report feeling happier and more loved' },
      ],
      tip: 'With gifts, mood sharing, and your virtual pet, every day becomes an opportunity to show you care.',
    },
  },
];

export default function IntroScreen() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [showingAnalytics, setShowingAnalytics] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  // Total steps: intro slides (4) + (question + analytics) pairs (4*2=8) = 12
  const totalIntroSlides = INTRO_SLIDES.length;
  const totalQuestions = QUESTIONS.length;
  // After intro slides, we alternate: question -> analytics -> question -> analytics...
  const totalSteps = totalIntroSlides + (totalQuestions * 2);

  const animateTransition = (callback) => {
    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();
    setTimeout(callback, 150);
  };

  const handleNext = () => {
    if (currentStep < totalSteps - 1) {
      animateTransition(() => setCurrentStep(currentStep + 1));
    } else {
      router.replace('/welcome');
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      animateTransition(() => setCurrentStep(currentStep - 1));
    }
  };

  const handleSelectOption = (questionId, optionId) => {
    setAnswers({ ...answers, [questionId]: optionId });
    setTimeout(() => handleNext(), 300);
  };

  const renderIntroSlide = (slideIndex) => {
    const slide = INTRO_SLIDES[slideIndex];
    const isLastIntro = slideIndex === totalIntroSlides - 1;

    return (
      <View style={styles.slideContainer}>
        <View style={styles.animationContainer}>
          <LottieView
            source={slide.animation}
            autoPlay
            loop
            style={styles.lottieAnimation}
          />
        </View>

        <Text style={styles.slideTitle}>{slide.title}</Text>
        <Text style={styles.slideSubtitle}>{slide.subtitle}</Text>

        <View style={styles.dotsContainer}>
          {INTRO_SLIDES.map((_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                index === slideIndex && styles.dotActive,
              ]}
            />
          ))}
        </View>

        <View style={styles.bottomContainer}>
          <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
            <Text style={styles.nextButtonText}>
              {isLastIntro ? 'Get Started' : 'Next'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderQuestion = (questionIndex) => {
    const question = QUESTIONS[questionIndex];
    const progress = (questionIndex + 1) / totalQuestions;

    return (
      <View style={styles.questionContainer}>
        {/* Header with back button and progress */}
        <View style={styles.questionHeader}>
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
          </TouchableOpacity>
          <View style={styles.progressBarContainer}>
            <View style={[styles.progressBar, { width: `${progress * 100}%` }]} />
          </View>
        </View>

        <Text style={styles.questionTitle}>{question.question}</Text>
        <Text style={styles.questionSubtitle}>{question.subtitle}</Text>

        <ScrollView 
          style={styles.optionsScrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.optionsContainer}
        >
          {question.options.map((option) => (
            <TouchableOpacity
              key={option.id}
              style={[
                styles.optionCard,
                answers[question.id] === option.id && styles.optionCardSelected,
              ]}
              onPress={() => handleSelectOption(question.id, option.id)}
            >
              <Text style={styles.optionEmoji}>{option.emoji}</Text>
              <View style={styles.optionTextContainer}>
                <Text style={[
                  styles.optionLabel,
                  answers[question.id] === option.id && styles.optionLabelSelected,
                ]}>
                  {option.label}
                </Text>
                <Text style={styles.optionDescription}>{option.description}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  };

  const renderQuestionAnalytics = (questionIndex) => {
    const question = QUESTIONS[questionIndex];
    const analytics = question.analytics;
    const progress = (questionIndex + 1) / totalQuestions;
    const isLastQuestion = questionIndex === totalQuestions - 1;

    return (
      <View style={styles.analyticsContainer}>
        {/* Header with back button and progress */}
        <View style={styles.questionHeader}>
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
          </TouchableOpacity>
          <View style={styles.progressBarContainer}>
            <View style={[styles.progressBar, { width: `${progress * 100}%` }]} />
          </View>
        </View>

        <View style={styles.analyticsContent}>
          <Text style={styles.analyticsTitle}>{analytics.title}</Text>
          <Text style={styles.analyticsSubtitle}>{analytics.subtitle}</Text>

          {/* Comparison Chart */}
          {analytics.showComparison && analytics.comparison && (
            <View style={styles.comparisonCard}>
              <Text style={styles.comparisonCardTitle}>{analytics.comparison.cardTitle}</Text>
              
              <View style={styles.comparisonBarsContainer}>
                {/* Left Bar - Without App */}
                <View style={styles.comparisonBarWrapper}>
                  <Text style={styles.comparisonBarLabel}>{analytics.comparison.leftLabel}</Text>
                  <View style={styles.comparisonBarOuter}>
                    <View style={[styles.comparisonBarLeft, { height: analytics.comparison.leftHeight }]}>
                      <Text style={styles.comparisonBarValueLeft}>{analytics.comparison.leftValue}</Text>
                    </View>
                  </View>
                </View>

                {/* Right Bar - With App */}
                <View style={styles.comparisonBarWrapper}>
                  <Text style={[styles.comparisonBarLabel, styles.comparisonBarLabelHighlight]}>
                    With{'\n'}<Text style={styles.lovelee}>Lovelee</Text>
                  </Text>
                  <View style={styles.comparisonBarOuter}>
                    <View style={[styles.comparisonBarRight, { height: analytics.comparison.rightHeight }]}>
                      <Text style={styles.comparisonBarValueRight}>{analytics.comparison.rightValue}</Text>
                    </View>
                  </View>
                </View>
              </View>

              <Text style={styles.comparisonBottomText}>{analytics.comparison.bottomText}</Text>
            </View>
          )}

          {/* Regular Stats */}
          {analytics.stats && !analytics.showComparison && (
            <View style={styles.statsCard}>
              {analytics.stats.map((stat, index) => (
                <View key={index} style={styles.statItem}>
                  <Text style={styles.statValue}>{stat.value}</Text>
                  <Text style={styles.statLabel}>{stat.label}</Text>
                </View>
              ))}
              
              <View style={styles.tipContainer}>
                <Text style={styles.tipLabel}>💡 How we help:</Text>
                <Text style={styles.tipText}>{analytics.tip}</Text>
              </View>
            </View>
          )}

          {/* Stats with tip for non-comparison */}
          {analytics.stats && analytics.showComparison && (
            <View style={styles.tipContainerStandalone}>
              <Text style={styles.tipLabel}>💡 How we help:</Text>
              <Text style={styles.tipText}>{analytics.tip}</Text>
            </View>
          )}
        </View>

        <View style={styles.bottomContainer}>
          <TouchableOpacity style={styles.continueButton} onPress={handleNext}>
            <Text style={styles.continueButtonText}>
              {isLastQuestion ? 'Start Your Journey' : 'Continue'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderCurrentStep = () => {
    if (currentStep < totalIntroSlides) {
      // Intro slides (0-3)
      return renderIntroSlide(currentStep);
    } else {
      // After intro, alternate between question and analytics
      const stepAfterIntro = currentStep - totalIntroSlides;
      const questionIndex = Math.floor(stepAfterIntro / 2);
      const isAnalyticsStep = stepAfterIntro % 2 === 1;
      
      if (isAnalyticsStep) {
        return renderQuestionAnalytics(questionIndex);
      } else {
        return renderQuestion(questionIndex);
      }
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        {renderCurrentStep()}
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    flex: 1,
  },

  // Intro Slides
  slideContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.xl,
  },
  animationContainer: {
    width: SCREEN_WIDTH * 0.7,
    height: SCREEN_WIDTH * 0.7,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.xxl,
  },
  lottieAnimation: {
    width: '100%',
    height: '100%',
  },
  slideTitle: {
    fontSize: FONTS.sizes.xxl,
    fontWeight: '700',
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginBottom: SPACING.md,
  },
  slideSubtitle: {
    fontSize: FONTS.sizes.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: SPACING.xl,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: SPACING.xxl * 2,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.borderLight,
    marginHorizontal: 4,
  },
  dotActive: {
    backgroundColor: COLORS.secondary,
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  bottomContainer: {
    position: 'absolute',
    bottom: SPACING.xxl,
    left: SPACING.xl,
    right: SPACING.xl,
  },
  nextButton: {
    backgroundColor: COLORS.secondary,
    paddingVertical: SPACING.lg,
    borderRadius: RADIUS.lg,
    alignItems: 'center',
    ...SHADOWS.medium,
  },
  nextButtonText: {
    color: COLORS.textWhite,
    fontSize: FONTS.sizes.lg,
    fontWeight: '600',
  },

  // Questions
  questionContainer: {
    flex: 1,
    paddingHorizontal: SPACING.xl,
  },
  questionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.md,
    marginBottom: SPACING.xl,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.backgroundCard,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
    ...SHADOWS.small,
  },
  progressBarContainer: {
    flex: 1,
    height: 6,
    backgroundColor: COLORS.borderLight,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: COLORS.secondary,
    borderRadius: 3,
  },
  questionTitle: {
    fontSize: FONTS.sizes.xxl,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  questionSubtitle: {
    fontSize: FONTS.sizes.md,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xl,
  },
  optionsScrollView: {
    flex: 1,
  },
  optionsContainer: {
    paddingBottom: SPACING.xxl,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.backgroundCard,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    borderWidth: 2,
    borderColor: 'transparent',
    ...SHADOWS.small,
  },
  optionCardSelected: {
    borderColor: COLORS.secondary,
    backgroundColor: COLORS.primaryLight,
  },
  optionEmoji: {
    fontSize: 32,
    marginRight: SPACING.lg,
  },
  optionTextContainer: {
    flex: 1,
  },
  optionLabel: {
    fontSize: FONTS.sizes.lg,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  optionLabelSelected: {
    color: COLORS.secondary,
  },
  optionDescription: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textSecondary,
  },

  // Analytics
  analyticsContainer: {
    flex: 1,
    paddingHorizontal: SPACING.xl,
  },
  analyticsContent: {
    flex: 1,
    justifyContent: 'center',
  },
  analyticsTitle: {
    fontSize: FONTS.sizes.xxl,
    fontWeight: '700',
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  analyticsSubtitle: {
    fontSize: FONTS.sizes.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.xxl,
  },
  statsCard: {
    backgroundColor: COLORS.backgroundCard,
    borderRadius: RADIUS.xxl,
    padding: SPACING.xl,
    ...SHADOWS.medium,
  },
  statItem: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  statValue: {
    fontSize: 48,
    fontWeight: '700',
    color: COLORS.secondary,
  },
  statLabel: {
    fontSize: FONTS.sizes.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: SPACING.sm,
  },
  featuresCard: {
    backgroundColor: COLORS.backgroundCard,
    borderRadius: RADIUS.xxl,
    padding: SPACING.xl,
    ...SHADOWS.medium,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  featureEmoji: {
    fontSize: 28,
    marginRight: SPACING.lg,
  },
  featureLabel: {
    flex: 1,
    fontSize: FONTS.sizes.md,
    color: COLORS.textPrimary,
    fontWeight: '500',
  },
  tipContainer: {
    marginTop: SPACING.md,
    paddingTop: SPACING.lg,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  tipContainerStandalone: {
    marginTop: SPACING.lg,
    padding: SPACING.lg,
    backgroundColor: COLORS.backgroundCard,
    borderRadius: RADIUS.xl,
    ...SHADOWS.small,
  },
  tipLabel: {
    fontSize: FONTS.sizes.md,
    fontWeight: '600',
    color: COLORS.secondary,
    marginBottom: SPACING.sm,
  },
  tipText: {
    fontSize: FONTS.sizes.md,
    color: COLORS.textSecondary,
    lineHeight: 22,
  },

  // Comparison Chart
  comparisonCard: {
    backgroundColor: COLORS.backgroundCard,
    borderRadius: RADIUS.xxl,
    padding: SPACING.xl,
    ...SHADOWS.medium,
  },
  comparisonCardTitle: {
    fontSize: FONTS.sizes.lg,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: SPACING.xl,
  },
  comparisonBarsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-end',
    marginBottom: SPACING.xl,
    height: 220,
  },
  comparisonBarWrapper: {
    alignItems: 'center',
    marginHorizontal: SPACING.xl,
  },
  comparisonBarLabel: {
    fontSize: FONTS.sizes.sm,
    fontWeight: '600',
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.md,
    lineHeight: 18,
  },
  comparisonBarLabelHighlight: {
    color: COLORS.textPrimary,
  },
  lovelee: {
    color: COLORS.secondary,
    fontWeight: '700',
  },
  comparisonBarOuter: {
    width: 100,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  comparisonBarLeft: {
    width: 90,
    backgroundColor: COLORS.borderLight,
    borderRadius: RADIUS.lg,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: SPACING.md,
  },
  comparisonBarRight: {
    width: 90,
    backgroundColor: COLORS.secondary,
    borderRadius: RADIUS.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  comparisonBarValueLeft: {
    fontSize: FONTS.sizes.lg,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  comparisonBarValueRight: {
    fontSize: FONTS.sizes.xxl,
    fontWeight: '700',
    color: COLORS.textWhite,
  },
  comparisonBottomText: {
    fontSize: FONTS.sizes.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },

  continueButton: {
    backgroundColor: COLORS.secondary,
    paddingVertical: SPACING.lg,
    borderRadius: RADIUS.lg,
    alignItems: 'center',
    ...SHADOWS.medium,
  },
  continueButtonText: {
    color: COLORS.textWhite,
    fontSize: FONTS.sizes.lg,
    fontWeight: '600',
  },
});
