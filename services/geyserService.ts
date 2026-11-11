import {
    get,
    onValue,
    ref,
    set,
    update
} from 'firebase/database';
import { database } from '../config/firebase';

export interface DeviceData {
  current_Temp: string;
  target_Temp: number;
  mode: 'electric' | 'gas' | 'hybrid';
  isOn?: boolean;
  userId?: string;
}

export interface UserData {
  uid: string;
  email: string;
  phone: string;
  displayName: string;
  claimedDeviceId?: string;
}

export interface LocalDevice {
  name: string;
  status: string;
  deviceId: string;
}

class GeyserService {
  // Get device data
  async getDeviceData(deviceId: string): Promise<DeviceData | null> {
    try {
      const deviceRef = ref(database, `DEVICES/${deviceId}`);
      const snapshot = await get(deviceRef);
      return snapshot.exists() ? snapshot.val() : null;
    } catch (error) {
      console.error('Error getting device data:', error);
      throw error;
    }
  }

  // Update device data
  async updateDeviceData(deviceId: string, updates: Partial<DeviceData>): Promise<void> {
    try {
      const deviceRef = ref(database, `DEVICES/${deviceId}`);
      await update(deviceRef, updates);
    } catch (error) {
      console.error('Error updating device data:', error);
      throw error;
    }
  }

  // Listen to device data changes
  subscribeToDeviceData(deviceId: string, callback: (data: DeviceData | null) => void) {
    const deviceRef = ref(database, `DEVICES/${deviceId}`);
    return onValue(deviceRef, (snapshot) => {
      callback(snapshot.exists() ? snapshot.val() : null);
    });
  }

  // Control device temperature
  async setTemperature(deviceId: string, temperature: number, userUID: string): Promise<void> {
    await Promise.all([
      this.updateDeviceData(deviceId, { target_Temp: temperature }),
      this.logAction(deviceId, userUID, 'temperature', { temperature })
    ]);
  }

  // Control device mode
  async setMode(deviceId: string, mode: 'electric' | 'gas' | 'hybrid', userUID: string): Promise<void> {
    await Promise.all([
      this.updateDeviceData(deviceId, { mode }),
      this.logAction(deviceId, userUID, 'mode', { mode })
    ]);
  }

  // Control device power state
  async setPowerState(deviceId: string, isOn: boolean, userUID: string): Promise<void> {
    await Promise.all([
      this.updateDeviceData(deviceId, { isOn }),
      this.logAction(deviceId, userUID, 'power', { isOn })
    ]);
  }

  // Get user data
  async getUserData(uid: string): Promise<UserData | null> {
    const userRef = ref(database, `users/${uid}`);
    const snapshot = await get(userRef);
    return snapshot.exists() ? snapshot.val() : null;
  }

  // Update user data
  async updateUserData(uid: string, data: Partial<UserData>): Promise<void> {
    const userRef = ref(database, `users/${uid}`);
    await update(userRef, data);
  }

  // Get local device data
  async getLocalDevice(userId: string): Promise<LocalDevice | null> {
    const localDeviceRef = ref(database, `localDevices/${userId}`);
    const snapshot = await get(localDeviceRef);
    return snapshot.exists() ? snapshot.val() : null;
  }

  // Update local device data
  async updateLocalDevice(userId: string, updates: Partial<LocalDevice>): Promise<void> {
    const localDeviceRef = ref(database, `localDevices/${userId}`);
    await update(localDeviceRef, updates);
  }

  // Listen to local device changes
  subscribeToLocalDevice(userId: string, callback: (data: LocalDevice | null) => void) {
    const localDeviceRef = ref(database, `localDevices/${userId}`);
    return onValue(localDeviceRef, (snapshot) => {
      callback(snapshot.exists() ? snapshot.val() : null);
    });
  }

  // Claim a device
  async claimDevice(userId: string, deviceId: string, deviceName: string): Promise<void> {
    console.log('geyserService - Starting device claim process:', { userId, deviceId, deviceName });
    
    // Get user and device data in parallel
    const [userData, deviceData] = await Promise.all([
      this.getUserData(userId),
      this.getDeviceData(deviceId)
    ]);

    console.log('geyserService - Retrieved data:', { 
      userData: userData ? 'found' : 'not found', 
      deviceData: deviceData ? 'found' : 'not found' 
    });

    if (!userData) throw new Error('User not found');
    if (!deviceData) throw new Error('Device not found');

    console.log('geyserService - Validation checks:', {
      userClaimedDevice: userData.claimedDeviceId,
      deviceUserId: deviceData.userId,
      requestingUserId: userId
    });

    // Validation checks
    if (userData.claimedDeviceId && userData.claimedDeviceId !== deviceId) {
      throw new Error('You can only claim one device per account. Please unclaim your current device first.');
    }

    if (deviceData.userId && deviceData.userId !== userId) {
      throw new Error('Device is already claimed by another user');
    }

    if (deviceData.userId === userId) {
      console.log('geyserService - Device already claimed by this user');
      return; // Already claimed
    }

    console.log('geyserService - Performing device claim updates...');

    // Perform all updates in parallel
    await Promise.all([
      this.updateUserData(userId, { claimedDeviceId: deviceId }),
      this.updateDeviceData(deviceId, { userId }),
      set(ref(database, `localDevices/${userId}`), {
        name: deviceName,
        status: 'online',
        deviceId
      })
    ]);

    console.log('geyserService - Device claim completed successfully');
  }

  // Initialize a new device in the database
  async initializeDevice(deviceId: string, initialData?: Partial<DeviceData>): Promise<void> {
    const defaultData: DeviceData = {
      current_Temp: "25",
      target_Temp: 45,
      mode: 'electric',
      ...initialData
    };

    const deviceRef = ref(database, `DEVICES/${deviceId}`);
    await set(deviceRef, defaultData);
  }

  // Check if device exists
  async deviceExists(deviceId: string): Promise<boolean> {
    const deviceRef = ref(database, `DEVICES/${deviceId}`);
    const snapshot = await get(deviceRef);
    return snapshot.exists();
  }

  // Log actions for audit trail
  private async logAction(deviceId: string, userUID: string, action: string, data: any): Promise<void> {
    try {
      const logRef = ref(database, `logs/${deviceId}/${Date.now()}`);
      await set(logRef, {
        userUID,
        action,
        data,
        timestamp: Date.now()
      });
    } catch (error) {
      console.error('Error logging action:', error);
    }
  }

  // Unclaim a device (remove user association)
  async unclaimDevice(userId: string): Promise<void> {
    const userData = await this.getUserData(userId);
    if (!userData?.claimedDeviceId) {
      throw new Error('No device claimed by this user');
    }

    const deviceId = userData.claimedDeviceId;

    // Perform all updates in parallel
    await Promise.all([
      this.updateDeviceData(deviceId, { userId: undefined }),
      this.updateUserData(userId, { claimedDeviceId: undefined }),
      set(ref(database, `localDevices/${userId}`), null)
    ]);
  }

  // Get all devices for a user (if they have multiple)
  async getUserDevices(userId: string): Promise<DeviceData[]> {
    const devicesRef = ref(database, 'DEVICES');
    const snapshot = await get(devicesRef);
    const devices: DeviceData[] = [];

    if (snapshot.exists()) {
      const allDevices = snapshot.val();
      Object.keys(allDevices).forEach(deviceId => {
        const device = allDevices[deviceId];
        if (device.userId === userId) {
          devices.push({ ...device, deviceId });
        }
      });
    }

    return devices;
  }
}

export const geyserService = new GeyserService();