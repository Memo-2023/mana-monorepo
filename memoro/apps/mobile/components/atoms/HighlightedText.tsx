import React from 'react';
import { Text } from 'react-native';
import { useTheme } from '~/features/theme/ThemeProvider';

interface HighlightedTextProps {
  text: string;
  searchQuery: string;
  style?: any;
  highlightStyle?: any;
  numberOfLines?: number;
  ellipsizeMode?: 'head' | 'middle' | 'tail' | 'clip';
  currentResultIndex?: number;
  searchResults?: Array<{id: string; type: string; text: string; index: number; matchIndex: number}>;
  textType?: string; // 'title', 'intro', 'transcript', etc.
}

/**
 * HighlightedText Component
 * 
 * Renders text with highlighted search matches.
 * Supports case-insensitive search highlighting.
 */
const HighlightedText: React.FC<HighlightedTextProps> = (props) => {
  // Destructure with safe defaults
  const {
    text = '',
    searchQuery = '',
    style,
    highlightStyle,
    numberOfLines,
    ellipsizeMode = 'tail',
    currentResultIndex,
    searchResults = [],
    textType = ''
  } = props || {};

  let isDark = false;
  let themeVariant = 'lume';
  
  // Safely try to get theme
  try {
    const theme = useTheme();
    isDark = theme?.isDark || false;
    themeVariant = theme?.themeVariant || 'lume';
  } catch (error) {
    console.warn('Theme hook failed, using defaults');
  }

  const getHighlightedText = () => {
    // Early return if no text or search query
    if (!text || !searchQuery?.trim()) {
      return [{ text: text || '', isHighlighted: false, isCurrent: false }];
    }

    try {
      // Create regex safely
      const escapedQuery = String(searchQuery).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`(${escapedQuery})`, 'gi');
      
      // Split text safely
      const parts = String(text).split(regex);
      
      // If no valid search results, just highlight all matches in yellow
      if (!searchResults || !Array.isArray(searchResults) || searchResults.length === 0) {
        return parts.map((part, index) => ({
          text: part || '',
          isHighlighted: index % 2 === 1,
          isCurrent: false
        }));
      }

      // Check if we have a valid current result index
      const validCurrentIndex = typeof currentResultIndex === 'number' && 
                               currentResultIndex >= 0 && 
                               currentResultIndex < searchResults.length;

      if (!validCurrentIndex) {
        // No valid current index, highlight all in yellow
        return parts.map((part, index) => ({
          text: part || '',
          isHighlighted: index % 2 === 1,
          isCurrent: false
        }));
      }

      // Get current result safely
      const currentResult = searchResults[currentResultIndex];
      if (!currentResult || !textType) {
        return parts.map((part, index) => ({
          text: part || '',
          isHighlighted: index % 2 === 1,
          isCurrent: false
        }));
      }

      // Check if this text matches the current result
      const isCurrentTextAndType = currentResult.type === textType && currentResult.text === text;
      
      let currentMatchIndexInThisText = -1;
      if (isCurrentTextAndType) {
        try {
          // Count matches in this text that come before the current result
          currentMatchIndexInThisText = searchResults
            .slice(0, currentResultIndex)
            .filter(r => r && r.type === textType && r.text === text)
            .length;
        } catch (error) {
          currentMatchIndexInThisText = -1;
        }
      }
      
      let matchCounter = 0;
      
      return parts.map((part, index) => {
        const isMatch = index % 2 === 1;
        let isCurrent = false;
        
        if (isMatch) {
          isCurrent = isCurrentTextAndType && matchCounter === currentMatchIndexInThisText;
          matchCounter++;
        }
        
        return {
          text: part || '',
          isHighlighted: isMatch,
          isCurrent: isCurrent
        };
      });

    } catch (error) {
      console.warn('Error in getHighlightedText:', error);
      // Fallback: return text without highlighting
      return [{ text: text || '', isHighlighted: false, isCurrent: false }];
    }
  };

  try {
    const textParts = getHighlightedText();

    return (
      <Text style={style} numberOfLines={numberOfLines} ellipsizeMode={ellipsizeMode}>
        {textParts.map((part, index) => {
          let partHighlightStyle = undefined;
          
          if (part.isHighlighted) {
            const backgroundColor = part.isCurrent 
              ? (isDark ? '#FF6B35' : '#FF9500') // Orange for current result
              : (isDark ? '#FFD60A' : '#FFEB3B'); // Yellow for other results
              
            partHighlightStyle = {
              backgroundColor,
              color: isDark ? '#000000' : '#000000',
              fontWeight: '600',
            };
          }
          
          return (
            <Text key={index} style={partHighlightStyle}>
              {part.text}
            </Text>
          );
        })}
      </Text>
    );
  } catch (error) {
    console.warn('Error rendering HighlightedText:', error);
    // Ultimate fallback: just render plain text
    return <Text style={style}>{text || ''}</Text>;
  }
};

export default HighlightedText;