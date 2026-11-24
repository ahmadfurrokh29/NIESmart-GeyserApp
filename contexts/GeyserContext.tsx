import {
    get,
    onValue,
    ref,
    update
} from 'firebase/database';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { NoInternetPopup } from '../components/NoInternetPopup';
import { database } from '../config/firebase';
import { scheduleService } from '../services/scheduleService';
import { useAuth } from './AuthContext';

export interface DeviceData {
  current_Temp: string;
  target_Temp: number;
  mode: 'electric' | 'gas' | 'hybrid';
  isOn?: boolean;
  userId?: string;
  /** Set by the Cloud Function while a schedule is running the geyser. */
  activeScheduleId?: string | null;
  /** Settings saved by the Cloud Function before a schedule took control. */
  beforeSchedule?: { isOn: boolean; target_Temp?: number; mode?: string } | null;
  /**
   * Written by the HARDWARE (ESP32): true when the geyser is really heating
   * (measured by its sensors), false when not. The app only reads it, to show
   * the mode icon on Home. Missing = false.
   */
  Geyser_state?: boolean;
}

/** Thrown when a geyser command is blocked because the phone is offline. */
export class OfflineError extends Error {
  constructor() {
    super('No internet connection');
    this.name = 'OfflineError';
  }
}

export const isOfflineError = (error: unknown): boolean => error instanceof OfflineError;

interface GeyserContextType {
  device: DeviceData | null;
  loading: boolean;
  /** True when the phone is connected to Firebase (has internet). */
  isOnline: boolean;
  updateDeviceSettings: (temperature: number, mode: string) => Promise<void>;
  updateGeyserOnOff: (isOn: boolean) => Promise<void>;
  updateDeviceMode: (mode: 'electric' | 'gas' | 'hybrid') => Promise<void>;
  updateDeviceName: (customName: string, location?: string) => Promise<void>;
  claimDevice: (deviceId: string, deviceName: string) => Promise<void>;
  unclaimDevice: () => Promise<void>;
  normalizeDatabaseMode: () => Promise<void>;
  checkAndFixCaseSensitivity: () => Promise<boolean>;
  logCurrentState: () => void;
}

const GeyserContext = createContext<GeyserContextType | undefined>(undefined);

export const useGeyser = () => {
  const context = useContext(GeyserContext);
  if (context === undefined) {
    throw new Error('useGeyser must be used within a GeyserProvider');
  }
  return context;
};

export const GeyserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [device, setDevice] = useState<DeviceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [userSelectedMode, setUserSelectedMode] = useState<'electric' | 'gas' | 'hybrid'>('electric');
  const [lastUserModeChange, setLastUserModeChange] = useState<number>(0);
  const [isOnline, setIsOnline] = useState(false);
  const [showNoInternet, setShowNoInternet] = useState(false);

  // Firebase tells us when this phone is connected to it (i.e. has internet).
  useEffect(() => {
    return onValue(ref(database, '.info/connected'), (snapshot) => setIsOnline(snapshot.val() === true));
  }, []);

  /**
   * Geyser commands are only sent when online. Otherwise Firebase would keep
   * them and send them whenever the phone reconnects, maybe hours later,
   * switching the geyser when nobody expects it.
   */
  const requireOnline = () => {
    if (!isOnline) {
      setShowNoInternet(true);
      throw new OfflineError();
    }
  };

  // Helper function to normalize mode case - now accepts both formats
  const normalizeMode = (mode: string): 'electric' | 'gas' | 'hybrid' => {
    if (!mode) return 'electric';
    
    // Handle both capitalized and lowercase formats
    const modeLower = mode.toLowerCase();
    
    // Check lowercase first
    if (modeLower === 'electric' || modeLower === 'gas' || modeLower === 'hybrid') {
      return modeLower;
    }
    
    // Check exact matches for any case variations
    if (mode === 'Electric' || mode === 'ELECTRIC' || mode === 'electric') return 'electric';
    if (mode === 'Gas' || mode === 'GAS' || mode === 'gas') return 'gas';
    if (mode === 'Hybrid' || mode === 'HYBRID' || mode === 'hybrid') return 'hybrid';
    
    // Default fallback
    console.warn('GeyserContext - Unknown mode format:', mode, 'falling back to electric');
    return 'electric';
  };

  // Function to ensure database mode is normalized
  const ensureDatabaseModeNormalized = async (deviceId: string, currentMode: string) => {
    const normalizedMode = normalizeMode(currentMode);
    
    // Only normalize if there's a real case sensitivity issue (invalid format)
    // Accept both 'Gas' and 'gas' formats as valid
    if (currentMode !== normalizedMode && 
        !['Electric', 'Gas', 'Hybrid', 'electric', 'gas', 'hybrid'].includes(currentMode)) {
      console.log('GeyserContext - Normalizing database mode from', currentMode, 'to', normalizedMode);
      const deviceRef = ref(database, `DEVICES/${deviceId}`);
      try {
        await update(deviceRef, { mode: normalizedMode });
        console.log('GeyserContext - Database mode normalized successfully');
        return normalizedMode;
      } catch (error) {
        console.error('GeyserContext - Error normalizing database mode:', error);
        return currentMode; // Return original if update fails
      }
    } else {
      console.log('GeyserContext - Database mode format is acceptable, no normalization needed');
      return currentMode;
    }
  };

  // Subscribe to device data
  useEffect(() => {
         console.log('GeyserContext - User state changed:', { 
       user: !!user, 
       claimedDeviceId: user?.claimedDeviceId,
       deviceId: user?.deviceId 
     });

    if (!user) {
      scheduleService.stop();
      setDevice(null);
      setLoading(false);
      return;
    }

    const unsubscribers: (() => void)[] = [];

    // Listen to device data if user has claimed device
    const claimedDeviceId = user.claimedDeviceId || user.deviceId;
    console.log('GeyserContext - Claimed device ID:', claimedDeviceId);
    
    // Keep this device's schedules in sync with Firebase (cloud scheduling).
    if (claimedDeviceId) {
      scheduleService.start(claimedDeviceId).catch((error) =>
        console.error('GeyserContext - Error starting schedule sync:', error),
      );
    } else {
      scheduleService.stop();
    }

    if (claimedDeviceId) {
      const deviceRef = ref(database, `DEVICES/${claimedDeviceId}`);
      const deviceUnsubscribe = onValue(deviceRef, (snapshot) => {
        const deviceData = snapshot.exists() ? snapshot.val() : null;
        console.log('GeyserContext - Device data updated:', deviceData);
        
        if (deviceData) {
          // Normalize the mode from database to handle case sensitivity
          const normalizedMode = normalizeMode(deviceData.mode);
          console.log('GeyserContext - Mode from database:', deviceData.mode, 'Normalized to:', normalizedMode);
          
          // Only update database if there's a real case sensitivity issue that causes problems
          // Accept both 'Gas' and 'gas' formats without forcing normalization
          if (deviceData.mode !== normalizedMode && 
              !['Electric', 'Gas', 'Hybrid', 'electric', 'gas', 'hybrid'].includes(deviceData.mode)) {
            console.log('GeyserContext - Detected invalid mode format, normalizing database mode');
            console.log('GeyserContext - Original mode:', deviceData.mode, 'Normalized mode:', normalizedMode);
            ensureDatabaseModeNormalized(claimedDeviceId, deviceData.mode);
          }
          
          // Check if this is a recent user change (within 3 seconds)
          const now = Date.now();
          const timeSinceLastUserChange = now - lastUserModeChange;
          
          if (timeSinceLastUserChange < 3000) { // 3 seconds
            // This is likely a user change, update the selected mode
            console.log('GeyserContext - Recent user change detected, updating mode to:', normalizedMode);
            setUserSelectedMode(normalizedMode);
          } else {
            // This is likely an ESP32 change, update the mode to reflect ESP32 changes
            console.log('GeyserContext - ESP32 change detected, updating mode to:', normalizedMode);
            setUserSelectedMode(normalizedMode);
          }
          
          // Update device data with normalized mode for consistent app behavior
          const normalizedDeviceData = {
            ...deviceData,
            mode: normalizedMode
          };
          setDevice(normalizedDeviceData);
          
          console.log('GeyserContext - Device state updated with normalized mode:', normalizedDeviceData);
        } else {
          setDevice(null);
        }
        
        setLoading(false);
      });
      // onValue returns its own unsubscribe function. (Passing it to off() did
      // nothing, so old listeners piled up every time this effect re-ran.)
      unsubscribers.push(deviceUnsubscribe);
    } else {
      console.log('GeyserContext - No device claimed, setting device to null');
      setDevice(null);
      setLoading(false);
    }

    return () => unsubscribers.forEach(unsub => unsub());
  }, [user?.claimedDeviceId, user?.deviceId, lastUserModeChange]);

  const updateDeviceSettings = async (temperature: number, mode: string): Promise<void> => {
    const claimedDeviceId = user?.claimedDeviceId || user?.deviceId;
    if (!claimedDeviceId) {
      throw new Error('No device claimed');
    }

    requireOnline();
    const deviceRef = ref(database, `DEVICES/${claimedDeviceId}`);
    await update(deviceRef, {
      target_Temp: temperature,
      mode: mode as 'electric' | 'gas' | 'hybrid',
      // A manual change stops a running schedule for today (it still runs on its
      // next day) and cancels restoring the settings saved before it.
      activeScheduleId: null,
      beforeSchedule: null,
    });
  };

  const updateGeyserOnOff = async (isOn: boolean): Promise<void> => {
    const claimedDeviceId = user?.claimedDeviceId || user?.deviceId;
    if (!claimedDeviceId) {
      throw new Error('No device claimed');
    }

    requireOnline();
    const deviceRef = ref(database, `DEVICES/${claimedDeviceId}`);
    await update(deviceRef, {
      isOn: isOn,
      // A manual change stops a running schedule for today (it still runs on its
      // next day) and cancels restoring the settings saved before it.
      activeScheduleId: null,
      beforeSchedule: null,
    });
  };

  const updateDeviceMode = async (mode: 'electric' | 'gas' | 'hybrid'): Promise<void> => {
    const claimedDeviceId = user?.claimedDeviceId || user?.deviceId;
    if (!claimedDeviceId) {
      throw new Error('No device claimed');
    }

    console.log('GeyserContext - updateDeviceMode called with:', mode);
    requireOnline();
    
    // Update user's selected mode immediately for UI responsiveness
    setUserSelectedMode(mode);
    
    // Track the time of this user change
    setLastUserModeChange(Date.now());

    const deviceRef = ref(database, `DEVICES/${claimedDeviceId}`);
    await update(deviceRef, {
      mode: mode,
      // A manual change stops a running schedule for today (it still runs on its
      // next day) and cancels restoring the settings saved before it.
      activeScheduleId: null,
      beforeSchedule: null,
    });
  };

  const updateDeviceName = async (customName: string, location?: string): Promise<void> => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Since we simplified the structure, device name customization 
    // would need to be handled differently or removed
    throw new Error('Device name customization not available in simplified structure');
  };

  const claimDevice = async (deviceId: string, deviceName: string): Promise<void> => {
    console.log('GeyserContext - claimDevice called with:', { deviceId, deviceName });
    
    if (!user) throw new Error('User not authenticated');

    // Get the Firebase Auth UID
    const { auth } = await import('../config/firebase');
    const firebaseUser = auth.currentUser;
    if (!firebaseUser) throw new Error('Firebase user not found');
    
    const userId = firebaseUser.uid;
    console.log('GeyserContext - claimDevice using userId:', userId);

    // Check if user already has a different claimed device
    const currentClaimedDevice = user.claimedDeviceId || user.deviceId;
    if (currentClaimedDevice && currentClaimedDevice !== deviceId) {
      throw new Error('You can only claim one device per account. Please unclaim your current device first.');
    }

    const deviceRef = ref(database, `DEVICES/${deviceId}`);
    const deviceSnapshot = await get(deviceRef);

    if (!deviceSnapshot.exists()) {
      throw new Error('Device not found');
    }

    const deviceData = deviceSnapshot.val() as DeviceData;
    console.log('GeyserContext - claimDevice found device data:', deviceData);

    // Check if device is already claimed by another user
    if (deviceData.userId && deviceData.userId !== userId) {
      throw new Error('Device is already claimed by another user');
    }

    // If already claimed by this user, return early
    if (deviceData.userId === userId) {
      console.log('GeyserContext - claimDevice: device already claimed by this user');
      return;
    }

    console.log('GeyserContext - claimDevice performing updates...');
    // Perform all updates
    await Promise.all([
      update(ref(database, `users/${userId}`), { claimedDeviceId: deviceId }),
      update(deviceRef, { userId: userId })
    ]);

    console.log('GeyserContext - claimDevice completed successfully');
  };

  const unclaimDevice = async (): Promise<void> => {
    if (!user) throw new Error('User not authenticated');

    // Get the Firebase Auth UID
    const { auth } = await import('../config/firebase');
    const firebaseUser = auth.currentUser;
    if (!firebaseUser) throw new Error('Firebase user not found');
    
    const userId = firebaseUser.uid;

    const claimedDeviceId = user.claimedDeviceId || user.deviceId;
    if (!claimedDeviceId) throw new Error('No device claimed by this user');

    // Unlink both sides and stop any running schedule, in one atomic update.
    await update(ref(database), {
      [`DEVICES/${claimedDeviceId}/userId`]: null,
      [`DEVICES/${claimedDeviceId}/activeScheduleId`]: null,
      [`DEVICES/${claimedDeviceId}/beforeSchedule`]: null,
      [`users/${userId}/claimedDeviceId`]: null,
    });

    // The geyser's schedules belong to this owner, so remove them too
    // (in Firebase and on this phone); the next owner starts fresh.
    try {
      await scheduleService.deleteAllForDevice(claimedDeviceId);
    } catch (error) {
      console.error('GeyserContext - Error removing schedules on unclaim:', error);
    }
  };

  const normalizeDatabaseMode = async (): Promise<void> => {
    const claimedDeviceId = user?.claimedDeviceId || user?.deviceId;
    if (!claimedDeviceId) {
      throw new Error('No device claimed to normalize mode for');
    }
    const deviceRef = ref(database, `DEVICES/${claimedDeviceId}`);
    const deviceSnapshot = await get(deviceRef);
    if (deviceSnapshot.exists()) {
      const currentMode = deviceSnapshot.val().mode;
      const normalizedMode = normalizeMode(currentMode);
      if (currentMode !== normalizedMode) {
        console.log('GeyserContext - Forcing database mode normalization for device:', claimedDeviceId);
        console.log('GeyserContext - Current mode:', currentMode, 'Normalized mode:', normalizedMode);
        await update(deviceRef, { mode: normalizedMode });
        console.log('GeyserContext - Database mode normalized successfully for device:', claimedDeviceId);
      } else {
        console.log('GeyserContext - Database mode is already normalized for device:', claimedDeviceId);
      }
    }
  };

  // Function to check and fix case sensitivity issues
  const checkAndFixCaseSensitivity = async (): Promise<boolean> => {
    const claimedDeviceId = user?.claimedDeviceId || user?.deviceId;
    if (!claimedDeviceId) {
      console.log('GeyserContext - No device claimed, cannot check case sensitivity');
      return false;
    }
    
    try {
      const deviceRef = ref(database, `DEVICES/${claimedDeviceId}`);
      const deviceSnapshot = await get(deviceRef);
      if (deviceSnapshot.exists()) {
        const currentMode = deviceSnapshot.val().mode;
        const normalizedMode = normalizeMode(currentMode);
        
        console.log('GeyserContext - Checking case sensitivity for device:', claimedDeviceId);
        console.log('GeyserContext - Current database mode:', currentMode);
        console.log('GeyserContext - Normalized mode:', normalizedMode);
        
        // Only fix if there's a real case sensitivity issue (invalid format)
        // Accept both 'Gas' and 'gas' formats as valid
        if (currentMode !== normalizedMode && 
            !['Electric', 'Gas', 'Hybrid', 'electric', 'gas', 'hybrid'].includes(currentMode)) {
          console.log('GeyserContext - Case sensitivity issue detected:', currentMode, '->', normalizedMode);
          await update(deviceRef, { mode: normalizedMode });
          console.log('GeyserContext - Case sensitivity issue fixed');
          return true;
        } else {
          console.log('GeyserContext - No case sensitivity issues found - mode format is acceptable');
          return false;
        }
      }
      return false;
    } catch (error) {
      console.error('GeyserContext - Error checking case sensitivity:', error);
      return false;
    }
  };

  // Function to log current state for debugging
  const logCurrentState = () => {
    console.log('GeyserContext - Current State:');
    console.log('  - User:', user ? 'authenticated' : 'not authenticated');
    console.log('  - Device:', device);
    console.log('  - User Selected Mode:', userSelectedMode);
    console.log('  - Last User Mode Change:', lastUserModeChange);
    console.log('  - Loading:', loading);
  };

  const value: GeyserContextType = {
    device,
    loading,
    isOnline,
    updateDeviceSettings,
    updateGeyserOnOff,
    updateDeviceMode,
    updateDeviceName,
    claimDevice,
    unclaimDevice,
    normalizeDatabaseMode,
    checkAndFixCaseSensitivity,
    logCurrentState,
  };

  return (
    <GeyserContext.Provider value={value}>
      {children}
      <NoInternetPopup visible={showNoInternet} onHide={() => setShowNoInternet(false)} />
    </GeyserContext.Provider>
  );
};