import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { ReactNode } from 'react';

interface ButtonProps {
  onPress: () => void;
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'outline';
  loading?: boolean;
  disabled?: boolean;
}

export const Button = ({ 
  onPress, 
  children, 
  variant = 'primary', 
  loading = false,
  disabled = false 
}: ButtonProps) => {
  return (
    <TouchableOpacity 
      onPress={onPress}
      disabled={loading || disabled}
      style={[
        styles.button,
        styles[variant],
        (loading || disabled) && styles.disabled
      ]}
    >
      {loading ? (
        <ActivityIndicator color="#fff" />
      ) : (
        <Text style={[styles.text, styles[`${variant}Text`]]}>
          {children}
        </Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 200,
  },
  primary: {
    backgroundColor: '#f4511e',
  },
  secondary: {
    backgroundColor: '#6200ee',
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#f4511e',
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  primaryText: {
    color: '#fff',
  },
  secondaryText: {
    color: '#fff',
  },
  outlineText: {
    color: '#f4511e',
  },
});