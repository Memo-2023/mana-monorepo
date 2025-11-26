import React from 'react';
import { View, StyleSheet } from 'react-native';
import Text from '../atoms/Text';

interface SectionHeaderProps {
  title: string;
  isFirst?: boolean;
}

export default function SectionHeader({ title, isFirst = false }: SectionHeaderProps) {
  return (
    <View style={[styles.sectionHeaderContainer, isFirst && styles.firstSection]}>
      <Text style={styles.sectionHeaderText}>{title}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  sectionHeaderContainer: {
    paddingVertical: 8,
    marginBottom: 8,
    marginTop: 24,
  },
  firstSection: {
    marginTop: 0,
  },
  sectionHeaderText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'Grandstander_700Bold',
  },
});
