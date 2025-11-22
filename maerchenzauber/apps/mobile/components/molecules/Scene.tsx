// Firebase functionality temporarily disabled - see dataService.ts for placeholders
import React, { useState, useEffect } from 'react';
import { useDebugBorders } from '../../hooks/useDebugBorders';
import { View, StyleSheet, ScrollView, Dimensions, Pressable, TextInput, Alert, Animated, NativeSyntheticEvent, NativeScrollEvent, Image as RNImage } from 'react-native';
import { useRouter } from 'expo-router';
import { Image } from 'react-native';
import Text from '../atoms/Text';
import Button from '../atoms/Button';

interface SceneProps {
  images: { uri: string }[];
  texts: string[];
  textVariant?: 'header' | 'subheader' | 'body' | 'caption';
  textColor?: string;
  onPress?: () => void;
  variant?: 'story' | 'end' | 'start';
  onEndPress?: () => void;
  onRestartPress?: () => void;
  onArchivePress?: () => void;
  scrollViewRef?: React.RefObject<ScrollView>;
  onScroll?: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
  storyId?: string;
  uid?: string;
  characterName?: string;
}

const Scene: React.FC<SceneProps> = ({
  images,
  texts,
  textVariant = 'body',
  textColor = '#FFFFFF',
  onPress,
  variant = 'story',
  onEndPress,
  onRestartPress,
  onArchivePress,
  scrollViewRef,
  onScroll,
  storyId,
  uid,
  characterName,
}) => {
  const debugBorder = useDebugBorders('#FF0000');
  const debugBorderBlue = useDebugBorders('#0000FF');
  const debugBorderGreen = useDebugBorders('#00FF00');
  const [currentPage, setCurrentPage] = useState(1);
  const [feedbackText, setFeedbackText] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const toastOpacity = useState(new Animated.Value(0))[0];
  
  // Handle toast animation
  useEffect(() => {
    if (showToast) {
      Animated.sequence([
        Animated.timing(toastOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.delay(2000),
        Animated.timing(toastOpacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => setShowToast(false));
    }
  }, [showToast]);
  const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
  
  // Calculate image dimensions with max constraints
  const maxWidth = Math.min(500, screenWidth * 0.8); // Maximum width is 80% of screen width or 500px
  const maxHeight = Math.min(500, screenHeight * 0.45); // Maximum height is 45% of screen height or 500px
  const imageWidth = maxWidth;
  const imageHeight = maxHeight;
  
  // Calculate total content height to ensure proper vertical centering
  const textHeight = 250; // Reduziert für weniger Abstand
  const totalContentHeight = imageHeight + textHeight;
  // Minimaler Top-Padding von 20px für die Notch, reduziert von 40px
  const topPadding = Math.max(20, (screenHeight - totalContentHeight) / 3); // Reduziert von /2 auf /3

  return (
    <View style={{ flex: 1 }}>
      <ScrollView 
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        style={[styles.container, debugBorder, { margin: 0, padding: 0 }]}
        contentContainerStyle={{ padding: 0, margin: 0 }}
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        onMomentumScrollEnd={onScroll}
        scrollEventThrottle={16}
      >
      {images.map((image, index) => (
        <Pressable key={index} onPress={onPress} style={[styles.pageContainer, debugBorderBlue, { 
            width: screenWidth, 
            padding: 0, 
            margin: 0,
            paddingBottom: 0,
            paddingHorizontal: 0
          }]}>
          <View style={[styles.centerContainer, debugBorderGreen, { paddingTop: 10, marginTop: 0 }]}>
          <View style={styles.contentContainer}>
            {(index === 0 && texts[0] !== 'Ende' && images.length > 1) ? (
              <View style={styles.startContainer}>
                <View style={styles.backgroundDecoration}>
                  <RNImage 
                    source={require('../../assets/images/backgroundpattern-01.png')} 
                    style={styles.backgroundImage}
                    resizeMode="cover"
                  />
                </View>
                
                <View style={styles.startContent}>
                  <Text variant="header" color={textColor} style={styles.storyTitle}>
                    {texts[index]}
                  </Text>
                  {characterName && (
                    <Text variant="subheader" color="#FFFFFF" style={styles.startSubtitle}>
                      Eine Geschichte mit {characterName}
                    </Text>
                  )}
                  <Text variant="caption" color="rgba(255, 255, 255, 0.7)" style={styles.startHint}>
                    Wische um zu beginnen →
                  </Text>
                </View>
              </View>
            ) : (variant === 'end' && index === texts.length - 1) ? (
              <View style={styles.endContainer}>
                <View style={styles.backgroundDecoration}>
                  <RNImage 
                    source={require('../../assets/images/backgroundpattern-01.png')} 
                    style={styles.backgroundImage}
                    resizeMode="cover"
                  />
                </View>
                
                <View style={styles.centeredTextContainer}>
                  <Text variant="header" color={textColor} style={[styles.centeredText, { fontFamily: 'Grandstander_700Bold', fontSize: 60 }]}>
                    {texts[index]}
                  </Text>
                </View>
                
                <View style={styles.feedbackSection}>
                  <Text variant="subheader" color="#FFFFFF" style={styles.feedbackTitle}>
                    Schreibe uns dein Feedback
                  </Text>
                  <TextInput
                    style={styles.feedbackInput}
                    placeholder="Was hat dir gefallen? Was können wir verbessern?"
                    placeholderTextColor="rgba(255, 255, 255, 0.5)"
                    multiline
                    value={feedbackText}
                    onChangeText={setFeedbackText}
                  />
                  <Button
                    title={isSaving ? "Speichern..." : "Feedback senden"}
                    onPress={async () => {
                        if (!feedbackText.trim()) {
                          Alert.alert('Fehler', 'Bitte gib dein Feedback ein.');
                          return;
                        }
                        try {
                          setIsSaving(true);
                          const auth = getAuth();
                          const currentUser = auth.currentUser;
                          
                          if (!currentUser) {
                            Alert.alert('Error', 'You must be logged in to submit feedback');
                            return;
                          }
                          
                          const db = getFirestore();
                          await addDoc(collection(db, 'feedback'), {
                            uid: currentUser.uid,
                            storyId,
                            feedbackText: feedbackText.trim(),
                            createdAt: new Date(),
                          });
                          setFeedbackText('');
                          setShowToast(true);
                        } catch (error) {
                          console.error('Error saving feedback:', error);
                          Alert.alert('Fehler', 'Feedback konnte nicht gespeichert werden.');
                        } finally {
                          setIsSaving(false);
                        }
                      }}
                      color={feedbackText.trim() ? "#6D5B00" : "#333333"}
                      variant="primary"
                      size="lg"
                      style={{ width: '100%', marginTop: 8 }}
                    />
                </View>
                
                <View style={styles.actionsContainer}>
                  <Button
                    title="Ende"
                    onPress={onEndPress ? onEndPress : () => {}}
                    color="#666666"
                    variant="primary"
                    size="lg"
                    style={{ width: '100%', marginBottom: 8 }}
                    iconName="home"
                    iconPosition="left"
                  />
                  <Button
                    title="Nochmal"
                    onPress={onRestartPress ? onRestartPress : () => {}}
                    color="#444444"
                    variant="primary"
                    size="lg"
                    style={{ width: '100%', marginBottom: 8 }}
                    iconName="refresh"
                    iconPosition="left"
                  />
                  <Button
                    title="Archivieren"
                    onPress={onArchivePress ? onArchivePress : () => {}}
                    color="#222222"
                    variant="primary"
                    size="lg"
                    style={{ width: '100%' }}
                    iconName="archive"
                    iconPosition="left"
                  />
                </View>
              </View>
            ) : (
              <>
                <View style={[styles.imageContainer, debugBorder, { width: imageWidth, height: imageHeight }]}>
                  <Image
                    source={image}
                    width={imageWidth}
                    height={imageHeight}
                    resizeMode="cover"
                    borderRadius={8}
                  />
                </View>
                <View style={[styles.textContainer, debugBorderBlue, { width: imageWidth, marginTop: 0, paddingTop: 0 }]}>
                  <ScrollView 
                    style={[styles.textScroll, { marginTop: 0 }]}
                    contentContainerStyle={[styles.textScrollContent, { paddingTop: 0 }]}
                    showsVerticalScrollIndicator={false}
                  >
                    <Text variant={textVariant} color={textColor} style={styles.text}>
                      {texts[index]}
                    </Text>
                  </ScrollView>
                </View>
              </>
            )}
          </View>
          </View>

        </Pressable>
      ))}
      </ScrollView>
      
      {/* Success Toast */}
      {showToast && (
        <Animated.View style={[styles.toast, { opacity: toastOpacity }]}>
          <View style={styles.toastContent}>
            <Text variant="body" color="#FFFFFF" style={styles.toastText}>
              Vielen Dank für dein Feedback! 👍
            </Text>
          </View>
        </Animated.View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    bottom: 64,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
  },
  toastContent: {
    backgroundColor: 'rgba(46, 125, 50, 0.9)',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 30,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
    maxWidth: '80%',
  },
  toastText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },

  container: {
    flex: 1,
    padding: 0,
    margin: 0,
    paddingBottom: 0,
    paddingHorizontal: 0,
    backgroundColor: 'transparent',
  },
  pageContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    position: 'relative',
    width: '100%',
    height: '100%',
    minHeight: '100%',
    padding: 0,
    margin: 0,
    paddingBottom: 0,
    paddingHorizontal: 0,
  },
  centerContainer: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 0,
    marginTop: 0,
    flex: 1,
  },
  contentContainer: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 0,
    marginTop: 0,
    flex: 1,
    padding: 0,
    margin: 0,
  },
  imageContainer: {
    marginBottom: 16,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#242424',
    marginTop: 12, // Reduziert von 24 auf 12
  },
  textContainer: {
    paddingHorizontal: 0,
    paddingTop: 0,
    marginTop: 0,
    height: 500,
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
  },
  textScroll: {
    maxHeight: 400,
    marginTop: 0,
    paddingTop: 0,
    width: '100%',
  },
  textScrollContent: {
    flexGrow: 1,
    justifyContent: 'flex-start',
    paddingTop: 0,
    alignItems: 'flex-start',
    paddingHorizontal: 0,
  },
  pageNumberContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    zIndex: 1000,
  },
  startContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: '100%',
    paddingBottom: 0,
    paddingTop: 0,
    position: 'relative',
  },
  startContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 24,
    zIndex: 1,
  },
  storyTitle: {
    fontSize: 48,
    fontWeight: 'bold',
    textAlign: 'center',
    letterSpacing: 1,
    marginBottom: 16,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
    fontFamily: 'Grandstander_700Bold',
    lineHeight: 56,
  },
  startSubtitle: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 40,
    opacity: 0.9,
    fontWeight: '500',
  },
  startHint: {
    fontSize: 16,
    textAlign: 'center',
    fontStyle: 'italic',
    position: 'absolute',
    bottom: 60,
  },
  endContainer: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    height: '100%',
    paddingBottom: 0,
    paddingTop: 0,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
    width: '100%',
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  actionsContainer: {
    width: '100%',
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  primaryButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    gap: 8,
  },
  feedbackSection: {
    width: '100%',
    paddingHorizontal: 24,
    marginBottom: 30,
  },
  feedbackTitle: {
    marginBottom: 12,
    fontSize: 18,
    textAlign: 'left',
    width: '100%',
  },
  feedbackInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
    color: '#FFF',
    width: '100%',
    height: 60,
    textAlignVertical: 'top',
    marginBottom: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    fontSize: 16,
  },
  centeredTextContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 20,
  },
  centeredText: {
    fontSize: 42,
    fontWeight: 'bold',
    textAlign: 'center',
    letterSpacing: 1,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  centerContainerWide: {
    maxWidth: 600,
    alignSelf: 'center',
    width: '100%',
  },
  text: {
    fontSize: 18,
    lineHeight: 28,
    textAlign: 'left',
  },
  backgroundDecoration: {
    width: '100%',
    height: '100%',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignSelf: 'center',
    overflow: 'hidden',
    flex: 1,
  },
  backgroundImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.02,
    flex: 1,
  },
});

export default Scene;
