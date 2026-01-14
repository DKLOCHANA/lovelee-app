import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from '../constants/theme';

// Alert types with icons
const ALERT_TYPES = {
  success: { icon: 'checkmark-circle', color: COLORS.success },
  error: { icon: 'close-circle', color: COLORS.error },
  warning: { icon: 'warning', color: COLORS.warning },
  info: { icon: 'information-circle', color: COLORS.accentBlue },
  confirm: { icon: 'help-circle', color: COLORS.accentPurple },
  heart: { icon: 'heart', color: COLORS.heart },
};

export default function CustomAlert({
  visible,
  type = 'info',
  title,
  message,
  buttons = [{ text: 'OK', onPress: () => {} }],
  onClose,
}) {
  const alertConfig = ALERT_TYPES[type] || ALERT_TYPES.info;

  const handleButtonPress = (button) => {
    if (button.onPress) {
      button.onPress();
    }
    if (onClose) {
      onClose();
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={styles.alertContainer}>
              {/* Icon */}
              <View style={[styles.iconContainer, { backgroundColor: alertConfig.color + '20' }]}>
                <Ionicons name={alertConfig.icon} size={36} color={alertConfig.color} />
              </View>

              {/* Title */}
              {title && <Text style={styles.title}>{title}</Text>}

              {/* Message */}
              {message && <Text style={styles.message}>{message}</Text>}

              {/* Buttons */}
              <View style={styles.buttonsContainer}>
                {buttons.map((button, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.button,
                      button.style === 'cancel' && styles.buttonCancel,
                      button.style === 'destructive' && styles.buttonDestructive,
                      buttons.length === 1 && styles.buttonSingle,
                    ]}
                    onPress={() => handleButtonPress(button)}
                  >
                    <Text
                      style={[
                        styles.buttonText,
                        button.style === 'cancel' && styles.buttonTextCancel,
                        button.style === 'destructive' && styles.buttonTextDestructive,
                      ]}
                    >
                      {button.text}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

// Global alert helper - can be used as a hook
let alertRef = null;

export const setAlertRef = (ref) => {
  alertRef = ref;
};

export const showAlert = (options) => {
  if (alertRef) {
    alertRef(options);
  }
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
  },
  alertContainer: {
    backgroundColor: COLORS.backgroundCard,
    borderRadius: RADIUS.xxl,
    padding: SPACING.xl,
    width: '100%',
    maxWidth: 320,
    alignItems: 'center',
    ...SHADOWS.medium,
  },
  iconContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  title: {
    fontSize: FONTS.sizes.xl,
    fontWeight: '700',
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  message: {
    fontSize: FONTS.sizes.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: SPACING.xl,
  },
  buttonsContainer: {
    flexDirection: 'row',
    width: '100%',
    gap: SPACING.md,
  },
  button: {
    flex: 1,
    backgroundColor: COLORS.secondary,
    borderRadius: RADIUS.full,
    paddingVertical: SPACING.md,
    alignItems: 'center',
  },
  buttonSingle: {
    flex: 1,
  },
  buttonCancel: {
    backgroundColor: COLORS.borderLight,
  },
  buttonDestructive: {
    backgroundColor: COLORS.error,
  },
  buttonText: {
    fontSize: FONTS.sizes.md,
    fontWeight: '600',
    color: COLORS.textWhite,
  },
  buttonTextCancel: {
    color: COLORS.textPrimary,
  },
  buttonTextDestructive: {
    color: COLORS.textWhite,
  },
});
