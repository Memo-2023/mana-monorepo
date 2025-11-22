import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import Text from '../../components/atoms/Text';
import { BaseToast, ErrorToast, InfoToast } from 'react-native-toast-message';

export const toastConfig = {
  success: (props: any) => (
    <View style={styles.toastContainer}>
      <BlurView intensity={80} tint="dark" style={styles.toastBlur}>
        <View style={styles.toastContent}>
          <Text variant="body" color="#fff" style={styles.toastText}>
            {props.text1}
          </Text>
          {props.text2 && (
            <Text variant="caption" color="#ccc" style={styles.toastSubtext}>
              {props.text2}
            </Text>
          )}
        </View>
      </BlurView>
    </View>
  ),
  error: (props: any) => (
    <View style={styles.toastContainer}>
      <BlurView intensity={80} tint="dark" style={[styles.toastBlur, styles.toastError]}>
        <View style={styles.toastContent}>
          <Text variant="body" color="#fff" style={styles.toastText}>
            {props.text1}
          </Text>
          {props.text2 && (
            <Text variant="caption" color="#ccc" style={styles.toastSubtext}>
              {props.text2}
            </Text>
          )}
        </View>
      </BlurView>
    </View>
  ),
  info: (props: any) => (
    <View style={styles.toastContainer}>
      <BlurView intensity={80} tint="dark" style={styles.toastBlur}>
        <View style={styles.toastContent}>
          <Text variant="body" color="#fff" style={styles.toastText}>
            {props.text1}
          </Text>
          {props.text2 && (
            <Text variant="caption" color="#ccc" style={styles.toastSubtext}>
              {props.text2}
            </Text>
          )}
        </View>
      </BlurView>
    </View>
  ),
};

const styles = StyleSheet.create({
  toastContainer: {
    width: '90%',
    maxWidth: 400,
    paddingHorizontal: 16,
  },
  toastBlur: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  toastError: {
    borderColor: 'rgba(255, 68, 68, 0.3)',
  },
  toastContent: {
    padding: 16,
    paddingVertical: 14,
  },
  toastText: {
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
  },
  toastSubtext: {
    fontSize: 13,
    marginTop: 4,
    textAlign: 'center',
  },
});
