import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@react-navigation/native';

type NewChatButtonProps = {
  onPress: () => void;
};

export default function NewChatButton({ onPress }: NewChatButtonProps) {
  const { colors } = useTheme();

  return (
    <TouchableOpacity 
      style={[styles.button, { backgroundColor: colors.primary }]} 
      onPress={onPress}
    >
      <Ionicons name="add" size={24} color="#fff" style={styles.icon} />
      <Text style={styles.text}>Neuer Chat</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  icon: {
    marginRight: 8,
  },
  text: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
