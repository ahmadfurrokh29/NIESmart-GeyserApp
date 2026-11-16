import { Stack, useRouter } from "expo-router";
import * as SplashScreenLib from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import * as TaskManager from 'expo-task-manager';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import SplashScreen from '../components/SplashScreen';
import { theme } from '../constants/theme';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import { GeyserProvider } from '../contexts/GeyserContext';
import { ToastProvider } from '../contexts/ToastContext';
import './globals.css';

// Keep splash screen visible while we initialize the app
SplashScreenLib.preventAutoHideAsync();

function RootLayoutNav() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [initialLoad, setInitialLoad] = useState(true);
  const [showSplash, setShowSplash] = useState(true);

  // Schedules now run in the cloud (Firebase Cloud Function `runSchedules`).
  // Remove background tasks that older versions of the app registered on
  // this phone, so the OS stops waking the app up for them.
  useEffect(() => {
    TaskManager.unregisterAllTasksAsync().catch(() => {
      // Not supported in some environments (e.g. web); nothing to clean up there.
    });
  }, []);

  // 1. Effect for splash screen
  useEffect(() => {
    SplashScreenLib.hideAsync();
  }, []);

  // 2. Effect for initial load timer
  useEffect(() => {
    if (!loading) {
      const timer = setTimeout(() => {
        setInitialLoad(false);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [loading]);

  // 3. Effect for navigation
  useEffect(() => {
    if (!loading && !initialLoad && !showSplash && user) {
      console.log('RootLayoutNav - Navigating to tabs');
      try {
        router.replace('/(tabs)');
      } catch (error) {
        console.error('RootLayoutNav - Navigation error:', error);
      }
    }
  }, [loading, initialLoad, showSplash, user, router]);

  const handleSplashComplete = () => {
    setShowSplash(false);
  };

  if (showSplash) {
    return <SplashScreen onFinish={handleSplashComplete} />;
  }

  if (loading || initialLoad) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.colors.background }}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={{ marginTop: 10, color: theme.colors.text }}>Loading...</Text>
      </View>
    );
  }

  return (
    <>
      <StatusBar style="light" backgroundColor={theme.colors.background} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: theme.colors.background },
          animation: 'slide_from_right',
          presentation: 'card',
          animationDuration: 200,
        }}
      >
        {/* Always include all screens but conditionally redirect in index.tsx */}
        <Stack.Screen name="index" options={{ animation: 'fade' }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="auth/login" options={{ animation: 'none' }} />
        <Stack.Screen name="auth/signup" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="auth/forgot-password" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="quickActions/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="geyser-management" options={{ headerShown: false }} />
        <Stack.Screen name="add-geyser" options={{ headerShown: false }} />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <GeyserProvider>
        <ToastProvider>
          <RootLayoutNav />
        </ToastProvider>
      </GeyserProvider>
    </AuthProvider>
  );
}
