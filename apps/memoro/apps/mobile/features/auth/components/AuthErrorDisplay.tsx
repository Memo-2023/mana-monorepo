import React, { useEffect } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import Text from '~/components/atoms/Text';
import Icon from '~/components/atoms/Icon';

interface AuthErrorDisplayProps {
  error: string | null;
  style?: object;
}

const AuthErrorDisplay: React.FC<AuthErrorDisplayProps> = ({ error, style }) => {
  const opacity = new Animated.Value(0);
  const translateY = new Animated.Value(-10);

  useEffect(() => {
    if (error) {
      // Reset and animate in when a new error appears
      opacity.setValue(0);
      translateY.setValue(-10);
      
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Animate out when error is cleared
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: -10,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [error]);

  if (!error) return null;

  return (
    <Animated.View 
      style={[
        styles.container, 
        { 
          opacity, 
          transform: [{ translateY }],
        },
        style
      ]}
    >
      <View style={styles.iconContainer}>
        <Icon name="alert-circle" size={20} color="#e53935" />
      </View>
      <Text variant="body" style={styles.text}>{error}</Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(229, 57, 53, 0.1)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  iconContainer: {
    marginRight: 8,
  },
  text: {
    color: '#e53935',
    flex: 1,
  },
});

export default AuthErrorDisplay;