import { useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../constants/theme';
import { useAuth } from '../contexts/AuthContext';
import { useGeyser } from '../contexts/GeyserContext';

const AppRouter = () => {
  const router = useRouter();
  const { user, loading } = useAuth();
  const { claimDevice } = useGeyser();

  // Handle routing based on auth state
  useEffect(() => {
    const handleNavigation = async () => {
      console.log('AppRouter - Auth state:', { loading, user: !!user, claimedDeviceId: user?.claimedDeviceId });
      
      if (loading) {
        console.log('AppRouter - Still loading auth state...');
        return;
      }

      try {
        if (user) {
          console.log('AppRouter - User authenticated, redirecting to main app');
          router.replace('/(tabs)');
        } else {
          console.log('AppRouter - User not authenticated, redirecting to sign in');
          router.replace('/auth/login');
        }
      } catch (error) {
        console.error('AppRouter - Navigation error:', error);
      }
    };

    handleNavigation();
  }, [user, loading]);

  // Separate useEffect specifically for handling pending device claims
  useEffect(() => {
    if (!user || loading) return;
    
    console.log('AppRouter - Device claim handler triggered for user:', user.email);
    
    const handlePendingDeviceClaim = async () => {
      try {
        const AsyncStorage = await import('@react-native-async-storage/async-storage');
        const pendingDeviceId = await AsyncStorage.default.getItem('pendingDeviceId');
        const pendingDeviceName = await AsyncStorage.default.getItem('pendingDeviceName');

        console.log('AppRouter - Device claim handler checking:', {
          pendingDeviceId,
          pendingDeviceName,
          userClaimedDevice: user.claimedDeviceId,
        });

        if (pendingDeviceId && !user.claimedDeviceId) {
          console.log('AppRouter - Device claim handler found pending claim:', pendingDeviceId);
          try {
            await claimDevice(
              pendingDeviceId,
              pendingDeviceName || `${user.displayName}'s Geyser`
            );
            console.log('AppRouter - Device claim handler succeeded:', pendingDeviceId);
          } catch (claimError: any) {
            console.error('AppRouter - Device claim handler failed:', claimError.message);
          } finally {
            await AsyncStorage.default.removeItem('pendingDeviceId');
            await AsyncStorage.default.removeItem('pendingDeviceName');
            console.log('AppRouter - Device claim handler cleared pending claim');
          }
        } else if (pendingDeviceId && user.claimedDeviceId) {
          console.log('AppRouter - Device claim handler: user already has device, clearing pending');
          await AsyncStorage.default.removeItem('pendingDeviceId');
          await AsyncStorage.default.removeItem('pendingDeviceName');
        } else {
          console.log('AppRouter - Device claim handler: no pending claim found');
        }
      } catch (error) {
        console.error('AppRouter - Device claim handler error:', error);
      }
    };

    handlePendingDeviceClaim();
  }, [user?.email, user?.claimedDeviceId, loading, claimDevice]);

  // Show loading screen while determining route
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.text}>Loading...</Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  text: {
    fontSize: 16,
    color: theme.colors.textSecondary,
  },
});

export default AppRouter;