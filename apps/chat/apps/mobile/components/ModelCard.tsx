import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Model } from '../types';

type ModelCardProps = {
  id: string;
  name: string;
  description: string;
  deployment?: string;
  isSelected?: boolean;
  onSelect: (id: string) => void;
  model?: Model; // Optionales komplettes Model-Objekt
};

export default function ModelCard({ 
  id, 
  name, 
  description, 
  isSelected = false, 
  onSelect,
  model
}: ModelCardProps) {
  const { colors } = useTheme();
  const deployment = model?.parameters?.deployment;

  return (
    <TouchableOpacity
      style={[
        styles.container,
        { 
          backgroundColor: colors.card,
          borderColor: isSelected ? colors.primary : 'transparent',
        }
      ]}
      onPress={() => onSelect(id)}
    >
      <View style={styles.iconContainer}>
        <Ionicons 
          name="chatbubble-ellipses-outline" 
          size={24} 
          color={colors.primary} 
        />
      </View>
      
      <View style={styles.contentContainer}>
        <Text style={[styles.name, { color: colors.text }]}>{name}</Text>
        <Text 
          style={[styles.description, { color: colors.text + '80' }]}
          numberOfLines={2}
        >
          {description}
        </Text>
        
        {deployment && (
          <Text 
            style={[styles.deployment, { color: colors.primary + 'CC' }]}
            numberOfLines={1}
          >
            {deployment}
          </Text>
        )}
      </View>
      
      {isSelected && (
        <View style={[styles.checkmark, { backgroundColor: colors.primary }]}>
          <Ionicons name="checkmark" size={16} color="#fff" />
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  contentContainer: {
    flex: 1,
    marginLeft: 16,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 4,
  },
  deployment: {
    fontSize: 12,
    fontWeight: '500',
  },
  checkmark: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
