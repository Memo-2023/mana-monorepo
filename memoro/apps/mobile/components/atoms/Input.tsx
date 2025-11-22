import React, { forwardRef, useState } from 'react';
import { TextInput, TextInputProps, View, TouchableOpacity } from 'react-native';
import { useTheme } from '~/features/theme/ThemeProvider';
import { Icon } from './Icon';
import colors from 'tailwindcss/colors';

interface InputProps extends Omit<TextInputProps, 'placeholderTextColor'> {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  multiline?: boolean;
  numberOfLines?: number;
  textArea?: boolean; // Neue Eigenschaft für größere Texteingabefelder
  minHeight?: number; // Optionale benutzerdefinierte Mindesthöhe
  showPasswordToggle?: boolean; // Neue Eigenschaft für Passwort-Toggle
  textContentType?: TextInputProps['textContentType']; // iOS autofill support
  autoComplete?: TextInputProps['autoComplete']; // Android autofill support
}

// Keine StyleSheet-Styles mehr, wir verwenden NativeWind und direkte Style-Objekte

const Input = forwardRef<TextInput, InputProps>((props, ref) => {
  const {
    value,
    onChangeText,
    placeholder = '',
    secureTextEntry = false,
    showPasswordToggle = false,
    style,
    ...restProps
  } = props;

  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const { isDark, themeVariant } = useTheme();

  // Holen der Theme-Farben basierend auf der aktuellen Variante
  const themeColors = (colors as any).theme?.extend?.colors as Record<string, any>;

  // Textfarbe basierend auf dem Theme
  const textColor = isDark
    ? themeColors?.dark?.[themeVariant]?.text || '#FFFFFF'
    : themeColors?.[themeVariant]?.text || '#000000';

  // Rahmenfarbe basierend auf dem Theme
  const borderColor = isDark
    ? themeColors?.dark?.[themeVariant]?.border || '#424242'
    : themeColors?.[themeVariant]?.border || '#e6e6e6';

  // Hintergrundfarbe basierend auf dem Theme
  const bgColor = isDark
    ? themeColors?.dark?.[themeVariant]?.contentBackground || '#1E1E1E'
    : themeColors?.[themeVariant]?.contentBackground || '#FFFFFF';

  // Platzhalterfarbe
  const placeholderColor = isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)';

  // Extrahiere multiline und textArea aus den Props
  const { multiline = false, textArea = false, numberOfLines = 5 } = props;

  // Berechne die Mindesthöhe basierend auf den Props
  const calculatedMinHeight = props.minHeight || (textArea ? 150 : multiline ? 100 : undefined);

  // Bestimme ob das Passwort verborgen werden soll
  const shouldHidePassword = secureTextEntry && !isPasswordVisible;

  // Basis-Styles für alle Inputs
  const baseStyles = {
    height: multiline || textArea ? undefined : 48,
    minHeight: calculatedMinHeight,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingRight: secureTextEntry && showPasswordToggle ? 50 : 16,
    paddingVertical: multiline || textArea ? 12 : undefined,
    fontSize: 16,
    lineHeight: multiline || textArea ? 24 : undefined, // Erhöhter Zeilenabstand für mehrzeilige Eingaben
    width: '100%' as const, // TypeScript-Typ-Annotation
    borderWidth: 1,
    borderColor,
    color: textColor,
    backgroundColor: bgColor,
    textAlignVertical: multiline || textArea ? ('top' as const) : undefined,
  };

  if (secureTextEntry && showPasswordToggle) {
    return (
      <View style={{ position: 'relative', width: '100%' }}>
        <TextInput
          ref={ref}
          style={[baseStyles, style]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          secureTextEntry={shouldHidePassword}
          placeholderTextColor={placeholderColor}
          multiline={multiline || textArea}
          numberOfLines={textArea ? numberOfLines : undefined}
          {...restProps}
        />
        <TouchableOpacity
          style={{
            position: 'absolute',
            right: 12,
            top: 0,
            bottom: 0,
            justifyContent: 'center',
            alignItems: 'center',
            width: 32,
            height: '100%',
          }}
          onPress={() => setIsPasswordVisible(!isPasswordVisible)}
          activeOpacity={0.7}>
          <Icon
            name={isPasswordVisible ? 'eye-off-outline' : 'eye-outline'}
            size={20}
            color={placeholderColor}
          />
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <TextInput
      ref={ref}
      style={[baseStyles, style]}
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      secureTextEntry={secureTextEntry}
      placeholderTextColor={placeholderColor}
      multiline={multiline || textArea}
      numberOfLines={textArea ? numberOfLines : undefined}
      {...restProps}
    />
  );
});

Input.displayName = 'Input';

export default Input;
