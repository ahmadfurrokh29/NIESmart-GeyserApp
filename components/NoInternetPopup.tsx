/**
 * Small popup at the bottom of the screen: "No internet connection".
 * Shown when the user tries to control the geyser while the phone is offline.
 * Hides itself after a few seconds, or when tapped.
 */
import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '../constants/theme';

const VISIBLE_MS = 3500;
const TAB_BAR_HEIGHT = 70; // keep the popup above the bottom tabs

interface Props {
  visible: boolean;
  onHide: () => void;
}

export function NoInternetPopup({ visible, onHide }: Props) {
  const insets = useSafeAreaInsets();
  const slide = useRef(new Animated.Value(0)).current; // 0 = hidden, 1 = shown

  useEffect(() => {
    if (!visible) return;
    Animated.timing(slide, { toValue: 1, duration: 200, useNativeDriver: true }).start();
    const timer = setTimeout(hide, VISIBLE_MS);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const hide = () => {
    Animated.timing(slide, { toValue: 0, duration: 180, useNativeDriver: true }).start(() => onHide());
  };

  if (!visible) return null;

  return (
    <View pointerEvents="box-none" style={[styles.wrapper, { bottom: insets.bottom + TAB_BAR_HEIGHT + theme.spacing.md }]}>
      <Animated.View
        style={{
          opacity: slide,
          transform: [{ translateY: slide.interpolate({ inputRange: [0, 1], outputRange: [40, 0] }) }],
        }}
      >
        <Pressable style={styles.card} onPress={hide} accessibilityRole="alert">
          <MaterialCommunityIcons name="wifi-off" size={22} color={theme.colors.warning} />
          <View style={styles.texts}>
            <Text style={styles.title}>No internet connection</Text>
            <Text style={styles.message}>Connect your phone to Wi‑Fi or mobile data to control your geyser.</Text>
          </View>
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: theme.spacing.md,
    right: theme.spacing.md,
    zIndex: 100,
    elevation: 100,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.warning + '80',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  texts: {
    flex: 1,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.text,
  },
  message: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
});
