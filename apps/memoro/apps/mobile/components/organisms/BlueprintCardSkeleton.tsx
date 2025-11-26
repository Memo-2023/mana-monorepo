import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '~/features/theme/ThemeProvider';
import colors from '~/tailwind.config.js';

/**
 * Skeleton loader for BlueprintCard component
 * Matches exact BlueprintCard structure and dimensions
 */
const BlueprintCardSkeleton = () => {
  const { isDark, themeVariant } = useTheme();
  
  // Get theme colors
  const borderColor = isDark
    ? ((colors as any).theme?.extend?.colors?.dark)?.[themeVariant]?.border || '#424242'
    : ((colors as any).theme?.extend?.colors)?.[themeVariant]?.border || '#e6e6e6';
  
  const backgroundColor = isDark 
    ? ((colors as any).theme?.extend?.colors?.dark)?.[themeVariant]?.contentBackground 
    : ((colors as any).theme?.extend?.colors)?.[themeVariant]?.contentBackground;
    
  const skeletonColor = isDark ? '#3a3a3a' : '#e0e0e0';

  return (
    <View 
      style={[
        styles.container,
        { 
          backgroundColor,
          borderWidth: 1,
          borderColor
        }
      ]}
    >
      <View style={styles.header}>
        {/* Title skeleton */}
        <View 
          style={[
            styles.titleSkeleton,
            { backgroundColor: skeletonColor }
          ]} 
        />
        
        {/* Pin icon skeleton */}
        <View 
          style={[
            styles.iconSkeleton,
            { 
              backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)'
            }
          ]} 
        />
      </View>
      
      {/* Description skeleton - two lines */}
      <View>
        <View 
          style={[
            styles.descriptionLine,
            { backgroundColor: skeletonColor, width: '100%' }
          ]} 
        />
        <View 
          style={[
            styles.descriptionLine,
            { backgroundColor: skeletonColor, width: '75%' }
          ]} 
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  titleSkeleton: {
    height: 20,
    width: 180,
    borderRadius: 4,
    opacity: 0.6,
  },
  iconSkeleton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    opacity: 0.6,
  },
  descriptionLine: {
    height: 14,
    borderRadius: 3,
    marginBottom: 6,
    opacity: 0.5,
  },
});

export default BlueprintCardSkeleton;