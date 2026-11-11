import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { AnimatedCircularProgress } from "react-native-circular-progress";

type ThermostatDialProps = {
  temp: number; // temperature between 30–100 (10-degree gaps only)
};

const ThermostatDial = ({ temp }: ThermostatDialProps) => {
  // Convert temperature to fill % (30°C = 0%, 100°C = 100%)
  const fill = ((temp - 30) / 70) * 100;

  // Dynamically select ring + text color based on temp
  const getColor = () => {
    if (temp < 40) return "#10b981"; // green-500
    if (temp < 60) return "#facc15"; // yellow-400
    return "#ef4444";               // red-500
  };

  return (
    <View style={styles.container}>
      <AnimatedCircularProgress
        size={250}
        width={18}
        fill={fill}
        tintColor={getColor()}
        backgroundColor="#e5e7eb"
        rotation={0}
        lineCap="round"
      >
        {() => (
          <View style={styles.centerText}>
            <Text style={[styles.tempText, { color: getColor() }]}>
              {temp}°C
            </Text>
            <Text style={styles.label}>Desired Temp</Text>
          </View>
        )}
      </AnimatedCircularProgress>
    </View>
  );
};

export default ThermostatDial;

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    marginBottom: 32,
  },
  centerText: {
    alignItems: "center",
    justifyContent: "center",
  },
  tempText: {
    fontSize: 48,
    fontWeight: "bold",
  },
  label: {
    fontSize: 14,
    color: "#6b7280", // gray-500
    marginTop: 4,
  },
});
