import { get, off, onValue, ref, set, update } from 'firebase/database';
import { database } from '../config/firebase';

export interface UserData {
  email: string;
  phone: string;
  displayName: string;
  claimedDeviceId?: string;
}

export interface DeviceData {
  current_Temp: string;
  target_Temp: number;
  mode: 'electric' | 'gas' | 'hybrid';
  isOn?: boolean;
  userId?: string;
}

export interface LocalDevice {
  name: string;
  status: string;
  deviceId: string;
}

class RealtimeDbService {
  // Get device data
  async getDevice(deviceId: string): Promise<DeviceData | null> {
    try {
      const deviceRef = ref(database, `DEVICES/${deviceId}`);
      const snapshot = await get(deviceRef);
      return snapshot.exists() ? snapshot.val() : null;
    } catch (error) {
      console.error('Error getting device:', error);
      throw error;
    }
  }

  // Update device data
  async updateDevice(deviceId: string, updates: Partial<DeviceData>): Promise<void> {
    try {
      const deviceRef = ref(database, `DEVICES/${deviceId}`);
      await update(deviceRef, updates);
    } catch (error) {
      console.error('Error updating device:', error);
      throw error;
    }
  }

  // Set device data
  async setDevice(deviceId: string, deviceData: DeviceData): Promise<void> {
    try {
      const deviceRef = ref(database, `DEVICES/${deviceId}`);
      await set(deviceRef, deviceData);
    } catch (error) {
      console.error('Error setting device:', error);
      throw error;
    }
  }

  // Listen to device changes
  onDeviceChange(deviceId: string, callback: (data: DeviceData | null) => void): () => void {
    const deviceRef = ref(database, `DEVICES/${deviceId}`);
    const unsubscribe = onValue(deviceRef, (snapshot) => {
      const data = snapshot.exists() ? snapshot.val() : null;
      callback(data);
    });
    return unsubscribe;
  }

  // Device control operations
  async setTemperature(deviceId: string, temperature: number): Promise<void> {
    await this.updateDevice(deviceId, {
      target_Temp: temperature
    });
  }

  async setMode(deviceId: string, mode: 'electric' | 'gas' | 'hybrid'): Promise<void> {
    await this.updateDevice(deviceId, {
      mode
    });
  }

  async setPowerState(deviceId: string, isOn: boolean): Promise<void> {
    await this.updateDevice(deviceId, {
      isOn
    });
  }

  // Local device operations
  async getLocalDevice(userId: string): Promise<LocalDevice | null> {
    const localDeviceRef = ref(database, `localDevices/${userId}`);
    const snapshot = await get(localDeviceRef);
    return snapshot.exists() ? snapshot.val() : null;
  }

  async updateLocalDevice(userId: string, updates: Partial<LocalDevice>): Promise<void> {
    const localDeviceRef = ref(database, `localDevices/${userId}`);
    await update(localDeviceRef, updates);
  }

  async createLocalDevice(userId: string, deviceData: LocalDevice): Promise<void> {
    const localDeviceRef = ref(database, `localDevices/${userId}`);
    await set(localDeviceRef, deviceData);
  }

  // Listen to local device changes
  subscribeToLocalDevice(userId: string, callback: (deviceData: LocalDevice | null) => void): () => void {
    const localDeviceRef = ref(database, `localDevices/${userId}`);
    const unsubscribe = onValue(localDeviceRef, (snapshot) => {
      callback(snapshot.exists() ? snapshot.val() : null);
    });
    return () => off(localDeviceRef, 'value', unsubscribe);
  }

  // Utility functions
  async checkDeviceExists(deviceId: string): Promise<boolean> {
    const deviceRef = ref(database, `DEVICES/${deviceId}`);
    const snapshot = await get(deviceRef);
    return snapshot.exists();
  }

  // User operations
  async claimDevice(deviceId: string, userId: string): Promise<void> {
    await this.updateDevice(deviceId, {
      userId
    });
  }

  async unclaimDevice(deviceId: string): Promise<void> {
    await this.updateDevice(deviceId, {
      userId: undefined
    });
  }
}

export const realtimeDbService = new RealtimeDbService();