import React from 'react';
import { View, StyleSheet } from 'react-native';
import CreateTagElement from './CreateTagElement';

interface FloatingTagCreatorProps {
  isDark: boolean;
  onCreateTag: (name: string, color: string) => Promise<void>;
}

/**
 * Komponente, die eine schwebende Tag-Erstellungsleiste am unteren Bildschirmrand anzeigt
 */
const FloatingTagCreator = ({
  isDark,
  onCreateTag
}: FloatingTagCreatorProps) => {
  return (
    <>

      {/* Schwebender CreateTagElement-Container */}
      <View style={styles.floatingCreateTagContainer}>
        <CreateTagElement 
          isDark={isDark}
          onCreateTag={onCreateTag}
        />
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  floatingCreateTagContainer: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 40,
    zIndex: 999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    backgroundColor: '#2A2A2A',
    borderRadius: 8,
  },
});

export default FloatingTagCreator;
