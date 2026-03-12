import { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from '../constants/theme';
import { useUserStore } from '../store/store';
import { auth } from '../firebase/config';
import { getUserProfile } from '../firebase/services/userService';

export default function Header({ title, subtitle, showHearts = true, rightComponent, titleStyle, subtitleStyle, heartsContainerStyle }) {
  const storeHearts = useUserStore((state) => state.hearts);
  const heartsLoaded = useUserStore((state) => state.heartsLoaded);
  const initFromFirebase = useUserStore((state) => state.initFromFirebase);

  // Load hearts from Firebase if not already loaded
  useEffect(() => {
    const loadHearts = async () => {
      if (!heartsLoaded && auth.currentUser) {
        const profile = await getUserProfile(auth.currentUser.uid);
        if (profile) {
          initFromFirebase(profile);
        }
      }
    };
    loadHearts();
  }, [heartsLoaded, initFromFirebase]);

  return (
    <View style={styles.header}>
      <View style={styles.titleContainer}>
        <Text style={[styles.title, titleStyle]}>{title}</Text>
        {subtitle && <Text style={[styles.subtitle, subtitleStyle]}>{subtitle}</Text>}
      </View>
      {rightComponent ? (
        rightComponent
      ) : showHearts ? (
        <View style={[styles.heartsContainer, heartsContainerStyle]}>
          <Ionicons 
            name="heart" 
            size={18} 
            color={COLORS.secondary} 
          />
          <Text style={styles.heartsCount}>{storeHearts}</Text>
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
    backgroundColor: COLORS.backgroundCard,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full,
    ...SHADOWS.small,
  },
  heartsCount: {
    fontSize: FONTS.sizes.md,
    fontWeight: '700',
    color: COLORS.secondary,
    marginLeft: SPACING.xs,
  },
});
