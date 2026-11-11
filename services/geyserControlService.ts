import { useGeyser } from '../contexts/GeyserContext';
import { realtimeDbService } from './realtimeDbService';

class GeyserControlService {
  private geyserContext: ReturnType<typeof useGeyser> | null = null;
  private deviceId: string | null = null;

  setContext(context: ReturnType<typeof useGeyser>) {
    this.geyserContext = context;
  }

  // Set device ID for background operations
  setDeviceId(deviceId: string) {
    this.deviceId = deviceId;
  }

  // Get device ID from context or stored value
  private async getDeviceId(): Promise<string | null> {
    if (this.deviceId) return this.deviceId;
    
    // Try to get from AsyncStorage as fallback
    try {
      const AsyncStorage = await import('@react-native-async-storage/async-storage');
      const storedDeviceId = await AsyncStorage.default.getItem('@device_id');
      return storedDeviceId;
    } catch (error) {
      console.error('Error getting device ID from storage:', error);
      return null;
    }
  }

  // Helper function to normalize mode case - now accepts both formats
  private normalizeMode(mode: string): 'electric' | 'gas' | 'hybrid' {
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
    console.warn('GeyserControlService - Unknown mode format:', mode, 'falling back to electric');
    return 'electric';
  }

  async turnOnGeyser(temperature: number): Promise<void> {
    try {
      const deviceId = await this.getDeviceId();
      if (!deviceId) {
        throw new Error('Device ID not available');
      }

      // If context is available, use it
      if (this.geyserContext) {
        const deviceMode = this.geyserContext.device?.mode || 'electric';
        const normalizedMode = this.normalizeMode(deviceMode);
        await this.geyserContext.updateDeviceSettings(temperature, normalizedMode);
        await this.geyserContext.updateGeyserOnOff(true);
      } else {
        // Background execution - use direct Firebase operations
        await this.executeBackgroundGeyserControl(deviceId, true, temperature);
      }
      
      console.log('Geyser turned on with temperature:', temperature);
    } catch (error) {
      console.error('Error turning on geyser:', error);
      throw error;
    }
  }

  async turnOffGeyser(): Promise<void> {
    try {
      const deviceId = await this.getDeviceId();
      if (!deviceId) {
        throw new Error('Device ID not available');
      }

      // If context is available, use it
      if (this.geyserContext) {
        await this.geyserContext.updateGeyserOnOff(false);
      } else {
        // Background execution - use direct Firebase operations
        await this.executeBackgroundGeyserControl(deviceId, false);
      }
      
      console.log('Geyser turned off');
    } catch (error) {
      console.error('Error turning off geyser:', error);
      throw error;
    }
  }

  // Background execution method that doesn't depend on React context
  private async executeBackgroundGeyserControl(deviceId: string, turnOn: boolean, temperature?: number): Promise<void> {
    try {
      const updates: any = {
        isOn: turnOn,
      };

      if (turnOn && temperature !== undefined) {
        updates.target_Temp = temperature;
        updates.current_Temp = temperature.toString(); // Convert to string as per interface
      }

      // Update device data in Firebase using the correct method
      await realtimeDbService.updateDevice(deviceId, updates);
      
      console.log(`Background geyser control: ${turnOn ? 'ON' : 'OFF'}`, temperature ? `at ${temperature}°C` : '');
    } catch (error) {
      console.error('Error in background geyser control:', error);
      throw error;
    }
  }

  getCurrentTemperature(): number | null {
    if (!this.geyserContext?.device) {
      return null;
    }
    const temp = this.geyserContext.device.current_Temp;
    if (temp === undefined || temp === null) {
      return null;
    }
    const parsedTemp = parseInt(temp.toString());
    return isNaN(parsedTemp) ? null : parsedTemp;
  }

  isGeyserOn(): boolean {
    return this.geyserContext?.device?.isOn || false;
  }

  // Get device status from Firebase (for background operations)
  async getDeviceStatus(): Promise<any> {
    try {
      const deviceId = await this.getDeviceId();
      if (!deviceId) return null;
      
      return await realtimeDbService.getDevice(deviceId);
    } catch (error) {
      console.error('Error getting device status:', error);
      return null;
    }
  }
}

export const geyserControlService = new GeyserControlService();
