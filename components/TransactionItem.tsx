import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { theme } from '../constants/theme';
import { ProfileAvatar } from './ProfileAvatar';

interface TransactionItemProps {
  name: string;
  description: string;
  amount: number;
  time: string;
  avatar?: any;
  onPress?: () => void;
  type?: 'income' | 'expense';
}

export const TransactionItem: React.FC<TransactionItemProps> = ({
  name,
  description,
  amount,
  time,
  avatar,
  onPress,
  type = 'expense',
}) => {
  const isIncome = type === 'income' || amount > 0;
  const displayAmount = Math.abs(amount);

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <ProfileAvatar
        source={avatar}
        name={name}
        size={40}
        showBorder={false}
      />
      
      <View style={styles.content}>
        <View style={styles.textContainer}>
          <Text style={styles.name}>{name}</Text>
          <Text style={styles.description}>{description}</Text>
        </View>
        
        <View style={styles.amountContainer}>
          <Text
            style={[
              styles.amount,
              {
                color: isIncome ? theme.colors.success : theme.colors.text,
              },
            ]}
          >
            {isIncome ? '+' : '-'}${displayAmount.toFixed(2)}
          </Text>
          <Text style={styles.time}>{time}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.md,
    marginBottom: theme.spacing.sm,
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: theme.spacing.md,
  },
  textContainer: {
    flex: 1,
  },
  name: {
    color: theme.colors.text,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  description: {
    color: theme.colors.textSecondary,
    fontSize: 14,
  },
  amountContainer: {
    alignItems: 'flex-end',
  },
  amount: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  time: {
    color: theme.colors.textMuted,
    fontSize: 12,
  },
});