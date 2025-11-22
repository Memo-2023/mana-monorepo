import React, { useEffect, useState, useRef } from 'react';
import { View, StyleSheet, Animated, Easing, Dimensions } from 'react-native';
import Text from '../atoms/Text';
import { MaterialCommunityIcons } from '@expo/vector-icons';

type LoadingContext = 'character' | 'story' | 'image' | 'saving' | 'loading' | 'cuddly_toy';

const magicalPhrases: Record<LoadingContext, string[]> = {
  character: [
    "Zauberstaub wird gesammelt...",
    "Charaktere erwachen zum Leben...",
    "Magische Eigenschaften werden geformt...",
    "Persönlichkeit wird erschaffen...",
    "Die Geschichte deines Charakters beginnt...",
    "Kreative Funken fliegen...",
    "Charakterzüge werden verfeinert..."
  ],
  cuddly_toy: [
    "Dein Kuscheltier wird zum Leben erweckt...",
    "Magische Verwandlung beginnt...",
    "Persönlichkeit wird erschaffen...",
    "Charakter nimmt Gestalt an...",
    "Zauberhafte Details werden hinzugefügt...",
    "Fast fertig, gleich ist es soweit...",
    "Letzte magische Berührungen..."
  ],
  story: [
    "Märchenwelten öffnen sich...",
    "Magische Tinte fließt...",
    "Geschichten weben sich...",
    "Abenteuer entfalten sich...",
    "Zauberhafte Momente entstehen...",
    "Fantasie nimmt Gestalt an...",
    "Worte tanzen auf Seiten..."
  ],
  image: [
    "Bilder werden zum Leben erweckt...",
    "Farben und Formen verschmelzen...",
    "Künstliche Kreativität entfaltet sich...",
    "Visuelle Magie wird erschaffen...",
    "Digitale Leinwand wird bemalt..."
  ],
  saving: [
    "Deine Kreation wird gesichert...",
    "Magische Speicherung läuft...",
    "Daten werden in Sternenstaub verwandelt...",
    "Fortschritt wird konserviert..."
  ],
  loading: [
    "Daten werden aus dem Äther geholt...",
    "Magische Verbindungen werden hergestellt...",
    "Informationen materialisieren sich...",
    "Digitale Schätze werden geborgen..."
  ]
};

interface MagicalLoadingScreenProps {
  context: LoadingContext;
}

export default function MagicalLoadingScreen({ context }: MagicalLoadingScreenProps) {
  const phrases = magicalPhrases[context];
  const [currentPhrase, setCurrentPhrase] = useState(0);
  const [animations] = useState(() => ({
    sparkleRotation: new Animated.Value(0),
    sparkleScale: new Animated.Value(0.3),
    glowOpacity: new Animated.Value(0.4),
    textOpacity: new Animated.Value(1)
  }));
  
  const textOpacityRef = useRef(animations.textOpacity);

  useEffect(() => {
    const startAnimations = () => {
      // Rotation Animation
      Animated.loop(
        Animated.timing(animations.sparkleRotation, {
          toValue: 1,
          duration: 4000,
          easing: Easing.linear,
          useNativeDriver: true
        })
      ).start();

      // Scale Animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(animations.sparkleScale, {
            toValue: 1,
            duration: 1500,
            easing: Easing.bezier(0.4, 0, 0.2, 1),
            useNativeDriver: true
          }),
          Animated.timing(animations.sparkleScale, {
            toValue: 0.3,
            duration: 1500,
            easing: Easing.bezier(0.4, 0, 0.2, 1),
            useNativeDriver: true
          })
        ])
      ).start();

      // Glow Animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(animations.glowOpacity, {
            toValue: 1,
            duration: 1000,
            easing: Easing.bezier(0.4, 0, 0.2, 1),
            useNativeDriver: true
          }),
          Animated.timing(animations.glowOpacity, {
            toValue: 0.4,
            duration: 1000,
            easing: Easing.bezier(0.4, 0, 0.2, 1),
            useNativeDriver: true
          })
        ])
      ).start();
    };

    startAnimations();

    // Phrase rotation with fade effect
    const interval = setInterval(() => {
      // Fade out - slower animation (800ms instead of 500ms)
      Animated.timing(textOpacityRef.current, {
        toValue: 0,
        duration: 800,
        easing: Easing.ease,
        useNativeDriver: true
      }).start(() => {
        // Change phrase when fully faded out
        setCurrentPhrase((prev) => (prev + 1) % phrases.length);
        
        // Fade in - slower animation (800ms instead of 500ms)
        Animated.timing(textOpacityRef.current, {
          toValue: 1,
          duration: 800,
          easing: Easing.ease,
          useNativeDriver: true
        }).start();
      });
    }, 6000); // Longer display time (6000ms instead of 4000ms)

    return () => clearInterval(interval);
  }, [phrases]);

  const spin = animations.sparkleRotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg']
  });

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Animated.View
          style={[
            styles.sparkleContainer,
            {
              transform: [
                { rotate: spin },
                { scale: animations.sparkleScale }
              ],
              opacity: animations.glowOpacity
            }
          ]}
        >
          <MaterialCommunityIcons name="star-four-points" size={80} color="#FFD700" />
        </Animated.View>
        <Animated.View style={{ opacity: animations.textOpacity, paddingHorizontal: 32 }}>
          <Text style={styles.loadingText}>
            {phrases[currentPhrase]}
          </Text>
        </Animated.View>
      </View>
      <View style={styles.infoContainer}>
        <Text style={styles.infoText}>
          Die Verarbeitung dauert circa eine Minute, du kannst die App auch schließen.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  sparkleContainer: {
    marginBottom: 20,
  },
  loadingText: {
    color: '#FFD700',
    fontSize: 20,
    textAlign: 'center',
    marginTop: 20,
    fontFamily: 'serif',
    fontWeight: 'bold', // Text fetter machen
    minHeight: 60, // Fixed height to prevent layout shifts during text changes
    minWidth: 280, // Minimum width to maintain consistent layout
    paddingHorizontal: 20, // Additional padding within the text component
    lineHeight: 30, // Increased line height for better readability
  },
  infoContainer: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  infoText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
    textAlign: 'center',
    fontFamily: 'system',
    maxWidth: 300,
  },
});
