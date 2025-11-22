import React, { useState, useRef } from 'react';
import { View, StyleSheet, Animated, useWindowDimensions } from 'react-native';
import { Image } from 'expo-image';
import Text from './Text';
import Icon from './Icon';
import { getLocalImageSource } from '../../src/constants/hardcodedCharacters';

interface AvatarProps {
  imageUrl?: string;
  name: string;
  size?: number;
  showName?: boolean;
  isSelected?: boolean;
  blurhash?: string;
  isFeatured?: boolean;
}

export default function Avatar({
  imageUrl,
  name,
  size = 100,
  showName = true,
  isSelected = false,
  blurhash,
  isFeatured = false
}: AvatarProps) {
  const opacity = useRef(new Animated.Value(0)).current;
  const [imageError, setImageError] = useState(false);
  const { width: windowWidth } = useWindowDimensions();
  const isTablet = windowWidth >= 768;

  // Responsive font sizes
  const nameFontSize = isTablet ? 28 : 18;
  const nameLineHeight = isTablet ? 34 : 24;
  const nameMinHeight = isTablet ? 68 : 48;

  const handleLoad = () => {
    Animated.timing(opacity, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const handleError = (error: any) => {
    setImageError(true);
  };
  const styles = StyleSheet.create({
    container: {
      alignItems: 'center',
      width: '100%',
    },
    imageContainer: {
      width: size,
      height: size,
      borderRadius: size / 2,
      backgroundColor: '#2C2C2C',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: showName ? 8 : 0,
      overflow: 'hidden',
      borderWidth: isSelected ? 4 : 1,
      borderColor: isSelected ? '#FFD700' : 'rgba(255, 255, 255, 0.1)',
    },
    image: {
      width: size,
      height: size,
    },
    name: {
      fontWeight: 'bold',
      color: '#FFFFFF',
      textAlign: 'center',
      letterSpacing: 0.3,
      width: '100%',
    },
  });

  // Determine image source - local or remote
  const imageSource = imageUrl
    ? (imageUrl.startsWith('local://')
        ? getLocalImageSource(imageUrl)
        : { uri: imageUrl })
    : null;

  return (
    <View style={styles.container}>
      <View style={styles.imageContainer}>
        {imageSource && !imageError ? (
          <Animated.View style={{ opacity, width: size, height: size }}>
            <Image
              source={imageSource}
              style={styles.image}
              contentFit="cover"
              placeholder={blurhash ? { blurhash } : undefined}
              transition={blurhash ? 300 : 0}
              cachePolicy="memory-disk"
              priority="high"
              onLoad={handleLoad}
              onError={handleError}
            />
          </Animated.View>
        ) : (
          <Icon
            set="ionicons"
            name="person"
            size={size * 0.6}
            color="#666666"
          />
        )}
      </View>
      {showName && (
        <Text style={[styles.name, { fontSize: nameFontSize, lineHeight: nameLineHeight, minHeight: nameMinHeight }]} numberOfLines={2} ellipsizeMode="tail">{name}</Text>
      )}
    </View>
  );
}
