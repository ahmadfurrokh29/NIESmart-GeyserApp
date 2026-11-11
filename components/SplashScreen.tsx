import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useEffect } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import { theme } from '../constants/theme';

interface SplashScreenProps {
  onFinish: () => void;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish }) => {
  // Animation values
  const logoScale = new Animated.Value(0.3);
  const logoOpacity = new Animated.Value(0);
  const textOpacity = new Animated.Value(0);
  const progressWidth = new Animated.Value(0);

  useEffect(() => {
    // Sequence of animations
    Animated.sequence([
      // Fade in and scale up logo
      Animated.parallel([
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
          easing: Easing.out(Easing.ease),
        }),
        Animated.timing(logoScale, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
          easing: Easing.out(Easing.back(1.5)),
        }),
      ]),
      
      // Fade in text
      Animated.timing(textOpacity, {
        toValue: 1,
        duration: 600,
        delay: 200,
        useNativeDriver: true,
      }),
      
      // Progress bar animation
      Animated.timing(progressWidth, {
        toValue: 1,
        duration: 1200,
        useNativeDriver: false,
        easing: Easing.inOut(Easing.ease),
      }),
    ]).start(() => {
      // Delay before calling onFinish
      setTimeout(onFinish, 500);
    });
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Animated.View 
          style={[
            styles.logoContainer,
            {
              opacity: logoOpacity,
              transform: [{ scale: logoScale }],
            },
          ]}
        >
          <MaterialCommunityIcons name="water-boiler" size={80} color={theme.colors.primary} />
        </Animated.View>
        
        <Animated.Text style={[styles.title, { opacity: textOpacity }]}>
          Smart Geyser
        </Animated.Text>
        
        <Animated.Text style={[styles.subtitle, { opacity: textOpacity }]}>
          Intelligent Water Heating Control
        </Animated.Text>
        
        <View style={styles.progressContainer}>
          <Animated.View 
            style={[
              styles.progressBar,
              {
                width: progressWidth.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0%', '100%'],
                }),
              },
            ]}
          />
        </View>
      </View>
      
      <Animated.Text style={[styles.version, { opacity: textOpacity }]}>
        v1.0.0
      </Animated.Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
  },
  logoContainer: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: theme.colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  subtitle: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xl,
  },
  progressContainer: {
    width: 200,
    height: 4,
    backgroundColor: theme.colors.surface,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: theme.colors.primary,
  },
  version: {
    position: 'absolute',
    bottom: 40,
    fontSize: 12,
    color: theme.colors.textMuted,
  },
});

export default SplashScreen;