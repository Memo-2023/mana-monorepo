import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import Modal from '../atoms/Modal';
import Text from '../atoms/Text';
import Icon from '../atoms/Icon';

interface PinModalProps {
  visible: boolean;
  pinCode: string;
  pinError: boolean;
  onClose: () => void;
  onPinInput: (digit: string) => void;
  onPinDelete: () => void;
}

export default function PinModal({
  visible,
  pinCode,
  pinError,
  onClose,
  onPinInput,
  onPinDelete,
}: PinModalProps) {
  return (
    <Modal
      visible={visible}
      onClose={onClose}
      useBlur={false}
      maxWidth={400}
      dismissOnBackgroundPress={false}
    >
      <TouchableOpacity style={styles.pinCloseButton} onPress={onClose}>
        <Icon set="ionicons" name="close" size={24} color="#FFFFFF" />
      </TouchableOpacity>

      <View style={styles.pinModalContent}>
        <Text variant="subheader" color="#FFFFFF" style={styles.pinTitle}>
          🔐 Dev Settings
        </Text>
        <Text style={styles.pinSubtitle}>PIN-Code eingeben</Text>

        <View style={styles.pinDotsContainer}>
          {[0, 1, 2, 3].map((index) => (
            <View
              key={index}
              style={[
                styles.pinDot,
                pinCode.length > index && styles.pinDotFilled,
                pinError && styles.pinDotError,
              ]}
            />
          ))}
        </View>

        {pinError && <Text style={styles.pinErrorText}>Falscher PIN-Code</Text>}

        <View style={styles.pinPad}>
          <View style={styles.pinRow}>
            {['1', '2', '3'].map((digit) => (
              <TouchableOpacity
                key={digit}
                style={styles.pinButton}
                onPress={() => onPinInput(digit)}
              >
                <Text style={styles.pinButtonText}>{digit}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.pinRow}>
            {['4', '5', '6'].map((digit) => (
              <TouchableOpacity
                key={digit}
                style={styles.pinButton}
                onPress={() => onPinInput(digit)}
              >
                <Text style={styles.pinButtonText}>{digit}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.pinRow}>
            {['7', '8', '9'].map((digit) => (
              <TouchableOpacity
                key={digit}
                style={styles.pinButton}
                onPress={() => onPinInput(digit)}
              >
                <Text style={styles.pinButtonText}>{digit}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.pinRow}>
            <View style={[styles.pinButton, styles.pinButtonInvisible]} />
            <TouchableOpacity style={styles.pinButton} onPress={() => onPinInput('0')}>
              <Text style={styles.pinButtonText}>0</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.pinButton} onPress={onPinDelete}>
              <Icon set="ionicons" name="backspace-outline" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  pinModalContent: {
    alignItems: 'center',
    width: '100%',
  },
  pinCloseButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    zIndex: 1,
    padding: 8,
  },
  pinTitle: {
    fontSize: 24,
    marginBottom: 8,
    marginTop: 8,
  },
  pinSubtitle: {
    color: '#A0A0A0',
    fontSize: 16,
    marginBottom: 32,
  },
  pinDotsContainer: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 24,
  },
  pinDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#666666',
    backgroundColor: 'transparent',
  },
  pinDotFilled: {
    backgroundColor: '#FFCB00',
    borderColor: '#FFCB00',
  },
  pinDotError: {
    borderColor: '#FF4444',
    backgroundColor: 'rgba(255, 68, 68, 0.2)',
  },
  pinErrorText: {
    color: '#FF4444',
    fontSize: 14,
    marginBottom: 16,
    position: 'absolute',
    top: 160,
  },
  pinPad: {
    marginTop: 24,
  },
  pinRow: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 16,
  },
  pinButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#333333',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pinButtonInvisible: {
    opacity: 0,
  },
  pinButtonText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '600',
  },
});
