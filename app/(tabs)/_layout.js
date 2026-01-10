import { Tabs } from 'expo-router';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
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

export default function TabLayout() {
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
        name="notes"
        options={{
          title: 'Notes',
          tabBarIcon: ({ focused }) => (
            <TabIcon name="mail" label="Notes" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="mood"
        options={{
          title: 'Mood',
          tabBarIcon: ({ focused }) => (
            <TabIcon name="happy" label="Mood" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="gifts"
        options={{
          title: 'Gifts',
          tabBarIcon: ({ focused }) => (
            <TabIcon name="gift" label="Gifts" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="pet"
        options={{
          title: 'Pet',
          tabBarIcon: ({ focused }) => (
            <TabIcon name="paw" label="Pet" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ focused }) => (
            <TabIcon name="person" label="Profile" focused={focused} />
          ),
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
  },
  tabIconContainerFocused: {
    backgroundColor: COLORS.primaryLight,
    borderRadius: 14,
  },
});
