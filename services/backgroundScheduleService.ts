import AsyncStorage from '@react-native-async-storage/async-storage';
import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';
import { geyserControlService } from './geyserControlService';

const BACKGROUND_SCHEDULE_TASK = 'BACKGROUND_SCHEDULE_EXECUTION';
const SCHEDULES_STORAGE_KEY = '@geyser_schedules';
const ACTIVE_SCHEDULE_KEY = '@active_schedule';
const DEVICE_ID_KEY = '@device_id';
const LAST_CHECK_KEY = '@last_schedule_check';

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

class BackgroundScheduleService {
  private isInitialized = false;
  private checkInterval: any | null = null;

  // Initialize the background scheduling system
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      console.log('Initializing background schedule service...');
      
      // Register background task
      await this.registerBackgroundTask();
      
      // Start continuous schedule checking
      this.startScheduleChecking();
      
      this.isInitialized = true;
      console.log('Background schedule service initialized successfully');
    } catch (error) {
      console.error('Error initializing background schedule service:', error);
    }
  }

  // Register background task
  private async registerBackgroundTask(): Promise<void> {
    try {
      // Define the background task
      TaskManager.defineTask(BACKGROUND_SCHEDULE_TASK, async () => {
        console.log('Background schedule task triggered');
        await this.checkAndExecuteSchedules();
        return BackgroundFetch.BackgroundFetchResult.NewData;
      });

      // Register the background fetch
      await BackgroundFetch.registerTaskAsync(BACKGROUND_SCHEDULE_TASK, {
        minimumInterval: 60, // Check every minute
        stopOnTerminate: false,
        startOnBoot: true,
      });

      console.log('Background task registered successfully');
    } catch (error) {
      console.error('Error registering background task:', error);
    }
  }

  // Start continuous schedule checking
  private startScheduleChecking(): void {
    console.log('Starting continuous schedule checking...');
    
    // Check every minute for precise timing
    this.checkInterval = setInterval(async () => {
      await this.checkAndExecuteSchedules();
    }, 60000); // 1 minute
    
    // Also check immediately
    setTimeout(async () => {
      await this.checkAndExecuteSchedules();
    }, 1000);
  }

  // Stop schedule checking
  stopScheduleChecking(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
      console.log('Schedule checking stopped');
    }
  }

  // Check and execute schedules
  async checkAndExecuteSchedules(): Promise<void> {
    try {
      const schedules = await this.getSchedules();
      const activeSchedule = await this.getActiveSchedule();
      const now = new Date();
      
      // Format current time to match the schedule time format
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      const currentPeriod = currentHour >= 12 ? 'PM' : 'AM';
      const currentTime = `${(currentHour % 12 || 12).toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')} ${currentPeriod}`;

      console.log('Background schedule check - Current time:', currentTime);
      console.log('Found schedules:', schedules.length);

      // Check if active schedule should end
      if (activeSchedule && activeSchedule.isActive) {
        if (activeSchedule.endTime === currentTime) {
          console.log('Turning off geyser - schedule end time reached');
          await this.executeScheduleAction('turnOff', activeSchedule.scheduleId);
          await this.clearActiveSchedule();
          
          // Log execution
          await this.logScheduleExecution('turnOff', activeSchedule.scheduleId, 'Schedule end time reached');
          return;
        }
      }

      // Check for new schedules to start
      for (const schedule of schedules) {
        if (!schedule.enabled) continue;

        if (schedule.time === currentTime) {
          console.log('Starting schedule:', schedule.name);
          await this.executeScheduleAction('turnOn', schedule.id, schedule.temperature);
          await this.startSchedule(schedule);
          
          // Log execution
          await this.logScheduleExecution('turnOn', schedule.id, schedule.name);
        }
      }

      // Update last check time
      await AsyncStorage.setItem(LAST_CHECK_KEY, now.toISOString());
    } catch (error) {
      console.error('Error checking schedules:', error);
    }
  }

  // Execute schedule action
  private async executeScheduleAction(action: 'turnOn' | 'turnOff', scheduleId: number, temperature?: number): Promise<void> {
    try {
      if (action === 'turnOn' && temperature !== undefined) {
        await geyserControlService.turnOnGeyser(temperature);
      } else if (action === 'turnOff') {
        await geyserControlService.turnOffGeyser();
      }
      console.log(`Schedule action executed: ${action} for schedule ${scheduleId}`);
    } catch (error) {
      console.error(`Error executing schedule action ${action}:`, error);
    }
  }

  // Start a schedule
  private async startSchedule(schedule: Schedule): Promise<void> {
    try {
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

  // Get schedules from storage
  private async getSchedules(): Promise<Schedule[]> {
    try {
      const schedulesJson = await AsyncStorage.getItem(SCHEDULES_STORAGE_KEY);
      return schedulesJson ? JSON.parse(schedulesJson) : [];
    } catch (error) {
      console.error('Error getting schedules:', error);
      return [];
    }
  }

  // Get active schedule
  private async getActiveSchedule(): Promise<ActiveSchedule | null> {
    try {
      const activeScheduleJson = await AsyncStorage.getItem(ACTIVE_SCHEDULE_KEY);
      return activeScheduleJson ? JSON.parse(activeScheduleJson) : null;
    } catch (error) {
      console.error('Error getting active schedule:', error);
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

  // Clear active schedule
  private async clearActiveSchedule(): Promise<void> {
    try {
      await AsyncStorage.removeItem(ACTIVE_SCHEDULE_KEY);
    } catch (error) {
      console.error('Error clearing active schedule:', error);
    }
  }

  // Log schedule execution for debugging
  private async logScheduleExecution(action: string, scheduleId: number, scheduleName: string): Promise<void> {
    try {
      const executionLog = {
        action,
        scheduleId,
        scheduleName,
        executionTime: new Date().toISOString(),
        success: true
      };

      const existingLogs = await AsyncStorage.getItem('@schedule_execution_log');
      const logs = existingLogs ? JSON.parse(existingLogs) : [];
      logs.unshift(executionLog);
      
      // Keep only last 100 executions
      if (logs.length > 100) {
        logs.splice(100);
      }
      
      await AsyncStorage.setItem('@schedule_execution_log', JSON.stringify(logs));
      console.log('Schedule execution logged:', executionLog);
    } catch (error) {
      console.error('Error logging schedule execution:', error);
    }
  }

  // Get execution log
  async getExecutionLog(): Promise<any[]> {
    try {
      const logs = await AsyncStorage.getItem('@schedule_execution_log');
      return logs ? JSON.parse(logs) : [];
    } catch (error) {
      console.error('Error getting execution log:', error);
      return [];
    }
  }

  // Get last check time
  async getLastCheckTime(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(LAST_CHECK_KEY);
    } catch (error) {
      console.error('Error getting last check time:', error);
      return null;
    }
  }

  // Get service status
  getServiceStatus(): { isInitialized: boolean; isChecking: boolean; lastCheck: string | null } {
    return {
      isInitialized: this.isInitialized,
      isChecking: this.checkInterval !== null,
      lastCheck: null // Will be populated by getLastCheckTime()
    };
  }

  // Force check schedules (for manual testing)
  async forceCheckSchedules(): Promise<void> {
    console.log('Force checking schedules...');
    await this.checkAndExecuteSchedules();
  }

  // Get all schedules (for compatibility)
  async getAllSchedules(): Promise<Schedule[]> {
    return await this.getSchedules();
  }

  // Schedule all enabled schedules (for compatibility)
  async scheduleAllSchedules(): Promise<void> {
    try {
      const schedules = await this.getSchedules();
      console.log(`Found ${schedules.filter(s => s.enabled).length} enabled schedules`);
      
      // Start checking if not already started
      if (!this.checkInterval) {
        this.startScheduleChecking();
      }
    } catch (error) {
      console.error('Error scheduling all schedules:', error);
    }
  }

  // Cancel all schedules (for compatibility)
  async cancelAllSchedules(): Promise<void> {
    try {
      this.stopScheduleChecking();
      await this.clearActiveSchedule();
      console.log('All schedules cancelled');
    } catch (error) {
      console.error('Error cancelling all schedules:', error);
    }
  }

  // Get scheduled notifications (for compatibility - returns empty array since we don't use notifications)
  async getScheduledNotifications(): Promise<any[]> {
    try {
      // Return mock data for compatibility
      const schedules = await this.getSchedules();
      const activeSchedule = await this.getActiveSchedule();
      
      const mockNotifications = [];
      
      // Add start notifications for enabled schedules
      for (const schedule of schedules) {
        if (schedule.enabled) {
          mockNotifications.push({
            content: {
              title: 'Geyser Schedule',
              body: `Time to turn on geyser: ${schedule.name} at ${schedule.temperature}°C`,
              data: { scheduleId: schedule.id, action: 'turnOn' },
            },
            trigger: { time: schedule.time, repeats: true }
          });
        }
      }
      
      // Add end notification for active schedule
      if (activeSchedule && activeSchedule.isActive) {
        mockNotifications.push({
          content: {
            title: 'Geyser Schedule End',
            body: `Time to turn off geyser: ${activeSchedule.scheduleId}`,
            data: { scheduleId: activeSchedule.scheduleId, action: 'turnOff' },
          },
          trigger: { time: activeSchedule.endTime, repeats: false }
        });
      }
      
      return mockNotifications;
    } catch (error) {
      console.error('Error getting scheduled notifications:', error);
      return [];
    }
  }
}

export const backgroundScheduleService = new BackgroundScheduleService();
