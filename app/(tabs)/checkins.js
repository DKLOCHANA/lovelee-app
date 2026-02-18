import { useState, useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView,
  TouchableOpacity,
  Animated,
  Modal,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from '../../src/constants/theme';
import { getCheckInQuestions, categoryInfo } from '../../src/data/questions';

const CHECK_IN_TYPES = [
  {
    id: 'daily',
    title: 'Daily Check-In',
    subtitle: 'Quick connection',
    duration: '5 min',
    icon: '💬',
    iconColor: COLORS.accentPurple,
    questionCount: 5, // 1 from each category
  },
  {
    id: 'weekly',
    title: 'Weekly Check-In',
    subtitle: 'Deeper dive',
    duration: '10 min',
    icon: '💗',
    iconColor: COLORS.heart,
    questionCount: 10, // 2 from each category
  },
  {
    id: 'monthly',
    title: 'Monthly Check-In',
    subtitle: 'Deep reflection',
    duration: '20 min',
    icon: '⭐',
    iconColor: COLORS.moodHappy,
    questionCount: 15, // 3 from each category
  },
];

// Helper function to calculate time difference
const getTimeDifference = (timestamp) => {
  if (!timestamp) return 'Never';
  
  const now = new Date();
  const completed = new Date(timestamp);
  const diffMs = now - completed;
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffDays / 30);
  
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffWeeks === 1) return '1 week ago';
  if (diffWeeks < 4) return `${diffWeeks} weeks ago`;
  if (diffMonths === 1) return '1 month ago';
  return `${diffMonths} months ago`;
};

// Check if completed today (for showing green tick)
const isCompletedToday = (timestamp) => {
  if (!timestamp) return false;
  const now = new Date();
  const completed = new Date(timestamp);
  return now.toDateString() === completed.toDateString();
};

const HOW_IT_WORKS_STEPS = [
  { step: 1, text: "Discuss this question with your partner." },
  { step: 2, text: "Listen actively when your partner shares their answers." },
  { step: 3, text: "Reflect on your partner's perspective without judgment." },
  { step: 4, text: "Use insights to strengthen your relationship." },
  { step: 5, text: "Celebrate small wins and plan actions together." }
];

// Check-In Card Component
function CheckInCard({ checkIn, onPress, index, completionData }) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const translateY = useRef(new Animated.Value(30)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  
  const lastCompleted = completionData?.[checkIn.id];
  const completedToday = isCompletedToday(lastCompleted);
  const timeDiff = getTimeDifference(lastCompleted);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        delay: index * 100,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 400,
        delay: index * 100,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.97,
      friction: 5,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 5,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Animated.View
      style={{
        transform: [{ scale: scaleAnim }, { translateY }],
        opacity: fadeAnim,
      }}
    >
      <TouchableOpacity
        style={[styles.checkInCard, completedToday && styles.checkInCardCompleted]}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
      >
        <View style={[styles.iconContainer, { backgroundColor: `${checkIn.iconColor}20` }]}>
          <Text style={styles.iconEmoji}>{checkIn.icon}</Text>
        </View>
        <View style={styles.cardContent}>
          <View style={styles.cardTitleRow}>
            <Text style={styles.cardTitle}>{checkIn.title}</Text>
            {completedToday && (
              <View style={styles.completedBadge}>
                <Ionicons name="checkmark-circle" size={20} color="#22C55E" />
              </View>
            )}
          </View>
          <Text style={styles.cardSubtitle}>
            {checkIn.subtitle} ({checkIn.duration})
          </Text>
          <View style={styles.lastCompletedRow}>
            <Ionicons 
              name={completedToday ? "checkmark-circle" : "time-outline"} 
              size={12} 
              color={completedToday ? "#22C55E" : COLORS.textLight} 
            />
            <Text style={[styles.lastCompletedText, completedToday && styles.completedText]}>
              Last: {timeDiff}
            </Text>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={22} color={COLORS.textLight} />
      </TouchableOpacity>
    </Animated.View>
  );
}

const STORAGE_KEY = '@pairly_checkin_completions';

export default function CheckInsScreen() {
  const router = useRouter();
  const [activeCheckIn, setActiveCheckIn] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [showCheckInModal, setShowCheckInModal] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [completionData, setCompletionData] = useState({});

  // Load completion data from storage
  useEffect(() => {
    const loadCompletionData = async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored) {
          setCompletionData(JSON.parse(stored));
        }
      } catch (error) {
        console.log('Error loading completion data:', error);
      }
    };
    loadCompletionData();
  }, []);

  // Save completion data to storage
  const saveCompletion = async (checkInId) => {
    try {
      const newData = {
        ...completionData,
        [checkInId]: new Date().toISOString(),
      };
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newData));
      setCompletionData(newData);
    } catch (error) {
      console.log('Error saving completion data:', error);
    }
  };

  const handleStartCheckIn = (checkIn) => {
    // Generate random questions for this check-in type
    const generatedQuestions = getCheckInQuestions(checkIn.id);
    setQuestions(generatedQuestions);
    setActiveCheckIn(checkIn);
    setCurrentQuestionIndex(0);
    setShowCheckInModal(true);
  };

  const handleNextQuestion = async () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      // Completed all questions - save completion
      await saveCompletion(activeCheckIn.id);
      setShowCheckInModal(false);
      setActiveCheckIn(null);
      setCurrentQuestionIndex(0);
      setQuestions([]);
    }
  };

  const handleCloseCheckIn = () => {
    setShowCheckInModal(false);
    setActiveCheckIn(null);
    setCurrentQuestionIndex(0);
    setQuestions([]);
  };

  const currentQuestion = questions[currentQuestionIndex];
  const currentCategoryInfo = currentQuestion ? categoryInfo[currentQuestion.category] : null;

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.closeButton}
            onPress={() => router.back()}
          >
            <Ionicons name="chevron-back" size={28} color={COLORS.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Check-Ins</Text>
          <View style={{ width: 28 }} />
        </View>

        {/* Content */}
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Hero Section */}
          <View style={styles.heroSection}>
            <View style={styles.heroIconContainer}>
              <Text style={styles.heroIcon}>💗</Text>
              <Text style={styles.heroIconLines}>≡</Text>
            </View>
          
            <Text style={styles.heroSubtitle}>
              Strengthen your relationship with{'\n'}regular conversations
            </Text>
          </View>

          {/* Check-In Cards */}
          <View style={styles.cardsSection}>
            {CHECK_IN_TYPES.map((checkIn, index) => (
              <CheckInCard
                key={checkIn.id}
                checkIn={checkIn}
                index={index}
                completionData={completionData}
                onPress={() => handleStartCheckIn(checkIn)}
              />
            ))}
          </View>
        </ScrollView>
      </SafeAreaView>

      {/* Check-In Modal */}
      <Modal
        visible={showCheckInModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={handleCloseCheckIn}>
              <Ionicons name="close" size={28} color={COLORS.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>
              {activeCheckIn?.title}
            </Text>
            <View style={{ width: 28 }} />
          </View>

          <View style={styles.modalContent}>
            {/* Progress */}
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View 
                  style={[
                    styles.progressFill, 
                    { 
                      width: `${((currentQuestionIndex + 1) / (questions.length || 1)) * 100}%` 
                    }
                  ]} 
                />
              </View>
              <Text style={styles.progressText}>
                {currentQuestionIndex + 1} of {questions.length}
              </Text>
            </View>

            {/* Category Badge */}
            {currentCategoryInfo && (
              <View style={[styles.categoryBadge, { backgroundColor: currentCategoryInfo.color + '30' }]}>
                <Text style={styles.categoryEmoji}>{currentCategoryInfo.emoji}</Text>
                <Text style={[styles.categoryName, { color: currentCategoryInfo.color }]}>
                  {currentCategoryInfo.name}
                </Text>
              </View>
            )}

            {/* Question */}
            <View style={styles.questionContainer}>
              <Text style={styles.questionNumber}>Question {currentQuestionIndex + 1}</Text>
              <Text style={styles.questionText}>
                {currentQuestion?.question}
              </Text>
            </View>

        

            {/* How it works - always visible */}
            <View style={styles.howItWorksContent}>
              <Text style={styles.howItWorksTitle}>💡 How it works</Text>
              {HOW_IT_WORKS_STEPS.map((step) => (
                <View key={step.step} style={styles.stepRow}>
                  <View style={styles.stepNumber}>
                    <Text style={styles.stepNumberText}>{step.step}</Text>
                  </View>
                  <Text style={styles.stepText}>{step.text}</Text>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.modalFooter}>
            <TouchableOpacity 
              style={styles.nextButton}
              onPress={handleNextQuestion}
            >
              <Text style={styles.nextButtonText}>
                {currentQuestionIndex === questions.length - 1 
                  ? 'Complete Check-In' 
                  : 'Next Question'}
              </Text>
              <Ionicons 
                name={currentQuestionIndex === questions.length - 1 
                  ? "checkmark" 
                  : "arrow-forward"} 
                size={20} 
                color={COLORS.textWhite} 
              />
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
  },
  closeButton: {
    padding: SPACING.xs,
  },
  headerTitle: {
    fontSize: FONTS.sizes.xxxl,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIconButton: {
    padding: SPACING.sm,
    marginLeft: SPACING.xs,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  heroSection: {
    alignItems: 'center',
    paddingVertical: SPACING.xxl,
    paddingHorizontal: SPACING.xl,
  },
  heroIconContainer: {
    width: 80,
    height: 80,
    borderRadius: RADIUS.xl,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  heroIcon: {
    fontSize: 36,
  },
  heroIconLines: {
    fontSize: 24,
    color: COLORS.primary,
    position: 'absolute',
    bottom: 12,
  },
  heroTitle: {
    fontSize: FONTS.sizes.xxxl,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  heroSubtitle: {
    fontSize: FONTS.sizes.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  cardsSection: {
    paddingHorizontal: SPACING.lg,
  },
  checkInCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.backgroundCard,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    ...SHADOWS.small,
  },
  checkInCardCompleted: {
    borderWidth: 2,
    borderColor: '#22C55E40',
    backgroundColor: '#22C55E08',
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  completedBadge: {
    marginLeft: SPACING.sm,
  },
  completedText: {
    color: '#22C55E',
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: RADIUS.lg,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  iconEmoji: {
    fontSize: 26,
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: FONTS.sizes.lg,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  cardSubtitle: {
    fontSize: FONTS.sizes.md,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  lastCompletedRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  lastCompletedText: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textLight,
    marginLeft: 4,
  },
  howItWorksContent: {
    marginTop: SPACING.lg,
    marginBottom: SPACING.xxl,
    backgroundColor: COLORS.backgroundCard,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    alignItems: 'center',
  },
  howItWorksTitle: {
    fontSize: FONTS.sizes.lg,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
    textAlign: 'center',
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: SPACING.md,
    width: '100%',
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  stepNumberText: {
    fontSize: FONTS.sizes.sm,
    fontWeight: '600',
    color: COLORS.secondary,
  },
  stepText: {
    flex: 1,
    fontSize: FONTS.sizes.lg,
    color: COLORS.textSecondary,
    lineHeight: 24,
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  modalTitle: {
    fontSize: FONTS.sizes.lg,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.xxl,
  },
  progressContainer: {
    marginBottom: SPACING.xl,
  },
  progressBar: {
    height: 6,
    backgroundColor: COLORS.borderLight,
    borderRadius: RADIUS.full,
    marginBottom: SPACING.sm,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.full,
  },
  progressText: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textLight,
    textAlign: 'center',
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full,
    marginBottom: SPACING.lg,
  },
  categoryEmoji: {
    fontSize: 18,
    marginRight: SPACING.sm,
  },
  categoryName: {
    fontSize: FONTS.sizes.md,
    fontWeight: '600',
  },
  questionContainer: {
    alignItems: 'center',
  },
  questionNumber: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textLight,
    marginBottom: SPACING.sm,
  },
  questionText: {
    fontSize: FONTS.sizes.xl,
    fontWeight: '600',
    color: COLORS.textPrimary,
    textAlign: 'center',
    lineHeight: 30,
    paddingHorizontal: SPACING.md,
  },
  answerSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  answerHint: {
    fontSize: FONTS.sizes.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
    backgroundColor: COLORS.backgroundPink,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.lg,
    borderRadius: RADIUS.xl,
  },
  modalFooter: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.xl,
    paddingBottom: SPACING.xl,
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.secondary,
    borderRadius: RADIUS.full,
    paddingVertical: SPACING.lg,
    gap: SPACING.sm,
  },
  nextButtonText: {
    fontSize: FONTS.sizes.lg,
    fontWeight: '600',
    color: COLORS.textWhite,
  },
});
