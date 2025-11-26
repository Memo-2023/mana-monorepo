import React from 'react';
import { View, Modal, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import Text from '~/components/atoms/Text';
import Button from '~/components/atoms/Button';
import { useTheme } from '~/features/theme/ThemeProvider';
import Icon from '~/components/atoms/Icon';

interface PasswordResetRequiredModalProps {
  visible: boolean;
  onClose: () => void;
  onResetPassword: () => void;
}

const PasswordResetRequiredModal: React.FC<PasswordResetRequiredModalProps> = ({
  visible,
  onClose,
  onResetPassword,
}) => {
  const { isDark } = useTheme();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  
  console.log('PasswordResetRequiredModal rendered with visible:', visible);

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View 
          style={[
            styles.modalContent, 
            { 
              backgroundColor: isDark ? '#1a1a1a' : '#ffffff',
              paddingTop: Math.max(insets.top, 40),
              paddingBottom: Math.max(insets.bottom, 20)
            }
          ]}
        >
          <View style={styles.contentContainer}>
            <View style={[styles.iconContainer, { backgroundColor: isDark ? 'rgba(255, 193, 7, 0.2)' : 'rgba(255, 193, 7, 0.15)' }]}>
              <Icon name="key-outline" size={32} color="#FFC107" />
            </View>
            
            <Text style={[styles.title, { color: isDark ? '#FFFFFF' : '#000000' }]}>
              {t('auth.password_reset_required', 'Password Reset Required')}
            </Text>
            
            <Text style={[styles.message, { color: isDark ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.6)' }]}>
              {t('auth.error_firebase_password_reset_required', 
                'Due to a system update, you need to reset your password. Please use the "Forgot Password" function.'
              )}
            </Text>

            <View style={styles.infoContainer}>
              <View style={[styles.infoCard, { backgroundColor: isDark ? 'rgba(33, 150, 243, 0.1)' : '#E3F2FD' }]}>
                <View style={styles.infoIconWrapper}>
                  <Icon name="information-circle-outline" size={24} color="#2196F3" />
                </View>
                <Text style={[styles.infoText, { color: isDark ? '#90CAF9' : '#1976D2' }]}>
                  {t('auth.password_reset_info', 
                    'This is a one-time requirement due to our authentication system update. Your account remains secure.'
                  )}
                </Text>
              </View>
            </View>
          </View>
          
          <View style={styles.buttonContainer}>
            <Button
              title={t('auth.resetPassword', 'Reset Password')}
              variant="primary"
              onPress={onResetPassword}
              style={styles.resetButton}
            />
            <Button
              title={t('common.cancel', 'Cancel')}
              variant="ghost"
              onPress={onClose}
              style={styles.cancelButton}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '90%',
    maxWidth: 400,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 5,
  },
  contentContainer: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 24,
    alignItems: 'center',
  },
  logo: {
    marginBottom: 24,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
    lineHeight: 32,
  },
  message: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    marginBottom: 24,
  },
  infoContainer: {
    width: '100%',
    marginBottom: 8,
  },
  infoCard: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(33, 150, 243, 0.2)',
  },
  infoIconWrapper: {
    marginRight: 16,
    marginTop: 2,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  buttonContainer: {
    paddingHorizontal: 24,
    paddingBottom: 20,
  },
  resetButton: {
    height: 48,
    marginBottom: 12,
  },
  cancelButton: {
    height: 48,
  },
});

export default PasswordResetRequiredModal;