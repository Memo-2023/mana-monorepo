import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '~/features/theme/ThemeProvider';
import colors from '~/tailwind.config.js';

/**
 * Skeleton loader for TagCard component
 * Matches exact TagCard structure and dimensions
 */
const TagCardSkeleton = () => {
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
      <View style={styles.content}>
        {/* Color circle skeleton */}
        <View 
          style={[
            styles.colorCircle,
            { backgroundColor: skeletonColor }
          ]} 
        />
        
        {/* Tag name skeleton */}
        <View 
          style={[
            styles.nameSkeleton,
            { backgroundColor: skeletonColor }
          ]} 
        />
      </View>
      
      {/* Action buttons skeleton */}
      <View style={styles.actions}>
        {/* Delete button skeleton */}
        <View 
          style={[
            styles.iconSkeleton,
            { 
              backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)'
            }
          ]} 
        />
        
        {/* Edit button skeleton */}
        <View 
          style={[
            styles.iconSkeleton,
            { 
              backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
              marginLeft: 12
            }
          ]} 
        />
        
        {/* Pin button skeleton */}
        <View 
          style={[
            styles.iconSkeleton,
            { 
              backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
              marginLeft: 12
            }
          ]} 
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingLeft: 12,
    paddingRight: 20,
    flex: 1,
  },
  colorCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 10,
    opacity: 0.6,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  nameSkeleton: {
    height: 16,
    width: 120,
    borderRadius: 4,
    opacity: 0.6,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 8,
  },
  iconSkeleton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    opacity: 0.6,
  },
});

export default TagCardSkeleton;