import React from 'react';
import { StyleSheet, TextInput } from 'react-native';
import Modal from '../atoms/Modal';

interface FeedbackModalProps {
  visible: boolean;
  feedbackText: string;
  isSaving: boolean;
  onClose: () => void;
  onChangeText: (text: string) => void;
  onSubmit: () => void;
}

export default function FeedbackModal({
  visible,
  feedbackText,
  isSaving,
  onClose,
  onChangeText,
  onSubmit,
}: FeedbackModalProps) {
  return (
    <Modal
      visible={visible}
      onClose={onClose}
      title="Schreibe uns dein Feedback"
      useBlur={false}
      maxWidth={360}
      buttons={[
        {
          title: 'Abbrechen',
          onPress: onClose,
          variant: 'secondary',
          color: '#666666',
        },
        {
          title: isSaving ? 'Speichern...' : 'Senden',
          onPress: onSubmit,
          variant: 'primary',
          color: '#6D5B00',
        },
      ]}
    >
      <TextInput
        style={styles.feedbackInput}
        placeholder="Was hat dir gefallen? Was können wir verbessern?"
        placeholderTextColor="rgba(255, 255, 255, 0.5)"
        multiline
        value={feedbackText}
        onChangeText={onChangeText}
      />
    </Modal>
  );
}

const styles = StyleSheet.create({
  feedbackInput: {
    backgroundColor: '#333333',
    borderRadius: 8,
    padding: 16,
    color: '#FFFFFF',
    minHeight: 120,
    textAlignVertical: 'top',
    width: '100%',
  },
});
