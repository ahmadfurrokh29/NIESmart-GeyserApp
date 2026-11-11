import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { theme } from '../constants/theme';

interface DarkCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  variant?: 'default' | 'secondary';
  padding?: keyof typeof theme.spacing;
  borderRadius?: keyof typeof theme.borderRadius;
}

export const DarkCard: React.FC<DarkCardProps> = ({
  children,
  style,
  variant = 'default',
  padding = 'lg',
  borderRadius = 'lg',
}) => {
  const cardStyle = [
    styles.card,
    {
      backgroundColor: variant === 'secondary' ? theme.colors.cardSecondary : theme.colors.card,
      padding: theme.spacing[padding],
      borderRadius: theme.borderRadius[borderRadius],
    },
    style,
  ];

  return <View style={cardStyle}>{children}</View>;
};

const styles = StyleSheet.create({
  card: {
    ...theme.shadows.sm,
  },
});