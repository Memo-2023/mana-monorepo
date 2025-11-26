import React from 'react';
import { TextInput, StyleSheet, View, TextInputProps, StyleProp, ViewStyle, TextStyle } from 'react-native';

export interface TextFieldProps extends Omit<TextInputProps, 'style'> {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  multiline?: boolean;
  numberOfLines?: number;
  style?: StyleProp<TextStyle>;
  placeholderTextColor?: string;
  variant?: 'default' | 'large';
}

const TextField: React.FC<TextFieldProps> = ({
  value,
  onChangeText,
  placeholder,
  multiline = false,
  style,
  placeholderTextColor = "#999",
  variant = 'default',
  ...rest
}) => {
  const variantStyles = variant === 'large' ? styles.large : {};
  const multilineVariantStyles = variant === 'large' && multiline ? styles.multilineLarge : multiline ? styles.multiline : {};

  return (
    <View style={styles.container}>
      <TextInput
        style={[styles.input, variantStyles, multilineVariantStyles, style]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={placeholderTextColor}
        multiline={multiline}
        {...rest}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginBottom: 16,
  },
  input: {
    backgroundColor: '#333',
    color: '#fff',
    padding: 12,
    borderRadius: 8,
    fontSize: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    width: '100%',
  },
  multiline: {
    height: 100,
    textAlignVertical: 'top',
    paddingTop: 12,
  },
  large: {
    padding: 16,
    borderRadius: 12,
    fontSize: 18,
  },
  multilineLarge: {
    height: 140,
    textAlignVertical: 'top',
    paddingTop: 16,
  },
});

export default TextField;