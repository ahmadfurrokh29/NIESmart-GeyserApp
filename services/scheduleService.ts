import AsyncStorage from '@react-native-async-storage/async-storage';
import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';
import { backgroundScheduleService } from './backgroundScheduleService';
import { geyserControlService } from './geyserControlService';

const SCHEDULES_STORAGE_KEY = '@geyser_schedules';
const BACKGROUND_FETCH_TASK = 'BACKGROUND_SCHEDULE_CHECK';
const ACTIVE_SCHEDULE_KEY = '@active_schedule';
const USAGE_TRACKING_KEY = '@geyser_usage_tracking';

export interface Schedule {
  id: number;
  name: string;
  time: string;
  endTime: string;
  temperature: number;
  duration: number;
  enabled: boolean;
  icon: string;
}

export interface ActiveSchedule {
  scheduleId: number;
  startTime: string;
  endTime: string;
  targetTemperature: number;
  isActive: boolean;
}

interface UsageTracking {
  totalTime: number; // in hours
  lastReset: string; // ISO date string
  todayStart: string; // ISO date string
}

class ScheduleService {
  private isInitialized = false;

  // Initialize the complete scheduling system
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      console.log('Initializing complete schedule system...');
      
      // Initialize background schedule service first
      await backgroundScheduleService.initialize();
      
      // Initialize legacy background fetch as backup
      await this.initializeBackgroundTask();
      
      // Schedule all existing schedules
      await this.scheduleAllExistingSchedules();
      
      this.isInitialized = true;
      console.log('Complete schedule system initialized successfully');
    } catch (error) {
      console.error('Error initializing complete schedule system:', error);
    }
  }

  // Save schedules to AsyncStorage and schedule notifications
  async saveSchedules(schedules: Schedule[]): Promise<void> {
    try {
      await AsyncStorage.setItem(SCHEDULES_STORAGE_KEY, JSON.stringify(schedules));
      console.log('Schedules saved successfully');
      
      // Schedule notifications for all enabled schedules
      await this.scheduleAllSchedules();
    } catch (error) {
      console.error('Error saving schedules:', error);
      throw error;
    }
  }

  // Get schedules from AsyncStorage
  async getSchedules(): Promise<Schedule[]> {
    try {
      const schedulesJson = await AsyncStorage.getItem(SCHEDULES_STORAGE_KEY);
      return schedulesJson ? JSON.parse(schedulesJson) : [];
    } catch (error) {
      console.error('Error getting schedules:', error);
      return [];
    }
  }

  // Schedule all enabled schedules using background service
  async scheduleAllSchedules(): Promise<void> {
    try {
      await backgroundScheduleService.scheduleAllSchedules();
    } catch (error) {
      console.error('Error scheduling all schedules:', error);
    }
  }

  // Cancel all scheduled notifications
  async cancelAllSchedules(): Promise<void> {
    try {
      await backgroundScheduleService.cancelAllNotifications();
    } catch (error) {
      console.error('Error cancelling all schedules:', error);
    }
  }

  // Schedule all existing schedules from storage
  private async scheduleAllExistingSchedules(): Promise<void> {
    try {
      const schedules = await this.getSchedules();
      if (schedules.length > 0) {
        await this.scheduleAllSchedules();
        console.log(`Scheduled ${schedules.filter(s => s.enabled).length} existing schedules`);
      }
    } catch (error) {
      console.error('Error scheduling existing schedules:', error);
    }
  }

  // Initialize background task for schedule checking (legacy backup)
  async initializeBackgroundTask() {
    try {
      console.log('Initializing legacy background task...');
      
      // Register the task
      TaskManager.defineTask(BACKGROUND_FETCH_TASK, async () => {
        console.log('Legacy background task triggered');
        await this.checkAndExecuteSchedules();
        return BackgroundFetch.BackgroundFetchResult.NewData;
      });

      // Register the background fetch
      await BackgroundFetch.registerTaskAsync(BACKGROUND_FETCH_TASK, {
        minimumInterval: 60, // Check every minute
        stopOnTerminate: false,
        startOnBoot: true,
      });

      console.log('Legacy background task registered successfully');

      // Start immediate checking
      this.startScheduleChecking();
    } catch (error) {
      console.error('Error initializing legacy background task:', error);
    }
  }

  // Start continuous schedule checking (legacy method)
  private startScheduleChecking() {
    console.log('Starting legacy schedule checking...');
    // Check every 2 minutes instead of every minute to prevent rapid cycling
    setInterval(async () => {
      console.log('Running legacy scheduled check...');
      await this.checkAndExecuteSchedules();
    }, 120000); // 2 minutes
    
    // Also check immediately
    setTimeout(async () => {
      console.log('Running legacy immediate check...');
      await this.checkAndExecuteSchedules();
    }, 1000);
  }

  // Check and execute schedules (legacy method - now delegates to background service)
  async checkAndExecuteSchedules() {
    try {
      // Delegate to background service for better reliability
      await backgroundScheduleService.checkAndExecuteSchedules();
    } catch (error) {
      console.error('Error in legacy schedule checking:', error);
    }
  }

  // Start a schedule
  private async startSchedule(schedule: Schedule) {
    try {
      console.log('Starting schedule:', schedule.name);
      
      // Turn on geyser and set temperature
      await geyserControlService.turnOnGeyser(schedule.temperature);

      // Save active schedule
      const activeSchedule: ActiveSchedule = {
        scheduleId: schedule.id,
        startTime: schedule.time,
        endTime: schedule.endTime,
        targetTemperature: schedule.temperature,
        isActive: true
      };
      await this.saveActiveSchedule(activeSchedule);

      console.log('Schedule started successfully:', schedule.name);
    } catch (error) {
      console.error('Error starting schedule:', error);
    }
  }

  // End active schedule
  async endActiveSchedule(): Promise<void> {
    try {
      console.log('Ending active schedule');
      await geyserControlService.turnOffGeyser();
      await this.clearActiveSchedule();
    } catch (error) {
      console.error('Error ending active schedule:', error);
    }
  }

  // Get current active schedule
  async getCurrentActiveSchedule(): Promise<ActiveSchedule | null> {
    try {
      const activeScheduleJson = await AsyncStorage.getItem(ACTIVE_SCHEDULE_KEY);
      return activeScheduleJson ? JSON.parse(activeScheduleJson) : null;
    } catch (error) {
      console.error('Error getting active schedule:', error);
      return null;
    }
  }

  // Clear active schedule
  async clearActiveSchedule(): Promise<void> {
    try {
      await AsyncStorage.removeItem(ACTIVE_SCHEDULE_KEY);
    } catch (error) {
      console.error('Error clearing active schedule:', error);
    }
  }

  // Force check schedules (for manual testing)
  async forceCheckSchedules(): Promise<void> {
    console.log('Force checking schedules...');
    await backgroundScheduleService.checkAndExecuteSchedules();
  }

  // Get usage tracking data
  async getUsageTracking(): Promise<UsageTracking> {
    try {
      const usageJson = await AsyncStorage.getItem(USAGE_TRACKING_KEY);
      if (usageJson) {
        const usage = JSON.parse(usageJson);
        // Check if we need to reset for a new day
        const today = new Date().toDateString();
        if (usage.todayStart !== today) {
          // Reset for new day
          const newUsage: UsageTracking = {
            totalTime: 0,
            lastReset: new Date().toISOString(),
            todayStart: today,
          };
          await AsyncStorage.setItem(USAGE_TRACKING_KEY, JSON.stringify(newUsage));
          return newUsage;
        }
        return usage;
      }
      
      // Initialize usage tracking
      const today = new Date().toDateString();
      const initialUsage: UsageTracking = {
        totalTime: 0,
        lastReset: new Date().toISOString(),
        todayStart: today,
      };
      await AsyncStorage.setItem(USAGE_TRACKING_KEY, JSON.stringify(initialUsage));
      return initialUsage;
    } catch (error) {
      console.error('Error getting usage tracking:', error);
      return {
        totalTime: 0,
        lastReset: new Date().toISOString(),
        todayStart: new Date().toDateString(),
      };
    }
  }

  // Update usage tracking
  async updateUsageTracking(additionalTime: number): Promise<void> {
    try {
      const usage = await this.getUsageTracking();
      usage.totalTime += additionalTime;
      await AsyncStorage.setItem(USAGE_TRACKING_KEY, JSON.stringify(usage));
    } catch (error) {
      console.error('Error updating usage tracking:', error);
    }
  }

  // Helper function to get device ID from AsyncStorage
  private async getDeviceId(): Promise<string | null> {
    try {
      const deviceId = await AsyncStorage.getItem('@device_id');
      return deviceId;
    } catch (error) {
      console.error('Error getting device ID:', error);
      return null;
    }
  }

  // Save active schedule
  private async saveActiveSchedule(activeSchedule: ActiveSchedule): Promise<void> {
    try {
      await AsyncStorage.setItem(ACTIVE_SCHEDULE_KEY, JSON.stringify(activeSchedule));
    } catch (error) {
      console.error('Error saving active schedule:', error);
    }
  }

  // Get active schedule (for internal use)
  private async getActiveSchedule(): Promise<ActiveSchedule | null> {
    try {
      const activeScheduleJson = await AsyncStorage.getItem(ACTIVE_SCHEDULE_KEY);
      return activeScheduleJson ? JSON.parse(activeScheduleJson) : null;
    } catch (error) {
      console.error('Error getting active schedule:', error);
      return null;
    }
  }

  // Get all scheduled notifications (delegate to background service)
  async getScheduledNotifications() {
    try {
      return await backgroundScheduleService.getScheduledNotifications();
    } catch (error) {
      console.error('Error getting scheduled notifications:', error);
      return [];
    }
  }
}

export const scheduleService = new ScheduleService();
