import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Dimensions, Animated, Pressable, TextInput, KeyboardAvoidingView, Platform, TouchableOpacity, useWindowDimensions } from 'react-native';
import { Image } from 'expo-image';
import Text from '../atoms/Text';
import Button from '../atoms/Button';

interface StoryPageProps {
  imageUri: string;
  text: string;
  blurhash?: string;
  pageNumber?: number;
  onImagePress?: () => void;
  isEditMode?: boolean;
  onTextChange?: (newText: string) => void;
  onCancelEdit?: () => void;
  onSaveEdit?: () => void;
}

export default function StoryPage({ imageUri, text, blurhash, pageNumber = 0, onImagePress, isEditMode = false, onTextChange, onCancelEdit, onSaveEdit }: StoryPageProps) {
  const [opacity] = useState(new Animated.Value(0));
  const scrollViewRef = useRef<ScrollView>(null);
  const textInputRef = useRef<TextInput>(null);
  const [localText, setLocalText] = useState(text);

  // Use useWindowDimensions for dynamic screen size updates
  const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = useWindowDimensions();

  // Update local text when prop changes
  useEffect(() => {
    setLocalText(text);
  }, [text]);

  const handleLoad = () => {
    Animated.timing(opacity, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const handleTextChange = (newText: string) => {
    setLocalText(newText);
    onTextChange?.(newText);
  };

  const handleTextInputFocus = () => {
    // Scroll to bottom when TextInput is focused to make it visible above keyboard
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 300);
  };
  // Detect if device is tablet (iPad)
  const isTablet = SCREEN_WIDTH >= 768;
  // Detect if device is in landscape mode (wide screen)
  const isLandscape = SCREEN_WIDTH > SCREEN_HEIGHT;
  const isWideLayout = isTablet && isLandscape;

  // Determine if text should be on left or right (alternating)
  const isTextOnLeft = pageNumber % 2 === 0;

  // Calculate dynamic spacing and text height based on screen size
  const topPadding = isTablet && !isWideLayout ? 60 : 0; // More top padding on tablet portrait
  const imageSpacing = 0; // No space between image and text - gradient sits directly under image
  const horizontalPadding = isTablet ? 40 : 24; // Horizontal padding for container (same for image and text)

  // Calculate responsive image dimensions
  let imageWidth, imageHeight;
  if (isWideLayout) {
    // Landscape: Image takes about 50% of width
    const availableWidth = SCREEN_WIDTH / 2 - horizontalPadding * 2;
    imageWidth = Math.min(500, availableWidth);
    imageHeight = imageWidth * (4 / 3); // 3:4 aspect ratio (portrait)
  } else {
    // Portrait: Image width = screen width minus horizontal padding on both sides
    const availableWidth = SCREEN_WIDTH - (horizontalPadding * 2);
    imageWidth = isTablet
      ? Math.min(600, availableWidth)
      : Math.min(400, availableWidth);
    imageHeight = imageWidth * (4 / 3); // 3:4 aspect ratio (portrait)
  }

  // Scroll down slightly on mount to create initial spacing under image
  useEffect(() => {
    // Small delay to ensure layout is complete
    const timer = setTimeout(() => {
      scrollViewRef.current?.scrollTo({ y: 15, animated: false });
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <KeyboardAvoidingView
      style={styles.outerContainer}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={0}
    >
      {/* Landscape iPad Layout: Text and Image side by side */}
      {isWideLayout && !isEditMode ? (
        <Pressable style={styles.landscapeContainer} onPress={onImagePress}>
          {isTextOnLeft ? (
            <>
              {/* Text Left */}
              <View style={styles.landscapeTextContainer}>
                <Text
                  variant="body"
                  color="#FFFFFF"
                  style={styles.textWide}
                >
                  {localText}
                </Text>
              </View>
              {/* Image Right */}
              <View style={styles.landscapeImageContainer}>
                <Pressable onPress={onImagePress} style={[styles.imageContainer, { width: imageWidth, height: imageHeight }]}>
                  <Animated.View style={{ opacity, width: '100%', height: '100%' }}>
                    <Image
                      source={{ uri: imageUri }}
                      style={styles.image}
                      contentFit="cover"
                      placeholder={blurhash ? { blurhash } : undefined}
                      transition={0}
                      cachePolicy="memory-disk"
                      priority="high"
                      onLoad={handleLoad}
                    />
                  </Animated.View>
                </Pressable>
              </View>
            </>
          ) : (
            <>
              {/* Image Left */}
              <View style={styles.landscapeImageContainer}>
                <Pressable onPress={onImagePress} style={[styles.imageContainer, { width: imageWidth, height: imageHeight }]}>
                  <Animated.View style={{ opacity, width: '100%', height: '100%' }}>
                    <Image
                      source={{ uri: imageUri }}
                      style={styles.image}
                      contentFit="cover"
                      placeholder={blurhash ? { blurhash } : undefined}
                      transition={0}
                      cachePolicy="memory-disk"
                      priority="high"
                      onLoad={handleLoad}
                    />
                  </Animated.View>
                </Pressable>
              </View>
              {/* Text Right */}
              <View style={styles.landscapeTextContainer}>
                <Text
                  variant="body"
                  color="#FFFFFF"
                  style={styles.textWide}
                >
                  {localText}
                </Text>
              </View>
            </>
          )}
        </Pressable>
      ) : (
        /* Portrait/Phone Layout: Image on top, text below */
        <Pressable style={[styles.container, { paddingTop: topPadding, paddingHorizontal: horizontalPadding }]} onPress={onImagePress}>
          {/* Image at top */}
          <View style={styles.imageWrapper}>
            <Pressable onPress={onImagePress} style={[styles.imageContainer, { width: imageWidth, height: imageHeight }]}>
              <Animated.View style={{ opacity, width: '100%', height: '100%' }}>
                <Image
                  source={{ uri: imageUri }}
                  style={styles.image}
                  contentFit="cover"
                  placeholder={blurhash ? { blurhash } : undefined}
                  transition={0}
                  cachePolicy="memory-disk"
                  priority="high"
                  onLoad={handleLoad}
                />
              </Animated.View>
            </Pressable>
          </View>

          {/* Text below image - scrollable on phone, static on tablet (hidden in edit mode) */}
          {!isEditMode && (
            <View style={[styles.textWrapper, { marginTop: imageSpacing }]}>
              {isTablet ? (
                // Tablet Portrait: Static text, no scroll, centered with max width
                <View style={styles.textTabletContainer}>
                  <Text
                    variant="body"
                    color="#FFFFFF"
                    style={styles.textTablet}
                  >
                    {localText}
                  </Text>
                </View>
              ) : (
                // Phone: Scrollable text
                <>
                  <ScrollView
                    ref={scrollViewRef}
                    style={styles.textScroll}
                    contentContainerStyle={styles.textScrollContent}
                    showsVerticalScrollIndicator={true}
                    persistentScrollbar={true}
                    indicatorStyle="white"
                    scrollIndicatorInsets={{ right: 2 }}
                    bounces={false}
                  >
                    <Text
                      variant="body"
                      color="#FFFFFF"
                      style={styles.text}
                    >
                      {localText}
                    </Text>
                  </ScrollView>
                </>
              )}
            </View>
          )}
        </Pressable>
      )}

        {/* Edit Mode Overlay - TextInput over the image */}
        {isEditMode && (
          <View style={styles.editOverlay} pointerEvents="box-none">
            <View style={[styles.editOverlayContent, { width: imageWidth, height: imageHeight }]}>
              <ScrollView
                style={styles.editOverlayScroll}
                contentContainerStyle={styles.editOverlayScrollContent}
                showsVerticalScrollIndicator={true}
                persistentScrollbar={true}
                indicatorStyle="white"
                bounces={false}
                keyboardShouldPersistTaps="handled"
              >
                <TextInput
                  value={localText}
                  onChangeText={handleTextChange}
                  multiline
                  style={[
                    styles.editOverlayInput,
                    isTablet && styles.textTablet,
                  ]}
                  placeholderTextColor="#AAAAAA"
                  placeholder="Text bearbeiten..."
                  autoCorrect={true}
                  spellCheck={true}
                  autoFocus={true}
                />
              </ScrollView>

              {/* Action Buttons */}
              <View style={styles.editOverlayButtons}>
                <Button
                  title="Abbrechen"
                  onPress={onCancelEdit}
                  variant="tonal"
                  size="md"
                  color="#666666"
                  style={styles.editButton}
                />
                <Button
                  title="Speichern"
                  onPress={onSaveEdit}
                  variant="primary"
                  size="md"
                  color="#4CAF50"
                  iconName="check"
                  iconPosition="left"
                  style={styles.editButton}
                />
              </View>
            </View>
          </View>
        )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
    width: '100%',
    height: '100%',
    position: 'relative',
    backgroundColor: '#121212',
  },
  container: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    backgroundColor: '#121212',
    // paddingTop, paddingHorizontal, paddingBottom set dynamically
  },
  imageWrapper: {
    width: '100%',
    alignItems: 'center',
  },
  imageContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#242424',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  textWrapper: {
    flex: 1,
    width: '100%',
    position: 'relative',
    // marginTop set dynamically
  },
  textScroll: {
    flex: 1,
  },
  textScrollContent: {
    paddingTop: 30, // Top padding for initial scroll spacing - reduced from 60
    paddingBottom: 100, // Bottom padding for scrolling up + gradient space
    paddingHorizontal: 8, // Horizontal padding to prevent text from touching edges
  },
  text: {
    fontSize: 18,
    lineHeight: 28,
    textAlign: 'left',
  },
  textInput: {
    color: '#FFFFFF',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(76, 175, 80, 0.3)',
    borderRadius: 8,
    padding: 12,
    minHeight: 200,
    maxHeight: 400,
    textAlignVertical: 'top',
  },
  textTabletContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 80,
    paddingTop: 10,
    paddingBottom: 40,
  },
  textTablet: {
    fontSize: 30, // Larger font size for tablets
    lineHeight: 46, // More line height for better readability
    textAlign: 'left',
    maxWidth: 600, // Limit text width for better readability
  },
  landscapeContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 60,
    gap: 60,
    backgroundColor: '#121212',
  },
  landscapeTextContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    maxWidth: 500, // Limit text width in landscape - wider for better readability
  },
  landscapeImageContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  textWide: {
    fontSize: 28,
    lineHeight: 42,
    textAlign: 'left',
    color: '#FFFFFF',
    width: '100%',
  },
  // Edit Mode Overlay Styles
  editOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 0,
  },
  editOverlayContent: {
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(76, 175, 80, 0.5)',
    flexDirection: 'column',
  },
  editOverlayScroll: {
    flex: 1,
  },
  editOverlayScrollContent: {
    padding: 16,
    paddingBottom: 8,
  },
  editOverlayInput: {
    color: '#FFFFFF',
    fontSize: 18,
    lineHeight: 28,
    textAlign: 'left',
    minHeight: 150,
  },
  editOverlayButtons: {
    flexDirection: 'row',
    gap: 12,
    padding: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  editButton: {
    flex: 1,
  },
});
