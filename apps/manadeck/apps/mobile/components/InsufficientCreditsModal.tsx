import React from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet } from 'react-native';

interface InsufficientCreditsModalProps {
  visible: boolean;
  requiredCredits: number;
  availableCredits: number;
  operation?: string;
  onClose: () => void;
  onPurchase?: () => void;
}

/**
 * Modal shown when user has insufficient mana credits
 */
export function InsufficientCreditsModal({
  visible,
  requiredCredits,
  availableCredits,
  operation = 'this operation',
  onClose,
  onPurchase,
}: InsufficientCreditsModalProps) {
  const shortfall = requiredCredits - availableCredits;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.icon}>⚡</Text>
            <Text style={styles.title}>Insufficient Mana</Text>
          </View>

          {/* Content */}
          <View style={styles.content}>
            <Text style={styles.message}>
              You don't have enough mana to {operation}.
            </Text>

            <View style={styles.creditsInfo}>
              <View style={styles.creditsRow}>
                <Text style={styles.label}>Required:</Text>
                <Text style={styles.value}>{requiredCredits} mana</Text>
              </View>
              <View style={styles.creditsRow}>
                <Text style={styles.label}>Available:</Text>
                <Text style={styles.value}>{availableCredits} mana</Text>
              </View>
              <View style={[styles.creditsRow, styles.shortfallRow]}>
                <Text style={styles.label}>Needed:</Text>
                <Text style={[styles.value, styles.shortfall]}>
                  {shortfall} mana
                </Text>
              </View>
            </View>
          </View>

          {/* Actions */}
          <View style={styles.actions}>
            {onPurchase && (
              <TouchableOpacity
                style={[styles.button, styles.primaryButton]}
                onPress={onPurchase}
              >
                <Text style={styles.primaryButtonText}>Get More Mana</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[styles.button, styles.secondaryButton]}
              onPress={onClose}
            >
              <Text style={styles.secondaryButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: 'white',
    borderRadius: 16,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  header: {
    alignItems: 'center',
    paddingTop: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  icon: {
    fontSize: 48,
    marginBottom: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  content: {
    padding: 24,
  },
  message: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 24,
  },
  creditsInfo: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
  },
  creditsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  shortfallRow: {
    marginBottom: 0,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  label: {
    fontSize: 15,
    color: '#666',
    fontWeight: '500',
  },
  value: {
    fontSize: 15,
    color: '#1a1a1a',
    fontWeight: '600',
  },
  shortfall: {
    color: '#dc2626',
  },
  actions: {
    padding: 16,
    gap: 12,
  },
  button: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: '#3b82f6',
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  secondaryButtonText: {
    color: '#6b7280',
    fontSize: 16,
    fontWeight: '500',
  },
});
