# Scheduling Integration Guide

## Overview

This guide explains how to integrate the new background scheduling system with your existing scheduling UI components. The new system automatically works with existing schedule creation and management interfaces.

## Automatic Integration

### 1. Existing Schedule Creation
Your current schedule creation UI will automatically work with the new background system:

```typescript
// Your existing schedule creation code
const newSchedule = {
  id: Date.now(),
  name: scheduleName,
  time: selectedTime,
  endTime: selectedEndTime,
  temperature: selectedTemperature,
  duration: selectedDuration,
  enabled: true,
  icon: selectedIcon
};

// This now automatically schedules background notifications
await scheduleService.saveSchedules([...existingSchedules, newSchedule]);
```

### 2. Schedule Management
All existing schedule management operations work seamlessly:

```typescript
// Enable/disable schedules
const updatedSchedules = schedules.map(s => 
  s.id === scheduleId ? { ...s, enabled: !s.enabled } : s
);
await scheduleService.saveSchedules(updatedSchedules);

// Delete schedules
const filteredSchedules = schedules.filter(s => s.id !== scheduleId);
await scheduleService.saveSchedules(filteredSchedules);

// Update schedules
const updatedSchedules = schedules.map(s => 
  s.id === scheduleId ? { ...s, ...updates } : s
);
await scheduleService.saveSchedules(updatedSchedules);
```

## Enhanced Features

### 1. Background Execution Status
You can now show users that their schedules will work in the background:

```typescript
import { backgroundScheduleService } from '../services/backgroundScheduleService';

const ScheduleStatusIndicator = () => {
  const [isBackgroundEnabled, setIsBackgroundEnabled] = useState(false);

  useEffect(() => {
    const checkBackgroundStatus = async () => {
      try {
        const notifications = await backgroundScheduleService.getScheduledNotifications();
        setIsBackgroundEnabled(notifications.length > 0);
      } catch (error) {
        console.error('Error checking background status:', error);
      }
    };
    
    checkBackgroundStatus();
  }, []);

  return (
    <View style={styles.statusContainer}>
      <Text style={styles.statusText}>
        {isBackgroundEnabled ? '✅ Background scheduling enabled' : '❌ Background scheduling disabled'}
      </Text>
      <Text style={styles.statusSubtext}>
        Your schedules will work even when the app is closed
      </Text>
    </View>
  );
};
```

### 2. Schedule Execution History
Track when schedules were executed:

```typescript
const ScheduleExecutionHistory = () => {
  const [executionHistory, setExecutionHistory] = useState([]);

  useEffect(() => {
    const loadExecutionHistory = async () => {
      try {
        // Load from AsyncStorage or Firebase
        const history = await AsyncStorage.getItem('@schedule_execution_history');
        setExecutionHistory(history ? JSON.parse(history) : []);
      } catch (error) {
        console.error('Error loading execution history:', error);
      }
    };
    
    loadExecutionHistory();
  }, []);

  return (
    <View style={styles.historyContainer}>
      <Text style={styles.historyTitle}>Recent Schedule Executions</Text>
      {executionHistory.map((execution, index) => (
        <View key={index} style={styles.historyItem}>
          <Text style={styles.historySchedule}>{execution.scheduleName}</Text>
          <Text style={styles.historyTime}>{execution.executionTime}</Text>
          <Text style={styles.historyAction}>{execution.action}</Text>
        </View>
      ))}
    </View>
  );
};
```

### 3. Real-time Schedule Status
Show real-time status of active schedules:

```typescript
const ActiveScheduleStatus = () => {
  const [activeSchedule, setActiveSchedule] = useState(null);

  useEffect(() => {
    const loadActiveSchedule = async () => {
      try {
        const active = await scheduleService.getCurrentActiveSchedule();
        setActiveSchedule(active);
      } catch (error) {
        console.error('Error loading active schedule:', error);
      }
    };
    
    loadActiveSchedule();
    
    // Refresh every minute
    const interval = setInterval(loadActiveSchedule, 60000);
    return () => clearInterval(interval);
  }, []);

  if (!activeSchedule) return null;

  return (
    <View style={styles.activeScheduleContainer}>
      <Text style={styles.activeScheduleTitle}>Currently Active</Text>
      <Text style={styles.activeScheduleName}>{activeSchedule.scheduleName}</Text>
      <Text style={styles.activeScheduleTime}>
        Ends at {activeSchedule.endTime}
      </Text>
      <Text style={styles.activeScheduleTemp}>
        Temperature: {activeSchedule.targetTemperature}°C
      </Text>
    </View>
  );
};
```

## UI Components

### 1. Schedule List with Background Status
```typescript
const ScheduleList = ({ schedules, onScheduleUpdate }) => {
  const [backgroundStatus, setBackgroundStatus] = useState({});

  useEffect(() => {
    const checkBackgroundStatus = async () => {
      const status = {};
      for (const schedule of schedules) {
        try {
          const notifications = await backgroundScheduleService.getScheduledNotifications();
          status[schedule.id] = notifications.some(n => 
            n.content.data?.scheduleId === schedule.id
          );
        } catch (error) {
          status[schedule.id] = false;
        }
      }
      setBackgroundStatus(status);
    };
    
    checkBackgroundStatus();
  }, [schedules]);

  return (
    <View style={styles.scheduleList}>
      {schedules.map(schedule => (
        <View key={schedule.id} style={styles.scheduleItem}>
          <View style={styles.scheduleInfo}>
            <Text style={styles.scheduleName}>{schedule.name}</Text>
            <Text style={styles.scheduleTime}>
              {schedule.time} - {schedule.endTime}
            </Text>
            <Text style={styles.scheduleTemp}>
              {schedule.temperature}°C
            </Text>
          </View>
          
          <View style={styles.scheduleStatus}>
            <View style={styles.statusIndicator}>
              <Text style={styles.statusText}>
                {schedule.enabled ? 'Enabled' : 'Disabled'}
              </Text>
              {backgroundStatus[schedule.id] && (
                <Text style={styles.backgroundStatus}>
                  ✅ Background
                </Text>
              )}
            </View>
            
            <Switch
              value={schedule.enabled}
              onValueChange={(enabled) => {
                const updatedSchedules = schedules.map(s =>
                  s.id === schedule.id ? { ...s, enabled } : s
                );
                onScheduleUpdate(updatedSchedules);
              }}
            />
          </View>
        </View>
      ))}
    </View>
  );
};
```

### 2. Schedule Creation with Background Confirmation
```typescript
const ScheduleCreationForm = ({ onSubmit }) => {
  const [formData, setFormData] = useState({
    name: '',
    time: '',
    endTime: '',
    temperature: 40,
    enabled: true
  });

  const handleSubmit = async () => {
    try {
      const newSchedule = {
        id: Date.now(),
        ...formData,
        duration: 60,
        icon: 'thermometer'
      };
      
      await onSubmit(newSchedule);
      
      // Show background confirmation
      Alert.alert(
        'Schedule Created',
        'Your schedule has been created and will work even when the app is closed!',
        [{ text: 'OK' }]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to create schedule');
    }
  };

  return (
    <View style={styles.formContainer}>
      {/* Your existing form fields */}
      
      <View style={styles.backgroundInfo}>
        <Text style={styles.backgroundTitle}>Background Execution</Text>
        <Text style={styles.backgroundDescription}>
          This schedule will automatically execute even when the app is closed, 
          just like an alarm clock.
        </Text>
      </View>
      
      <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
        <Text style={styles.submitButtonText}>Create Schedule</Text>
      </TouchableOpacity>
    </View>
  );
};
```

## Testing Integration

### 1. Test Schedule Creation
```typescript
// Test creating a schedule
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

await scheduleService.saveSchedules([testSchedule]);

// Verify background notification was created
const notifications = await backgroundScheduleService.getScheduledNotifications();
console.log('Scheduled notifications:', notifications);
```

### 2. Test Background Execution
```typescript
// Create a schedule for 1 minute from now
const now = new Date();
const testTime = new Date(now.getTime() + 60000);
const timeString = testTime.toLocaleTimeString('en-US', { 
  hour: 'numeric', 
  minute: '2-digit', 
  hour12: true 
});

const testSchedule = {
  id: Date.now(),
  name: 'Background Test',
  time: timeString,
  endTime: new Date(testTime.getTime() + 300000).toLocaleTimeString('en-US', { 
    hour: 'numeric', 
    minute: '2-digit', 
    hour12: true 
  }),
  temperature: 45,
  duration: 5,
  enabled: true,
  icon: 'thermometer'
};

await scheduleService.saveSchedules([testSchedule]);

// Close the app and wait for execution
console.log(`Test schedule created for ${timeString}. Close the app to test background execution.`);
```

## Migration Notes

### 1. Existing Schedules
- All existing schedules will automatically work with the new system
- No data migration is required
- Existing schedule data remains unchanged

### 2. Backward Compatibility
- All existing schedule management functions continue to work
- No changes required to existing UI components
- New features are additive, not breaking

### 3. Performance Impact
- Minimal performance impact on existing functionality
- Background operations are optimized for battery life
- UI responsiveness is maintained

## Conclusion

The new background scheduling system integrates seamlessly with your existing scheduling UI. Simply continue using your current schedule creation and management interfaces - they will automatically benefit from background execution capabilities.

Key benefits:
- **No UI Changes Required**: Existing interfaces work as-is
- **Automatic Background Support**: Schedules work when app is closed
- **Enhanced User Experience**: Users can rely on schedules like alarm clocks
- **Improved Reliability**: Multiple fallback mechanisms ensure execution

For testing and debugging, use the provided test components and check the console logs for detailed execution information.
