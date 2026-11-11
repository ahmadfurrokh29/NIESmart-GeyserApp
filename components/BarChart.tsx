import React from 'react';
import { Dimensions, StyleSheet, Text, View } from 'react-native';
import { theme } from '../constants/theme';

interface BarData {
  label: string;
  value: number;
  color?: string;
}

interface BarChartProps {
  data: BarData[];
  height?: number;
  showValues?: boolean;
  maxValue?: number;
}

export const BarChart: React.FC<BarChartProps> = ({
  data,
  height = 120,
  showValues = true,
  maxValue,
}) => {
  const screenWidth = Dimensions.get('window').width;
  const chartWidth = screenWidth - theme.spacing.xl * 2;
  const barWidth = (chartWidth - theme.spacing.sm * (data.length - 1)) / data.length;
  
  const max = maxValue || Math.max(...data.map(item => item.value));

  return (
    <View style={styles.container}>
      <View style={[styles.chartContainer, { height }]}>
        {data.map((item, index) => {
          const barHeight = (item.value / max) * height;
          const barColor = item.color || theme.colors.primary;
          
          return (
            <View key={index} style={styles.barContainer}>
              <View style={styles.barWrapper}>
                {showValues && (
                  <Text style={styles.valueText}>
                    ${item.value.toLocaleString()}
                  </Text>
                )}
                <View
                  style={[
                    styles.bar,
                    {
                      height: barHeight,
                      width: barWidth,
                      backgroundColor: barColor,
                    },
                  ]}
                />
              </View>
              <Text style={styles.labelText}>{item.label}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: theme.spacing.md,
  },
  chartContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.md,
  },
  barContainer: {
    alignItems: 'center',
    flex: 1,
  },
  barWrapper: {
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  bar: {
    borderTopLeftRadius: theme.borderRadius.sm,
    borderTopRightRadius: theme.borderRadius.sm,
    minHeight: 4,
  },
  valueText: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    marginBottom: theme.spacing.xs,
    fontWeight: '500',
  },
  labelText: {
    color: theme.colors.textMuted,
    fontSize: 12,
    textAlign: 'center',
  },
});