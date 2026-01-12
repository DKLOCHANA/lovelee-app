import { Tabs } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useState, useEffect } from 'react';
import { COLORS, FONTS } from '../../src/constants/theme';

function TabIcon({ name, label, focused }) {
  return (
    <View style={[styles.tabIconContainer, focused && styles.tabIconContainerFocused]}>
      <Ionicons 
        name={focused ? name : `${name}-outline`} 
        size={22} 
        color={focused ? COLORS.secondary : COLORS.textLight} 
      />
    </View>
  );
}

// Activity Icon with notification badge
function ActivityTabIcon({ focused, unreadCount }) {
  return (
    <View style={[styles.tabIconContainer, focused && styles.tabIconContainerFocused]}>
      <Ionicons 
        name={focused ? 'notifications' : 'notifications-outline'} 
        size={22} 
        color={focused ? COLORS.secondary : COLORS.textLight} 
      />
      {unreadCount > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </Text>
        </View>
      )}
    </View>
  );
}

export default function TabLayout() {
  // Hardcoded unread count - in real app, this would come from a global state or context
  const [unreadCount, setUnreadCount] = useState(3);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarShowLabel: true,
        tabBarActiveTintColor: COLORS.secondary,
        tabBarInactiveTintColor: COLORS.textLight,
        tabBarLabelStyle: styles.tabBarLabel,
        tabBarItemStyle: styles.tabBarItem,
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          tabBarIcon: ({ focused }) => (
            <TabIcon name="home" label="Home" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="shortcuts"
        options={{
          title: 'Shortcuts',
          tabBarIcon: ({ focused }) => (
            <TabIcon name="grid" label="Shortcuts" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ focused }) => (
            <TabIcon name="people" label="Profile" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="activity"
        options={{
          title: 'Activity',
          tabBarIcon: ({ focused }) => (
            <ActivityTabIcon focused={focused} unreadCount={unreadCount} />
          ),
        }}
      />
      
      {/* Hidden tabs - accessible via shortcuts but not shown in tab bar */}
      <Tabs.Screen
        name="notes"
        options={{
          href: null, // Hide from tab bar
        }}
      />
      <Tabs.Screen
        name="mood"
        options={{
          href: null, // Hide from tab bar
        }}
      />
      <Tabs.Screen
        name="gifts"
        options={{
          href: null, // Hide from tab bar
        }}
      />
      <Tabs.Screen
        name="pet"
        options={{
          href: null, // Hide from tab bar
        }}
      />
      <Tabs.Screen
        name="plant"
        options={{
          href: null, // Hide from tab bar
        }}
      />
      <Tabs.Screen
        name="checkins"
        options={{
          href: null, // Hide from tab bar
        }}
      />
      <Tabs.Screen
        name="music"
        options={{
          href: null, // Hide from tab bar
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    bottom: 20,
    marginLeft: 10,
    marginRight: 10,
    backgroundColor: COLORS.backgroundCard,
    borderRadius: 25,
    height: 70,
    paddingTop: 5,
    paddingBottom: 10,
    paddingHorizontal: 10,
    borderTopWidth: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 12,
  },
  tabBarLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  tabBarItem: {
    paddingVertical: 5,
  },
  tabIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 40,
    height: 28,
    position: 'relative',
  },
  tabIconContainerFocused: {
    backgroundColor: COLORS.primaryLight,
    borderRadius: 14,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: COLORS.heart,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: COLORS.backgroundCard,
  },
  badgeText: {
    color: COLORS.textWhite,
    fontSize: 10,
    fontWeight: '700',
  },
});
