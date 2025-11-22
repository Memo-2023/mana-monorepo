import React from 'react';
import { Switch, Platform } from 'react-native';
import { useTheme } from '~/features/theme/ThemeProvider';
import colors from '~/tailwind.config.js';

interface ToggleProps {
  isOn: boolean;
  onToggle: (value: boolean) => void;
  disabled?: boolean;
  size?: 'small' | 'medium' | 'large';
}

/**
 * Toggle-Komponente
 *
 * Eine native Switch-Komponente, die die Primary-Farbe aus der Tailwind-Konfiguration verwendet.
 *
 * @param {boolean} isOn - Der aktuelle Zustand des Toggles (an/aus)
 * @param {function} onToggle - Callback-Funktion, die beim Umschalten aufgerufen wird
 * @param {boolean} disabled - Ob der Toggle deaktiviert ist
 * @param {string} size - Die Größe des Toggles (wird auf iOS ignoriert, da native Größe verwendet wird)
 */
const Toggle: React.FC<ToggleProps> = ({
  isOn,
  onToggle,
  disabled = false,
  size = 'medium',
}) => {
  const { isDark, themeVariant } = useTheme();

  // Zugriff auf die Theme-Farben
  const themeColors = (colors as any).theme?.extend?.colors;

  // Primary-Farbe direkt aus der Tailwind-Konfiguration
  const primaryColor = isDark
    ? themeColors?.dark?.[themeVariant]?.primary || '#f8d62b'
    : themeColors?.[themeVariant]?.primary || '#f8d62b';

  // Track-Farbe (Hintergrund) für iOS
  const trackColor = {
    false: isDark ? '#3A3A3A' : '#E0E0E0',
    true: primaryColor,
  };

  // Thumb-Farbe (Kreis)
  const thumbColor = Platform.OS === 'ios' ? '#FFFFFF' : (isOn ? primaryColor : '#F4F3F4');

  return (
    <Switch
      value={isOn}
      onValueChange={onToggle}
      disabled={disabled}
      trackColor={trackColor}
      thumbColor={thumbColor}
      ios_backgroundColor={trackColor.false}
    />
  );
};

export default Toggle;
