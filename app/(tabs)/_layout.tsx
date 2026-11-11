import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { getIconName } from '../../constants/iconMappings';
import { theme } from '../../constants/theme';

const TabIcon = ({
  focused,
  icon,
  title,
}: {
  focused: boolean;
  icon: string;
  title: string;
}) => {
  const iconColor = focused ? theme.colors.text : theme.colors.textMuted;

  if (focused) {
    return (
      <View style={styles.activeTab}>
        <MaterialCommunityIcons name={getIconName(icon)} size={20} color={iconColor} />
        <Text style={styles.activeTabText}>{title}</Text>
      </View>
    );
  }

  return (
    <View style={styles.inactiveTab}>
      <MaterialCommunityIcons name={getIconName(icon)} size={20} color={iconColor} />
    </View>
  );
};

export default function Layout() {
  return (
    <Tabs
      screenOptions={{
        tabBarShowLabel: false,
        tabBarItemStyle: {
          width: '100%',
          height: '100%',
          justifyContent: 'center',
          alignItems: 'center',
        },
        tabBarStyle: {
          borderRadius: theme.borderRadius.xxl,
          marginHorizontal: theme.spacing.lg,
          marginBottom: theme.spacing.xl,
          height: 70,
          position: 'absolute',
          backgroundColor: theme.colors.card,
          borderWidth: 1,
          borderColor: theme.colors.border,
          ...theme.shadows.md,
          paddingTop: theme.spacing.sm,
          paddingBottom: theme.spacing.sm,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          headerShown: false,
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} icon="home-outline" title="Home" />
          ),
        }}
      />
      <Tabs.Screen
        name="set_temp"
        options={{
          title: 'Set Temp',
          headerShown: false,
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} icon="thermometer" title="Temp" />
          ),
        }}
      />
      <Tabs.Screen
        name="mode"
        options={{
          title: 'Mode',
          headerShown: false,
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} icon="tune" title="Mode" />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          headerShown: false,
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} icon="cog-outline" title="Settings" />
          ),
        }}
      />

    </Tabs>
  );
}

const styles = StyleSheet.create({
  activeTab: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.lg,
    minWidth: 70,
    height: 36,
    justifyContent: 'center',
  },
  activeTabText: {
    color: theme.colors.background,
    fontSize: 12,
    fontWeight: '600',
    marginLeft: theme.spacing.xs,
  },
  inactiveTab: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.xs,
    height: 36,
  },
});
