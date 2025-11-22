import React, { useState } from 'react';
import { StyleSheet, View, Platform, Alert, ActivityIndicator, TouchableOpacity, Text } from 'react-native';
import * as AppleAuthentication from 'expo-apple-authentication';
import { AntDesign } from '@expo/vector-icons';
import { useTheme } from '~/features/theme/ThemeProvider';
import { useAuth } from '../contexts/AuthContext';
import { authService } from '../services/authService';
import { useAnalytics } from '~/features/analytics';
import { router } from 'expo-router';

type AppleSignInButtonProps = {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
};

/**
 * Apple Sign-In Button Component
 * Only renders on iOS devices
 */
const AppleSignInButton: React.FC<AppleSignInButtonProps> = ({ onSuccess, onError }) => {
  const { isDark } = useTheme();
  const { setUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const { identify, track } = useAnalytics();

  // Only render the button on iOS
  if (Platform.OS !== 'ios') {
    return null;
  }

  const signInWithApple = async () => {
    // Prevent multiple concurrent sign-in attempts
    if (loading) {
      console.log('Apple Sign-In already in progress');
      return;
    }
    
    try {
      setLoading(true);
      
      // Request Apple authentication
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      console.log('Apple Sign-In successful');
      
      // Make sure we have an identity token
      if (!credential.identityToken) {
        throw new Error('No identity token received from Apple');
      }
      
      console.log('Got Apple identity token, sending to middleware...');
      
      // Send the identity token to our middleware
      const result = await authService.signInWithApple(credential.identityToken);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to authenticate with the server');
      }
      
      console.log('Successfully authenticated with middleware');
      
      // Extract user data from the token
      const userData = await authService.getUserFromToken();
      
      if (userData) {
        // Update the user context
        setUser(userData);
        
        // Update Supabase auth state to ensure proper token sync
        const { updateSupabaseAuth } = await import('../lib/supabaseClient');
        await updateSupabaseAuth();
        
        // Initialize RevenueCat conditionally
        try {
          const { initializeRevenueCatConditionally, identifyRevenueCatUser } = await import('~/features/subscription/revenueCatManager');
          await initializeRevenueCatConditionally();
          await identifyRevenueCatUser(userData.id);
        } catch (rcError) {
          console.error('Error with RevenueCat initialization:', rcError);
        }
        
        // Track sign in event
        identify(userData.id, {
          email: userData.email,
          role: userData.role,
        });
        track('user_signed_in', {
          method: 'apple',
        });
        
        // Don't navigate manually - the app will automatically show protected routes
        // when the authentication state changes
        console.log('User data set, app will navigate automatically');
        
        // Small delay to ensure state updates propagate and force navigation
        setTimeout(() => {
          onSuccess?.();
          // Force navigation to home if auth state didn't trigger it
          router.dismissAll();
          router.replace('/');
        }, 100);
      } else {
        throw new Error('No user data available after authentication');
      }
    } catch (error) {
      console.log('Apple Sign-In error:', error);
      
      // Handle user cancellation separately
      if ((error as any)?.code === 'ERR_REQUEST_CANCELED') {
        console.log('User canceled the sign-in flow');
      } else {
        // Show error to user
        Alert.alert('Sign-In Error', 'Failed to sign in with Apple. Please try again.');
        onError?.(error instanceof Error ? error : new Error('Unknown error during Apple Sign-In'));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[
          styles.button,
          { 
            backgroundColor: isDark ? '#2c2c2c' : '#ffffff',
            borderColor: isDark ? '#404040' : '#dadce0'
          }
        ]}
        onPress={signInWithApple}
        disabled={loading}
      >
        <View style={styles.buttonContent}>
          <View style={styles.appleIconContainer}>
            <AntDesign 
              name="apple1" 
              size={20} 
              color={isDark ? '#ffffff' : '#000000'} 
            />
          </View>
          <Text style={[styles.buttonText, { color: isDark ? '#ffffff' : '#3c4043' }]}>
            Mit Apple anmelden
          </Text>
        </View>
      </TouchableOpacity>
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="small" color="#ffffff" />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    width: '100%',
  },
  button: {
    width: '100%',
    height: 56,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#dadce0',
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  appleIconContainer: {
    width: 20,
    height: 20,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#3c4043',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
});

export default AppleSignInButton;
