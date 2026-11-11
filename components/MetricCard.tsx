import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { theme } from '../constants/theme';
import { DarkCard } from './DarkCard';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  icon?: React.ReactNode;
  color?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  trend,
  icon,
  color = theme.colors.primary,
}) => {
  return (
    <DarkCard style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        {icon && <View style={styles.iconContainer}>{icon}</View>}
      </View>
      
      <View style={styles.content}>
        <Text style={[styles.value, { color }]}>
          {typeof value === 'number' ? value.toLocaleString() : value}
        </Text>
        
        {subtitle && (
          <Text style={styles.subtitle}>{subtitle}</Text>
        )}
        
        {trend && (
          <View style={styles.trendContainer}>
            <Text
              style={[
                styles.trendText,
                {
                  color: trend.isPositive ? theme.colors.success : theme.colors.error,
                },
              ]}
            >
              {trend.isPositive ? '+' : ''}{trend.value}
            </Text>
          </View>
        )}
      </View>
    </DarkCard>
  );
};

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minHeight: 100,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  title: {
    color: theme.colors.textSecondary,
    fontSize: 14,
    fontWeight: '500',
  },
  iconContainer: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  value: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: theme.spacing.xs,
  },
  subtitle: {
    color: theme.colors.textMuted,
    fontSize: 12,
    marginBottom: theme.spacing.xs,
  },
  trendContainer: {
    marginTop: theme.spacing.xs,
  },
  trendText: {
    fontSize: 14,
    fontWeight: '600',
  },
});