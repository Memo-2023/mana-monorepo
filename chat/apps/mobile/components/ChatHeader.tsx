import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

type ChatHeaderProps = {
  title?: string;
  modelName: string;
  conversationMode: string;
  onBackPress?: () => void;
};

export default function ChatHeader({ 
  title,
  modelName, 
  conversationMode,
  onBackPress 
}: ChatHeaderProps) {
  const { colors } = useTheme();
  const router = useRouter();

  const handleBackPress = () => {
    if (onBackPress) {
      onBackPress();
    } else {
      router.back();
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.card }]}>
      <View style={styles.titleContainer}>
        <Text style={[styles.title, { color: colors.text }]}>
          {title || 'Neuer Chat'}
        </Text>
        <View style={styles.subtitleContainer}>
          <Text style={[styles.modelName, { color: colors.text + '80' }]}>
            {modelName}
          </Text>
          <Text style={[styles.modeText, { color: colors.text + '80' }]}>
            {conversationMode === 'frei' ? 'Freier Modus' : 
             conversationMode === 'geführt' ? 'Geführter Modus' : 'Vorlagen-Modus'}
          </Text>
        </View>
      </View>
      
      <TouchableOpacity style={styles.menuButton}>
        <Ionicons name="ellipsis-vertical" size={24} color={colors.text} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.1)',
    width: '100%',
    maxWidth: 1200,
    alignSelf: 'center',
  },
  backButton: {
    padding: 4,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  subtitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  modelName: {
    fontSize: 13,
    fontWeight: '500',
  },
  modeText: {
    fontSize: 13,
    marginLeft: 8,
  },
  menuButton: {
    padding: 4,
  },
});
