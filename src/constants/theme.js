// Pairly App Theme - Soft, Romantic, Cute Aesthetic

export const COLORS = {
  // Primary Colors
  primary: '#E8A4A4',      // Soft pink
  primaryDark: '#D4848D',  // Darker pink
  primaryLight: '#FFD1D1', // Light pink
  
  // Secondary Colors  
  secondary: '#A67B5B',    // Warm brown
  secondaryLight: '#C9A77C', // Light brown
  secondaryDark: '#8B5A3C',  // Dark brown
  
  // Background Colors
  background: '#FFF9F5',   // Cream white
  backgroundPink: '#FFF0F0', // Soft pink background
  backgroundCard: '#FFFFFF', // White cards
  
  // Accent Colors
  accent: '#FFB6C1',       // Light pink accent
  accentGreen: '#98D4A0',  // Soft green for plants
  accentBlue: '#A8D8EA',   // Soft blue
  accentYellow: '#FFE5A0', // Soft yellow
  accentPurple: '#D4A5D9', // Soft purple
  
  // Heart/Love Colors
  heart: '#FF6B8A',        // Heart red-pink
  heartLight: '#FFB3C1',   // Light heart
  
  // Text Colors
  textPrimary: '#4A3728',  // Dark brown text
  textSecondary: '#8B7355', // Medium brown text
  textLight: '#A69580',    // Light brown text
  textWhite: '#FFFFFF',
  
  // Status Colors
  success: '#7DC89F',
  warning: '#FFB347',
  error: '#FF6B6B',
  
  // Neutral Colors
  border: '#E8DDD0',
  borderLight: '#F5EDE4',
  shadow: 'rgba(139, 90, 60, 0.1)',
  overlay: 'rgba(0, 0, 0, 0.3)',
  
  // Mood Colors
  moodHappy: '#FFD93D',
  moodLove: '#FF6B8A',
  moodSad: '#6BADE8',
  moodAngry: '#FF6B6B',
  moodCalm: '#98D4A0',
  moodTired: '#C4B5A0',
};

export const FONTS = {
  regular: 'System',
  medium: 'System',
  bold: 'System',
  sizes: {
    xs: 10,
    sm: 12,
    md: 14,
    lg: 16,
    xl: 18,
    xxl: 22,
    xxxl: 28,
    title: 32,
  },
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  full: 9999,
};

export const SHADOWS = {
  small: {
    shadowColor: COLORS.secondary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  medium: {
    shadowColor: COLORS.secondary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  large: {
    shadowColor: COLORS.secondary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
  },
};

export default {
  COLORS,
  FONTS,
  SPACING,
  RADIUS,
  SHADOWS,
};
