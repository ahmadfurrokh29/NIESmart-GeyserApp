/**
 * "Today's usage" estimate shown on the Home screen, stored on the phone.
 * (Moved here unchanged from the old scheduleService. It is still only an
 * estimate; see bug B10 in Understanding.md.)
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

const USAGE_TRACKING_KEY = '@geyser_usage_tracking';

export interface UsageTracking {
  totalTime: number; // hours
  lastReset: string; // ISO date string
  todayStart: string; // Date.toDateString()
}

function freshUsage(): UsageTracking {
  return { totalTime: 0, lastReset: new Date().toISOString(), todayStart: new Date().toDateString() };
}

class UsageService {
  async getUsageTracking(): Promise<UsageTracking> {
    try {
      const raw = await AsyncStorage.getItem(USAGE_TRACKING_KEY);
      const usage: UsageTracking | null = raw ? JSON.parse(raw) : null;
      if (usage && usage.todayStart === new Date().toDateString()) return usage;
      // First run, or a new day: start from zero.
      const reset = freshUsage();
      await AsyncStorage.setItem(USAGE_TRACKING_KEY, JSON.stringify(reset));
      return reset;
    } catch (error) {
      console.error('Error getting usage tracking:', error);
      return freshUsage();
    }
  }

  async updateUsageTracking(additionalHours: number): Promise<void> {
    try {
      const usage = await this.getUsageTracking();
      usage.totalTime += additionalHours;
      await AsyncStorage.setItem(USAGE_TRACKING_KEY, JSON.stringify(usage));
    } catch (error) {
      console.error('Error updating usage tracking:', error);
    }
  }
}

export const usageService = new UsageService();
