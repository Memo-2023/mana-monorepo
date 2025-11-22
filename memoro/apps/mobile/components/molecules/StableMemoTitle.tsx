import React, { useEffect, useState, useRef } from 'react';
import { Text, TextProps, Animated } from 'react-native';
import { useMemoProcessing } from '~/features/memos/contexts/MemoProcessingContext';

interface StableMemoTitleProps extends TextProps {
  memoId: string;
  titleClasses?: string;
  numberOfLines?: number;
  ellipsizeMode?: 'head' | 'middle' | 'tail' | 'clip';
}

/**
 * A specialized component that renders ONLY the memo title
 * and updates it without causing parent re-renders
 */
const StableMemoTitle: React.FC<StableMemoTitleProps> = ({ 
  memoId,
  titleClasses,
  numberOfLines = 2,
  ellipsizeMode = 'tail',
  style,
  ...rest
}) => {
  // Get the display title from context
  const { getDisplayTitle, registerForUpdates } = useMemoProcessing();
  
  // Local state for the title (will only update this component)
  const [title, setTitle] = useState(() => getDisplayTitle(memoId) || 'New Recording');
  
  // Animation value for smooth transitions
  const fadeAnim = useRef(new Animated.Value(1)).current;
  
  // Direct polling for title updates to ensure we don't miss any
  useEffect(() => {
    // Poll for title updates every 500ms
    const pollInterval = setInterval(() => {
      const newTitle = getDisplayTitle(memoId);
      if (newTitle && newTitle !== title) {
        console.debug(`🔄 StableMemoTitle: Updating title from "${title}" to "${newTitle}"`);
        
        // Fade out
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 100,
          useNativeDriver: true,
        }).start(() => {
          // Update title
          setTitle(newTitle);
          
          // Fade in
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 100,
            useNativeDriver: true,
          }).start();
        });
      }
    }, 500);
    
    // Also register for immediate updates from the context
    const unregister = registerForUpdates(() => {
      const newTitle = getDisplayTitle(memoId);
      if (newTitle && newTitle !== title) {
        console.debug(`🔔 StableMemoTitle: Context update - title from "${title}" to "${newTitle}"`);
        
        // Fade out
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 100,
          useNativeDriver: true,
        }).start(() => {
          // Update title
          setTitle(newTitle);
          
          // Fade in
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 100,
            useNativeDriver: true,
          }).start();
        });
      }
    });
    
    // Cleanup
    return () => {
      clearInterval(pollInterval);
      unregister();
    };
  }, [memoId, getDisplayTitle, registerForUpdates, title, fadeAnim]);
  
  return (
    <Animated.View style={{ opacity: fadeAnim }}>
      <Text 
        className={titleClasses} 
        numberOfLines={numberOfLines} 
        ellipsizeMode={ellipsizeMode}
        style={style}
        {...rest}
      >
        {title}
      </Text>
    </Animated.View>
  );
};

export default React.memo(StableMemoTitle);
