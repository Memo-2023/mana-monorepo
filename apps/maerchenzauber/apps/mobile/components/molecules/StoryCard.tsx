import React, { useState } from 'react';
import { View, StyleSheet, Pressable, Dimensions, Animated, TouchableOpacity, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import { Blurhash } from 'react-native-blurhash';
import Icon from '../atoms/Icon';
import Text from '../atoms/Text';
import { useDebugBorders } from '../../hooks/useDebugBorders';
import { Story } from '../../types/story';

interface StoryCardProps {
  story: Story;
  width?: number;
  showBadge?: boolean;
  badgeText?: string;
  showVoteCount?: boolean;
  voteCount?: number;
  showFavorite?: boolean;
  onFavoriteToggle?: (storyId: string, isFavorite: boolean) => void;
}

const ASPECT_RATIO = 1.5; // 3:2 aspect ratio (height = width * 1.5)

const StoryCard: React.FC<StoryCardProps> = ({ story, width, showBadge, badgeText, showVoteCount, voteCount, showFavorite, onFavoriteToggle }) => {
  const containerDebug = useDebugBorders('#FF0000');
  const imageDebug = useDebugBorders('#00FF00');
  const gradientDebug = useDebugBorders('#0000FF');
  const contentDebug = useDebugBorders('#FF00FF');
  const router = useRouter();
  const screenWidth = Dimensions.get('window').width;
  const { width: windowWidth } = useWindowDimensions();
  const isTablet = windowWidth >= 768;
  const [imageLoaded, setImageLoaded] = useState(false);
  const [opacity] = useState(new Animated.Value(0));
  const [isFavorite, setIsFavorite] = useState(story.is_favorite || false);

  // Use provided width or calculate based on screen width (no max limit for responsive design)
  const cardWidth = width || screenWidth * 0.4;
  const cardHeight = cardWidth * ASPECT_RATIO;

  // Responsive font sizes
  const titleFontSize = isTablet ? 30 : 20;
  const titleLineHeight = isTablet ? 36 : 26;
  const authorFontSize = isTablet ? 28 : 18;
  const authorLineHeight = isTablet ? 34 : 24;

  const handlePress = () => {
    router.push(`/story/${story.id}`);
  };

  const handleFavoritePress = (e: any) => {
    e.stopPropagation(); // Prevent navigation when pressing favorite
    const newFavoriteState = !isFavorite;
    setIsFavorite(newFavoriteState);
    if (onFavoriteToggle) {
      onFavoriteToggle(story.id, newFavoriteState);
    }
  };

  const handleLoad = () => {
    setImageLoaded(true);
    Animated.timing(opacity, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const coverImage = story?.pages?.[0]?.image;
  const blurHash = story?.pages?.[0]?.blur_hash || 'LEHV6nWB2yk8pyo0adR*.7kCMdnj';

  const dynamicStyles = StyleSheet.create({
    container: {
      width: cardWidth,
      height: cardHeight,
      backgroundColor: '#2C2C2C',
      borderRadius: 12,
      overflow: 'hidden',
      shadowColor: "#000",
      shadowOffset: {
        width: 4,
        height: 4,
      },
      shadowOpacity: 0.3,
      shadowRadius: 5,
      elevation: 8,
    },
    pressed: {
      opacity: 0.7,
    },
  });

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [
        dynamicStyles.container,
        pressed && dynamicStyles.pressed
      ]}
    >
      {showBadge && (
        <View style={styles.badgeContainer}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{badgeText || '✨ Märchenzauber'}</Text>
          </View>
        </View>
      )}
      {showVoteCount && (
        <View style={styles.voteContainerTop}>
          <Icon set="ionicons" name="heart" size={16} color="#FFD700" />
          <Text style={styles.voteCount}>{voteCount || 0}</Text>
        </View>
      )}
      {showFavorite && onFavoriteToggle && (
        <TouchableOpacity onPress={handleFavoritePress} style={styles.favoriteButton}>
          <Icon
            set="ionicons"
            name={isFavorite ? "heart" : "heart-outline"}
            size={20}
            color={isFavorite ? "#FFD700" : "#FFFFFF"}
          />
        </TouchableOpacity>
      )}
      {coverImage ? (
        <>
          {/* BlurHash Placeholder */}
          {!imageLoaded && (
            <Blurhash
              blurhash={blurHash}
              style={[styles.image, styles.blurHashPlaceholder]}
              resizeMode="cover"
            />
          )}

          {/* Actual Image */}
          <Animated.View style={[styles.image, { opacity }]}>
            <Image
              source={{ uri: coverImage }}
              style={[styles.image, imageDebug]}
              contentFit="cover"
              transition={0}
              cachePolicy="memory-disk"
              priority="high"
              onLoad={handleLoad}
            />
          </Animated.View>
        </>
      ) : (
        <View style={[styles.image, styles.placeholderContainer, imageDebug]}>
          <Text style={styles.placeholderText}>Keine Vorschau</Text>
        </View>
      )}
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.8)']}
        style={[styles.gradient, gradientDebug]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        locations={[0.3, 1]}
      >
        <View style={[styles.textContainer, contentDebug]}>
          <Text style={[styles.title, { fontSize: titleFontSize, lineHeight: titleLineHeight }]} numberOfLines={3}>
            {story?.prompt}
          </Text>
          <View style={styles.footer}>
            <Text style={[styles.author, { fontSize: authorFontSize, lineHeight: authorLineHeight }]}>
              {story?.title}
            </Text>
          </View>
        </View>
      </LinearGradient>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  badgeContainer: {
    position: 'absolute',
    top: 8,
    right: 8,
    zIndex: 10,
  },
  badge: {
    backgroundColor: '#FFD700',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#181818',
  },
  voteContainerTop: {
    position: 'absolute',
    top: 8,
    right: 8,
    zIndex: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  placeholderContainer: {
    backgroundColor: '#1C1C1C',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    color: '#666666',
    fontSize: 14,
  },
  image: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  blurHashPlaceholder: {
    zIndex: 1,
  },
  gradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '100%',
  },
  textContainer: {
    padding: 20,
    flex: 1,
    justifyContent: 'flex-end',
  },
  title: {
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  author: {
    flex: 1,
    fontWeight: 'bold',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  pages: {
    opacity: 0.8,
  },
  voteContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  voteCount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFD700',
  },
  favoriteButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    zIndex: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    padding: 8,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
});

export default StoryCard;
