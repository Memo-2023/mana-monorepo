import React, { useState, useRef, useEffect, useMemo } from 'react';
import { View, ScrollView, Dimensions, StyleSheet, Pressable, NativeSyntheticEvent, NativeScrollEvent, Platform } from 'react-native';
import { useTheme } from '~/features/theme/ThemeProvider';
import Markdown from 'react-native-markdown-display';
import { createClient } from '@supabase/supabase-js';
import colors from '~/tailwind.config.js';

interface AdviceSection {
  id: string;
  content: {
    de?: string;
    en?: string;
  };
  order: number;
}

interface AdviceData {
  sections: AdviceSection[];
  metadata: {
    version: string;
    lastUpdated: string;
    supportedLanguages: string[];
  };
}

interface AdviceCarouselProps {
  blueprintId: string | null;
  language?: string;
}

const AdviceCarousel: React.FC<AdviceCarouselProps> = ({
  blueprintId,
  language = 'de', // Default to German
}) => {
  const { isDark, themeVariant } = useTheme();
  const [advice, setAdvice] = useState<AdviceData | null>(null);
  const [loading, setLoading] = useState(false);
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);
  const isScrollingRef = useRef(false);
  const screenWidth = Dimensions.get('window').width;

  // Direkter Zugriff auf die Datenbank für Blueprints
  const supabase = createClient(
    'https://npgifbrwhftlbrbaglmi.supabase.co',
    'sb_publishable_HlAZpB4BxXaMcfOCNx6VJA_-64NTxu4'
  );

  // Direkter Zugriff auf die Farben aus der Tailwind-Konfiguration - exakt wie in PillFilter
  const menuBackgroundColor = useMemo(() => {
    const themeColors = (colors as any).theme?.extend?.colors as Record<string, any>;
    return isDark 
      ? themeColors?.dark?.[themeVariant]?.menuBackground || '#252525'
      : themeColors?.[themeVariant]?.menuBackground || '#FFFFFF';
  }, [isDark, themeVariant]);

  const textColor = isDark ? '#FFFFFF' : '#000000';

  // Lade Advice-Daten aus der Datenbank
  useEffect(() => {
    const fetchAdvice = async () => {
      if (!blueprintId) {
        setAdvice(null);
        return;
      }

      try {
        setLoading(true);
        
        const { data, error } = await supabase
          .from('blueprints')
          .select('advice')
          .eq('id', blueprintId)
          .single();
          
        if (error) {
          console.debug('Fehler beim Laden des Advice:', error.message);
          return;
        }
        
        if (data && data.advice) {
          setAdvice(data.advice as AdviceData);
          setCurrentSectionIndex(0); // Reset to first section when blueprint changes
        } else {
          setAdvice(null);
        }
      } catch (err) {
        console.debug('Unerwarteter Fehler:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchAdvice();
  }, [blueprintId]);

  // Scroll to the current section
  useEffect(() => {
    if (scrollViewRef.current && advice?.sections && advice.sections.length > 0 && !isScrollingRef.current) {
      // Ensure the index is within bounds
      const boundedIndex = Math.max(0, Math.min(currentSectionIndex, advice.sections.length - 1));
      
      isScrollingRef.current = true;
      scrollViewRef.current.scrollTo({
        x: boundedIndex * screenWidth,
        animated: true,
      });
      
      // Reset scroll flag after animation
      setTimeout(() => {
        isScrollingRef.current = false;
      }, 300);
    }
  }, [currentSectionIndex, screenWidth, advice]);

  // Handle scroll to update current section index (more responsive)
  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (isScrollingRef.current || !advice?.sections) return;
    
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    
    // Use Math.round for more accurate calculation on Android
    let newIndex = Math.round(contentOffsetX / screenWidth);
    
    // Ensure bounds checking
    newIndex = Math.max(0, Math.min(newIndex, advice.sections.length - 1));
    
    // Only update if we're close enough to a page boundary (helps with Android precision)
    const exactPosition = contentOffsetX / screenWidth;
    const distanceFromPage = Math.abs(exactPosition - newIndex);
    
    if (distanceFromPage < 0.5 && newIndex !== currentSectionIndex) {
      setCurrentSectionIndex(newIndex);
    }
  };

  // Handle scroll end to ensure final position is correct
  const handleScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (!advice?.sections) return;
    
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    let newIndex = Math.round(contentOffsetX / screenWidth);
    
    // Ensure bounds checking
    newIndex = Math.max(0, Math.min(newIndex, advice.sections.length - 1));
    
    if (newIndex !== currentSectionIndex) {
      setCurrentSectionIndex(newIndex);
    }
    
    isScrollingRef.current = false;
  };

  // If no blueprint selected or no advice available
  if (!blueprintId || !advice || !advice.sections || (advice.sections && advice.sections.length <= 0)) {
    return null;
  }

  // Sort sections by order
  const sortedSections = [...advice.sections].sort((a, b) => a.order - b.order);

  // Einfacherer Markdown-Style ohne Überschriften
  const markdownStyles = {
    body: {
      color: textColor,
      fontSize: 16, // Größere Schrift für bessere Lesbarkeit
    },
    paragraph: {
      color: textColor,
      marginBottom: 0, // Kein Abstand zwischen Absätzen, da wir nur einen Tipp pro Seite haben
      marginTop: 0, // Kein Abstand nach oben
      lineHeight: 24, // Größerer Zeilenabstand für bessere Lesbarkeit
      textAlign: 'center', // Zentrierter Text
      fontWeight: '500', // Etwas fetter für bessere Lesbarkeit
    },
    // Andere Markdown-Elemente werden nicht benötigt, da wir nur einfachen Text anzeigen
  };

  return (
    <View style={[styles.container, { backgroundColor: menuBackgroundColor }]}>
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        onMomentumScrollEnd={handleScrollEnd}
        scrollEventThrottle={16}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollViewContent}
        // Android-specific improvements
        removeClippedSubviews={Platform.OS === 'android'}
        snapToAlignment="center"
      >
        {sortedSections.map((section, index) => (
          <View 
            key={section.id} 
            style={[
              styles.sectionContainer, 
              { 
                width: screenWidth, // Volle Bildschirmbreite
                backgroundColor: menuBackgroundColor
              }
            ]}
          >
            {/* Keine Überschrift mehr */}
            <View style={styles.contentContainer}>
              <Markdown
                style={markdownStyles}
              >
                {section.content[language as keyof typeof section.content] || 
                 section.content.en || 
                 section.content.de || 
                 'No content available'}
              </Markdown>
            </View>
          </View>
        ))}
      </ScrollView>
      
      {/* Pagination dots */}
      <View style={styles.paginationContainer}>
        {sortedSections.map((_, index) => (
          <Pressable
            key={index}
            style={[
              styles.paginationDot,
              index === currentSectionIndex && styles.paginationDotActive,
              { 
                backgroundColor: index === currentSectionIndex 
                  ? (isDark ? '#FFFFFF' : '#000000') 
                  : (isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)') 
              }
            ]}
            onPress={() => {
              if (index >= 0 && index < sortedSections.length) {
                setCurrentSectionIndex(index);
              }
            }}
          />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  scrollView: {
    // Keine feste Höhe, damit die Komponente so groß wie ihr Inhalt ist
  },
  scrollViewContent: {
    // Keine alignItems hier, da es mit pagingEnabled Probleme verursachen kann
  },
  sectionContainer: {
    marginHorizontal: 0,
    borderRadius: 0, // Keine Rundungen, wie bei PillFilter
    paddingHorizontal: 20, // Konsistente horizontale Abstände
    paddingVertical: 8, // Reduzierte vertikale Abstände
    // Keine Schatten, um den gleichen Look wie PillFilter zu haben
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  contentContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 40, // Reduzierte Mindesthöhe
    paddingVertical: 8, // Etwas mehr vertikaler Abstand
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8, // Verringerter Abstand zwischen Text und Indikator
    marginBottom: 8, // Erhöhter Abstand zwischen Indikator und unterem Rand
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  paginationDotActive: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
});

export default AdviceCarousel;
