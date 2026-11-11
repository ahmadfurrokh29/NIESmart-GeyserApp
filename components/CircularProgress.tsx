import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';
import { theme } from '../constants/theme';

interface ProgressSegment {
  value: number;
  color: string;
  label?: string;
}

interface CircularProgressProps {
  segments: ProgressSegment[];
  size?: number;
  strokeWidth?: number;
  centerContent?: React.ReactNode;
  showLabels?: boolean;
}

export const CircularProgress: React.FC<CircularProgressProps> = ({
  segments,
  size = 120,
  strokeWidth = 8,
  centerContent,
  showLabels = false,
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;

  const total = segments.reduce((sum, segment) => sum + segment.value, 0);
  
  let currentOffset = 0;

  return (
    <View style={styles.container}>
      <View style={[styles.chartContainer, { width: size, height: size }]}>
        <Svg width={size} height={size}>
          <G rotation="-90" origin={`${center}, ${center}`}>
            {segments.map((segment, index) => {
              const percentage = segment.value / total;
              const strokeDasharray = circumference * percentage;
              const strokeDashoffset = currentOffset;
              
              currentOffset += strokeDasharray;

              return (
                <Circle
                  key={index}
                  cx={center}
                  cy={center}
                  r={radius}
                  fill="none"
                  stroke={segment.color}
                  strokeWidth={strokeWidth}
                  strokeDasharray={`${strokeDasharray} ${circumference}`}
                  strokeDashoffset={-strokeDashoffset}
                  strokeLinecap="round"
                />
              );
            })}
          </G>
        </Svg>
        
        {centerContent && (
          <View style={styles.centerContent}>
            {centerContent}
          </View>
        )}
      </View>

      {showLabels && (
        <View style={styles.labelsContainer}>
          {segments.map((segment, index) => (
            segment.label && (
              <View key={index} style={styles.labelItem}>
                <View style={[styles.colorDot, { backgroundColor: segment.color }]} />
                <Text style={styles.labelText}>{segment.label}</Text>
                <Text style={styles.labelValue}>{Math.round((segment.value / total) * 100)}%</Text>
              </View>
            )
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  chartContainer: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerContent: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  labelsContainer: {
    marginTop: theme.spacing.md,
    width: '100%',
  },
  labelItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  colorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: theme.spacing.sm,
  },
  labelText: {
    flex: 1,
    color: theme.colors.textSecondary,
    fontSize: 14,
  },
  labelValue: {
    color: theme.colors.text,
    fontSize: 14,
    fontWeight: '600',
  },
});