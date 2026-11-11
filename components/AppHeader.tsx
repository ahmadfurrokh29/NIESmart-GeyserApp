import { MaterialCommunityIcons } from '@expo/vector-icons';
import { getIconName } from '../constants/iconMappings';
import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { theme } from '../constants/theme';

interface AppHeaderProps {
  title: string;
  showBackButton?: boolean;
  rightIcon?: string;
  onRightIconPress?: () => void;
  subtitle?: string;
}

const AppHeader: React.FC<AppHeaderProps> = ({
  title,
  showBackButton = true,
  rightIcon,
  onRightIconPress,
  subtitle,
}) => {
  const router = useRouter();

  return (
    <View style={styles.header}>
      <View style={styles.headerLeft}>
        {showBackButton && (
          <Pressable 
            style={styles.backButton} 
            onPress={() => router.back()}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <MaterialCommunityIcons name="arrow-left" size={24} color={theme.colors.text} />
          </Pressable>
        )}
        <View>
          <Text style={styles.title}>{title}</Text>
          {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
        </View>
      </View>
      
      {rightIcon && (
        <Pressable 
          style={styles.rightButton} 
          onPress={onRightIconPress}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <MaterialCommunityIcons name={getIconName(rightIcon)} size={24} color={theme.colors.primary} />
        </Pressable>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  backButton: {
    padding: theme.spacing.sm,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: theme.colors.text,
  },
  subtitle: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  rightButton: {
    padding: theme.spacing.sm,
  },
});

export default AppHeader;