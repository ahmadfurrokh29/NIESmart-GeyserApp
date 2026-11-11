import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { StyleSheet, Text, TextStyle, TouchableOpacity, ViewStyle } from 'react-native';
import { theme } from '../constants/theme';

interface GradientButtonProps {
  title: string;
  onPress: () => void;
  colors?: string[];
  style?: ViewStyle;
  textStyle?: TextStyle;
  disabled?: boolean;
  size?: 'small' | 'medium' | 'large';
}

export const GradientButton: React.FC<GradientButtonProps> = ({
  title,
  onPress,
  colors = [theme.colors.primary, theme.colors.secondary],
  style,
  textStyle,
  disabled = false,
  size = 'medium',
}) => {
  const buttonHeight = size === 'small' ? 36 : size === 'large' ? 56 : 48;
  const fontSize = size === 'small' ? 14 : size === 'large' ? 18 : 16;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      style={[styles.button, { height: buttonHeight }, style]}
      activeOpacity={0.8}
    >
      <LinearGradient
        colors={(disabled ? ['#374151', '#374151'] : colors) as any}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.gradient}
      >
        <Text
          style={[
            styles.text,
            { fontSize, color: disabled ? theme.colors.textMuted : theme.colors.text },
            textStyle,
          ]}
        >
          {title}
        </Text>
      </LinearGradient>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: theme.borderRadius.md,
    overflow: 'hidden',
  },
  gradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
  },
  text: {
    fontWeight: '600',
  },
});