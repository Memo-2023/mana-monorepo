import { useState, useEffect } from 'react';
import { Platform, Dimensions } from 'react-native';

export const useResponsive = () => {
  const [dimensions, setDimensions] = useState(() => Dimensions.get('window'));

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setDimensions(window);
    });

    return () => subscription?.remove();
  }, []);

  const isWeb = Platform.OS === 'web';
  const isMobile = Platform.OS === 'ios' || Platform.OS === 'android';
  const isDesktop = isWeb && dimensions.width >= 768;
  const isTablet = (isWeb && dimensions.width >= 768 && dimensions.width < 1024) || 
                   (isMobile && dimensions.width >= 768);
  const isLargeDesktop = isWeb && dimensions.width >= 1280;

  return {
    isWeb,
    isMobile,
    isDesktop,
    isTablet,
    isLargeDesktop,
    width: dimensions.width,
    height: dimensions.height,
  };
};