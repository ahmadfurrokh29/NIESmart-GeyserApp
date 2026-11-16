# Background Scheduling Implementation Guide

## Overview

This implementation provides a robust background scheduling system for the Smart IoT Geyser app that allows schedules to work even when the app is closed, similar to how alarm apps function. The system uses local notifications and background tasks to ensure reliable schedule execution.

## Key Features

✅ **Background Execution**: Schedules work even when the app is closed  
✅ **Local Notifications**: Uses device notifications to wake up the app  
✅ **Reliable Scheduling**: Multiple fallback mechanisms for schedule execution  
✅ **Battery Optimization**: Respects system battery optimization settings  
✅ **Cross-Platform**: Works on both iOS and Android  

## Architecture

### 1. Background Schedule Service (`backgroundScheduleService.ts`)
- **Primary Service**: Handles all background scheduling operations
- **Local Notifications**: Schedules notifications for start and end times
- **Background Tasks**: Registers background execution tasks
- **Schedule Execution**: Executes geyser control actions at scheduled times

### 2. Enhanced Schedule Service (`scheduleService.ts`)
- **Integration Layer**: Integrates with the background service
- **Legacy Support**: Maintains backward compatibility
- **Storage Management**: Handles schedule persistence
- **Background Initialization**: Sets up background tasks on app start

### 3. Enhanced Geyser Control Service (`geyserControlService.ts`)
- **Context Independence**: Works without React context in background
- **Direct Firebase Operations**: Executes geyser control directly
- **Device ID Management**: Maintains device ID for background operations
- **Error Handling**: Robust error handling for background execution

## How It Works

### 1. App Initialization
```typescript
// In app/_layout.tsx
useEffect(() => {
  const initializeBackgroundServices = async () => {
    const { scheduleService } = await import('../services/scheduleService');
    await scheduleService.initialize();
  };
  initializeBackgroundServices();
}, []);
```

### 2. Schedule Creation
When a schedule is created:
1. **Notification Scheduling**: Creates local notifications for start and end times
2. **Storage**: Saves schedule to AsyncStorage
3. **Background Registration**: Registers with system for background execution

### 3. Background Execution
At scheduled times:
1. **Notification Trigger**: System triggers local notification
2. **App Wake-up**: Notification wakes up the app (if needed)
3. **Action Execution**: Executes geyser control action
4. **Status Update**: Updates Firebase with new geyser state

### 4. Schedule Management
- **Enable/Disable**: Toggles schedule execution
- **Modification**: Updates existing schedules
- **Deletion**: Removes schedules and notifications
- **Bulk Operations**: Manage multiple schedules

## Implementation Details

### Local Notifications
```typescript
// Schedule start notification
await Notifications.scheduleNotificationAsync({
  content: {
    title: 'Geyser Schedule',
    body: `Time to turn on geyser: ${schedule.name} at ${schedule.temperature}°C`,
    data: { scheduleId: schedule.id, action: 'turnOn' },
  },
  trigger: {
    hour: scheduleTime.hour,
    minute: scheduleTime.minute,
    repeats: true, // Repeat daily
  },
});
```

### Background Task Registration
```typescript
TaskManager.defineTask(BACKGROUND_SCHEDULE_TASK, async () => {
  console.log('Background schedule task triggered');
  await this.checkAndExecuteSchedules();
  return { success: true };
});
```

### Device ID Management
```typescript
// Set device ID for background operations
geyserControlService.setDeviceId(deviceId);

// Store in AsyncStorage for background access
await AsyncStorage.setItem('@device_id', deviceId);
```

## Configuration

### App Permissions (app.json)
```json
{
  "android": {
    "permissions": [
      "SCHEDULE_EXACT_ALARM",
      "USE_EXACT_ALARM",
      "POST_NOTIFICATIONS",
      "FOREGROUND_SERVICE",
      "REQUEST_IGNORE_BATTERY_OPTIMIZATIONS"
    ]
  },
  "ios": {
    "infoPlist": {
      "UIBackgroundModes": [
        "background-fetch",
        "background-processing",
        "remote-notification"
      ]
    }
  }
}
```

### Notification Configuration
```typescript
await Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});
```

## Usage Examples

### Creating a Schedule
```typescript
const schedule = {
  id: Date.now(),
  name: 'Morning Shower',
  time: '07:00 AM',
  endTime: '08:00 AM',
  temperature: 45,
  duration: 60,
  enabled: true,
  icon: 'thermometer'
};

// Save and schedule
await scheduleService.saveSchedules([schedule]);
```

### Testing Background Execution
```typescript
// Create test schedule for 1 minute from now
const testSchedule = {
  id: Date.now(),
  name: 'Test Schedule',
  time: '1 minute from now',
  endTime: '5 minutes from now',
  temperature: 45,
  duration: 5,
  enabled: true,
  icon: 'thermometer'
};

await backgroundScheduleService.scheduleNotification(testSchedule);
```

### Manual Schedule Execution
```typescript
// Force check and execute schedules
await scheduleService.forceCheckSchedules();

// Get all scheduled notifications
const notifications = await backgroundScheduleService.getScheduledNotifications();
```

## Testing the System

### 1. Test Component
Use the `BackgroundScheduleTest` component to:
- Initialize the background service
- Create test schedules
- Monitor scheduled notifications
- Test manual execution

### 2. Testing Steps
1. **Initialize**: Start the background service
2. **Create Schedule**: Create a test schedule for 1-2 minutes from now
3. **Close App**: Close the app completely
4. **Wait**: Wait for the scheduled time
5. **Verify**: Check if the geyser was controlled as expected

### 3. Debug Information
- Check console logs for execution details
- Monitor notification scheduling
- Verify Firebase updates
- Check device state changes

## Troubleshooting

### Common Issues

#### 1. Notifications Not Working
- **Check Permissions**: Ensure notification permissions are granted
- **Battery Optimization**: Disable battery optimization for the app
- **System Settings**: Verify notification settings in system preferences

#### 2. Schedules Not Executing
- **Background Tasks**: Check if background tasks are registered
- **Device ID**: Verify device ID is properly set
- **Firebase Connection**: Ensure Firebase connectivity

#### 3. App Not Waking Up
- **Background Modes**: Verify background modes are configured
- **System Restrictions**: Check system-level background restrictions
- **Notification Triggers**: Ensure notification triggers are properly set

### Debug Commands
```typescript
// Check service status
console.log('Background service initialized:', backgroundScheduleService.isInitialized);

// Get scheduled notifications
const notifications = await backgroundScheduleService.getScheduledNotifications();
console.log('Scheduled notifications:', notifications);

// Force schedule check
await scheduleService.forceCheckSchedules();
```

## Best Practices

### 1. Schedule Management
- **Limit Schedules**: Avoid creating too many schedules
- **Reasonable Times**: Use realistic start/end times
- **Temperature Ranges**: Stay within safe temperature limits

### 2. Battery Optimization
- **Minimize Background Activity**: Only execute when necessary
- **Efficient Notifications**: Use appropriate notification frequencies
- **System Compliance**: Respect system battery optimization

### 3. Error Handling
- **Graceful Degradation**: Handle failures without crashing
- **Retry Mechanisms**: Implement retry logic for failed operations
- **User Feedback**: Provide clear feedback for schedule status

## Future Enhancements

### 1. Advanced Scheduling
- **Recurring Patterns**: Weekly/monthly schedules
- **Holiday Exceptions**: Skip schedules on specific dates
- **Weather Integration**: Adjust schedules based on weather

### 2. Smart Features
- **Usage Learning**: Adapt schedules based on user behavior
- **Energy Optimization**: Optimize for energy efficiency
- **Predictive Scheduling**: Anticipate user needs

### 3. Integration
- **Smart Home**: Connect with other smart home devices
- **Voice Control**: Voice-activated schedule management
- **Cloud Sync**: Sync schedules across devices

## Conclusion

This background scheduling implementation provides a robust, reliable solution for managing geyser schedules even when the app is closed. By using local notifications, background tasks, and proper system integration, it ensures that schedules execute reliably while respecting system resources and user preferences.

The system is designed to be:
- **Reliable**: Multiple fallback mechanisms
- **Efficient**: Minimal battery and resource usage
- **User-Friendly**: Clear feedback and easy management
- **Extensible**: Easy to add new features and integrations

For questions or issues, refer to the troubleshooting section or check the console logs for detailed execution information.
