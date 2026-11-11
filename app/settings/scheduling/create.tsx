import DateTimePicker from '@react-native-community/datetimepicker';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    Alert,
    Button,
    Platform,
    StyleSheet,
    Switch,
    Text,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const CreateScheduleScreen = () => {
  const [enabled, setEnabled] = useState(true);
  const [startTime, setStartTime] = useState(new Date());
  const [endTime, setEndTime] = useState(new Date());
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const router = useRouter();

  const onChangeStart = (event: any, selectedDate?: Date) => {
    setShowStartPicker(false);
    if (selectedDate) setStartTime(selectedDate);
  };

  const onChangeEnd = (event: any, selectedDate?: Date) => {
    setShowEndPicker(false);
    if (selectedDate) setEndTime(selectedDate);
  };

  const handleSave = () => {
    if (!enabled) {
      Alert.alert('Warning', 'Enable scheduling to save');
      return;
    }

    Alert.alert('Success', 'Schedule saved!');
    // Future: Save to storage or cloud here
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Create Schedule</Text>

      <View style={styles.row}>
        <Text style={styles.label}>Enable</Text>
        <Switch
          value={enabled}
          onValueChange={setEnabled}
          trackColor={{ true: '#fb923c', false: '#d6d3d1' }}
          thumbColor={enabled ? '#7c2d12' : '#a8a29e'}
        />
      </View>

      <View style={styles.row}>
        <Text style={styles.label}>Start Time</Text>
        <Button
          title={startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          onPress={() => setShowStartPicker(true)}
          color="#ea580c"
        />
      </View>

      <View style={styles.row}>
        <Text style={styles.label}>End Time</Text>
        <Button
          title={endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          onPress={() => setShowEndPicker(true)}
          color="#ea580c"
        />
      </View>

      <View style={styles.saveBtn}>
        <Button title="Save Schedule" onPress={handleSave} color="#c2410c" />
      </View>

      {showStartPicker && (
        <DateTimePicker
          value={startTime}
          mode="time"
          is24Hour={true}
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={onChangeStart}
        />
      )}

      {showEndPicker && (
        <DateTimePicker
          value={endTime}
          mode="time"
          is24Hour={true}
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={onChangeEnd}
        />
      )}
    </SafeAreaView>
  );
};

export default CreateScheduleScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff7ed',
    padding: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#7c2d12',
    marginBottom: 24,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    color: '#7c2d12',
  },
  saveBtn: {
    marginTop: 32,
    alignItems: 'center',
  },
});
