import React from 'react';
import { Dimensions, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { theme } from '../constants/theme';

interface CustomAlertProps {
  visible: boolean;
  title: string;
  message: string;
  type?: 'success' | 'error' | 'info' | 'warning';
  onConfirm?: () => void;
  onCancel?: () => void;
  showCancel?: boolean;
  confirmText?: string;
  cancelText?: string;
}

const { width } = Dimensions.get('window');

export const CustomAlert: React.FC<CustomAlertProps> = ({
  visible,
  title,
  message,
  type = 'info',
  onConfirm,
  onCancel,
  showCancel = false,
  confirmText = 'OK',
  cancelText = 'Cancel'
}) => {
  const getTypeColors = () => {
    switch (type) {
      case 'success':
        return { primary: theme.colors.success, bg: theme.colors.success + '20' };
      case 'error':
        return { primary: theme.colors.error, bg: theme.colors.error + '20' };
      case 'warning':
        return { primary: theme.colors.warning, bg: theme.colors.warning + '20' };
      default:
        return { primary: theme.colors.info, bg: theme.colors.info + '20' };
    }
  };

  const colors = getTypeColors();

  const handleConfirm = () => {
    onConfirm?.();
  };

  const handleCancel = () => {
    onCancel?.();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleCancel}
    >
      <View style={styles.overlay}>
        <View style={styles.alertContainer}>
          {/* Header with type indicator */}
          <View style={[styles.header, { backgroundColor: colors.bg }]}>
            <View style={[styles.indicator, { backgroundColor: colors.primary }]} />
            <Text style={styles.title}>{title}</Text>
          </View>

          {/* Message */}
          <View style={styles.messageContainer}>
            <Text style={styles.message}>{message}</Text>
          </View>

          {/* Buttons */}
          <View style={styles.buttonContainer}>
            {showCancel && (
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={handleCancel}
              >
                <Text style={styles.cancelButtonText}>{cancelText}</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[styles.button, styles.confirmButton, { backgroundColor: colors.primary }]}
              onPress={handleConfirm}
            >
              <Text style={styles.confirmButtonText}>{confirmText}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.lg,
  },
  alertContainer: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    width: width * 0.85,
    maxWidth: 400,
    overflow: 'hidden',
    ...theme.shadows.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  indicator: {
    width: 4,
    height: 20,
    borderRadius: 2,
  },
  title: {
    ...theme.typography.h3,
    color: theme.colors.text,
    flex: 1,
  },
  messageContainer: {
    padding: theme.spacing.lg,
    paddingTop: theme.spacing.md,
  },
  message: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  buttonContainer: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  button: {
    flex: 1,
    paddingVertical: theme.spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: 'transparent',
    borderRightWidth: 1,
    borderRightColor: theme.colors.border,
  },
  confirmButton: {
    backgroundColor: theme.colors.primary,
  },
  cancelButtonText: {
    ...theme.typography.bodyMedium,
    color: theme.colors.textSecondary,
  },
  confirmButtonText: {
    ...theme.typography.bodyMedium,
    color: theme.colors.text,
    fontWeight: '600',
  },
});

// Helper functions for common alert types
export const showSuccess = (title: string, message: string, onConfirm?: () => void) => {
  return { visible: true, title, message, type: 'success' as const, onConfirm };
};

export const showError = (title: string, message: string, onConfirm?: () => void) => {
  return { visible: true, title, message, type: 'error' as const, onConfirm };
};

export const showInfo = (title: string, message: string, onConfirm?: () => void) => {
  return { visible: true, title, message, type: 'info' as const, onConfirm };
};

export const showWarning = (title: string, message: string, onConfirm?: () => void) => {
  return { visible: true, title, message, type: 'warning' as const, onConfirm };
};

export const showConfirm = (title: string, message: string, onConfirm?: () => void, onCancel?: () => void) => {
  return { 
    visible: true, 
    title, 
    message, 
    type: 'info' as const, 
    onConfirm, 
    onCancel, 
    showCancel: true 
  };
};
