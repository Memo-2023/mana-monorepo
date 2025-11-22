import React, { useEffect } from 'react';
import { View, StyleSheet, Modal, TouchableOpacity, Platform } from 'react-native';
import Text from '../atoms/Text';
import Button from '../atoms/Button';
import { MaterialIcons } from '@expo/vector-icons';
import { useCreditsScreenTracking } from '../../hooks/useStoryEngagement';

interface InsufficientCreditsModalProps {
  visible: boolean;
  requiredCredits: number;
  availableCredits: number;
  operationType: 'story' | 'character';
  onClose: () => void;
  onGetCredits?: () => void;
}

export default function InsufficientCreditsModal({
  visible,
  requiredCredits,
  availableCredits,
  operationType,
  onClose,
  onGetCredits,
}: InsufficientCreditsModalProps) {
  const missingCredits = requiredCredits - availableCredits;
  const operationText = operationType === 'story' ? 'Geschichte' : 'Charakter';

  // Track modal viewing when visible
  useEffect(() => {
    if (visible) {
      // This is tracked via the global handler useCreditsScreenTracking
      // Individual insufficient credits events are already tracked via analytics
    }
  }, [visible]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <TouchableOpacity
          style={styles.modalContainer}
          activeOpacity={1}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={styles.iconContainer}>
            <MaterialIcons name="account-balance-wallet" size={48} color="#FF6B6B" />
          </View>

          <Text style={styles.title}>Nicht genug Credits</Text>

          <Text style={styles.message}>
            Du benötigst <Text style={styles.highlight}>{requiredCredits} Credits</Text>, um diese{' '}
            {operationText} zu erstellen, aber du hast nur{' '}
            <Text style={styles.highlight}>{availableCredits} Credits</Text> verfügbar.
          </Text>

          <View style={styles.creditsInfo}>
            <View style={styles.creditRow}>
              <Text style={styles.creditLabel}>Benötigt:</Text>
              <Text style={styles.creditValue}>{requiredCredits} Credits</Text>
            </View>
            <View style={styles.creditRow}>
              <Text style={styles.creditLabel}>Verfügbar:</Text>
              <Text style={styles.creditValue}>{availableCredits} Credits</Text>
            </View>
            <View style={[styles.creditRow, styles.creditRowHighlight]}>
              <Text style={styles.creditLabelHighlight}>Fehlen:</Text>
              <Text style={styles.creditValueHighlight}>{missingCredits} Credits</Text>
            </View>
          </View>

          <View style={styles.buttonContainer}>
            {onGetCredits && (
              <Button
                title="Credits kaufen"
                onPress={() => {
                  onClose();
                  onGetCredits();
                }}
                style={styles.primaryButton}
              />
            )}
            <Button
              title="Schließen"
              onPress={onClose}
              variant="secondary"
              style={styles.secondaryButton}
            />
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: '#1E1E2E',
    borderRadius: 20,
    padding: 24,
    width: '90%',
    maxWidth: 400,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 16,
  },
  message: {
    fontSize: 16,
    color: '#B0B0C0',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  highlight: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  creditsInfo: {
    backgroundColor: '#2A2A3E',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  creditRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  creditRowHighlight: {
    borderTopWidth: 1,
    borderTopColor: '#3A3A4E',
    marginTop: 8,
    paddingTop: 16,
  },
  creditLabel: {
    fontSize: 14,
    color: '#B0B0C0',
  },
  creditValue: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  creditLabelHighlight: {
    fontSize: 16,
    color: '#FF6B6B',
    fontWeight: 'bold',
  },
  creditValueHighlight: {
    fontSize: 18,
    color: '#FF6B6B',
    fontWeight: 'bold',
  },
  buttonContainer: {
    gap: 12,
  },
  primaryButton: {
    marginBottom: 0,
  },
  secondaryButton: {
    marginBottom: 0,
  },
});
