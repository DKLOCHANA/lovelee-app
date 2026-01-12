import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING, RADIUS } from '../constants/theme';
import { useUserStore } from '../store/store';

export default function Header({ title, subtitle, showHearts = true, rightComponent, titleStyle, subtitleStyle }) {
  const hearts = useUserStore((state) => state.hearts);

  return (
    <View style={styles.header}>
      <View style={styles.titleContainer}>
        <Text style={[styles.title, titleStyle]}>{title}</Text>
        {subtitle && <Text style={[styles.subtitle, subtitleStyle]}>{subtitle}</Text>}
      </View>
      {rightComponent ? (
        rightComponent
      ) : showHearts ? (
        <View style={styles.heartsContainer}>
          <Ionicons 
            name="heart-outline" 
            size={18} 
            color={COLORS.primaryDark} 
            style={styles.heartsIcon} 
          />
          <Text style={styles.heartsCount}>{hearts}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.lg,
    paddingTop: SPACING.sm,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: FONTS.sizes.xxl,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  subtitle: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  heartsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full,
  },
  heartsIcon: {
    marginRight: SPACING.xs,
  },
  heartsCount: {
    fontSize: FONTS.sizes.lg,
    fontWeight: '700',
    color: COLORS.primaryDark,
  },
});
