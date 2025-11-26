import React, { useState, useEffect } from 'react';
import { Text, Pressable, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '~/features/theme/ThemeProvider';
import { useCredits } from '~/features/credits/CreditContext';
import colors from '~/tailwind.config.js';
import ManaIcon from './ManaIcon';

interface ManaCounterProps {
  count?: number;
}

/**
 * ManaCounter-Komponente
 * 
 * Zeigt einen Mana-Zähler mit einem blauen "M" und einer Zahl an.
 * Lädt die aktuellen Credits automatisch von der API, falls count nicht übergeben wird.
 * 
 * @param {number} count - Die anzuzeigende Zahl (optional, lädt automatisch von API)
 */
const ManaCounter: React.FC<ManaCounterProps> = ({
  count,
}) => {
  const { isDark, themeVariant, tw } = useTheme();
  const router = useRouter();
  const [isHovered, setIsHovered] = useState(false);

  // Use credit context for global state management
  const { credits: contextCredits, isLoading: contextLoading, refreshCredits } = useCredits();

  // Local state for when count prop is provided
  const [localCredits, setLocalCredits] = useState<number>(count || 0);

  // Determine which values to use
  const useLocalState = count !== undefined;
  const credits = useLocalState ? localCredits : (contextCredits ?? 0);
  const isLoading = useLocalState ? false : contextLoading;


  // Load credits when component mounts and count prop is not provided
  useEffect(() => {
    console.log('[ManaCounter] useEffect - useLocalState:', useLocalState, 'contextCredits:', contextCredits);
    if (!useLocalState && contextCredits === null) {
      console.log('[ManaCounter] Triggering credit refresh...');
      refreshCredits();
    }
  }, [useLocalState, contextCredits, refreshCredits]);

  // Handle local state when count prop is provided
  useEffect(() => {
    if (count !== undefined) {
      setLocalCredits(count);
    }
  }, [count]);

  // Handler für den Klick auf den Counter
  const handlePress = () => {
    router.push('/(protected)/subscription');
  };
  
  // Zugriff auf die Theme-Farben
  const themeColors = (colors as any).theme?.extend?.colors;
  
  // Verwende die Farben aus der Tailwind-Konfiguration
  const backgroundColor = isDark 
    ? themeColors?.dark?.[themeVariant]?.contentBackground || '#1E1E1E'
    : themeColors?.[themeVariant]?.contentBackground || '#FFFFFF';
  
  // Hover-Hintergrundfarbe aus der Tailwind-Konfiguration
  const hoverBackgroundColor = isDark
    ? themeColors?.dark?.[themeVariant]?.contentBackgroundHover || '#333333'
    : themeColors?.[themeVariant]?.contentBackgroundHover || '#f5f5f5';
  
  // Textfarbe und Randfarbe basierend auf dem Theme
  const textColor = isDark ? '#ffffff' : '#0047ab';
  const borderColor = isDark 
    ? themeColors?.dark?.[themeVariant]?.border || 'rgba(255, 255, 255, 0.1)'
    : themeColors?.[themeVariant]?.border || 'rgba(0, 0, 0, 0.1)';
  
  // Einheitliche Stile für den Container
  const containerClasses = 'flex-row items-center justify-center border rounded-full py-2 px-4 min-w-[80px] self-start';
  const iconSize = 22;
  const textClasses = 'font-medium text-lg';
  
  // Text-Klassen werden jetzt in getSizeStyles() definiert
  
  // Format credits as string with German locale for proper thousand separator
  const formattedCredits = credits.toLocaleString('de-DE');
  
  console.log('[ManaCounter] Rendering - credits:', credits, 'isLoading:', isLoading, 'useLocalState:', useLocalState);
  
  return (
    <Pressable 
      className={tw(containerClasses)}
      style={{
        backgroundColor: isHovered ? hoverBackgroundColor : backgroundColor,
        borderColor: borderColor,
        opacity: Platform.OS === 'web' && isHovered ? 0.9 : 1,
      }}
      onPress={handlePress}
      onHoverIn={() => Platform.OS === 'web' && setIsHovered(true)}
      onHoverOut={() => Platform.OS === 'web' && setIsHovered(false)}
    >
      <ManaIcon 
        size={iconSize} 
        color='#0099FF' 
        style={{ marginRight: 3, marginLeft: -6 }}
      />
      <Text className={tw(textClasses)} style={{ color: textColor }}>
        {isLoading ? '...' : formattedCredits}
      </Text>
    </Pressable>
  );
};

export default ManaCounter;
