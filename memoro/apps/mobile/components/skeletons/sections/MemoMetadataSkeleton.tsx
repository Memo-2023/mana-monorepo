import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '~/features/theme/ThemeProvider';
import { getSkeletonColor, skeletonBase, skeletonText, skeletonBox, skeletonRow, skeletonSpacing } from '../utils/skeletonStyles';
import { SkeletonAnimation } from '../utils/SkeletonAnimation';

export const MemoMetadataSkeleton: React.FC = () => {
  const { colors, isDark } = useTheme();
  const skeletonColor = getSkeletonColor(isDark, colors);

  return (
    <SkeletonAnimation style={styles.container}>
      <View style={[skeletonRow, styles.dateRow]}>
        <View style={[skeletonBase, skeletonText(14), styles.dateText, { backgroundColor: skeletonColor }]} />
      </View>
      <View style={[skeletonRow, styles.tagsRow]}>
        <View style={[skeletonBase, skeletonBox(60, 24), styles.tag, { backgroundColor: skeletonColor }]} />
        <View style={[skeletonBase, skeletonBox(80, 24), styles.tag, { backgroundColor: skeletonColor }]} />
        <View style={[skeletonBase, skeletonBox(70, 24), styles.tag, { backgroundColor: skeletonColor }]} />
      </View>
    </SkeletonAnimation>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,  // Same as memo page
    marginBottom: 24,       // Add proper spacing
  },
  dateRow: {
    marginBottom: skeletonSpacing.sm,
  },
  dateText: {
    width: 150,
  },
  tagsRow: {
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    borderRadius: 12,
  },
});