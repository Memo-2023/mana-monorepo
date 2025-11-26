import React, { useState } from 'react';
import { View, Modal, StyleSheet, TextInput, Alert, Pressable } from 'react-native';
import { useTheme } from '~/features/theme/ThemeProvider';
import Text from '~/components/atoms/Text';
import Button from '~/components/atoms/Button';
import colors from '~/tailwind.config.js';

interface InviteUserModalProps {
  visible: boolean;
  spaceId: string;
  spaceName: string; 
  onClose: () => void;
  onSubmit: (email: string, role: string) => Promise<void>;
}

/**
 * Modal for inviting a user to join a space
 */
export default function InviteUserModal({ visible, spaceId, spaceName, onClose, onSubmit }: InviteUserModalProps) {
  const { isDark, themeVariant } = useTheme();
  const [email, setEmail] = useState('');
  const [selectedRole, setSelectedRole] = useState('viewer');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [emailError, setEmailError] = useState('');

  // Background color from tailwind config
  const backgroundColor = isDark 
    ? ((colors as any).theme?.extend?.colors?.dark)?.[themeVariant]?.modalBackground || '#1E1E1E'
    : ((colors as any).theme?.extend?.colors)?.[themeVariant]?.modalBackground || '#FFFFFF';
    
  const roles = [
    { id: 'viewer', label: 'Viewer', description: 'Can view content but not edit' },
    { id: 'editor', label: 'Editor', description: 'Can view and edit content' },
    { id: 'admin', label: 'Admin', description: 'Full access except deletion' }
  ];
  
  const handleClose = () => {
    setEmail('');
    setSelectedRole('viewer');
    setEmailError('');
    onClose();
  };
  
  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim()) {
      setEmailError('Email is required');
      return false;
    } else if (!emailRegex.test(email)) {
      setEmailError('Please enter a valid email address');
      return false;
    }
    setEmailError('');
    return true;
  };
  
  const handleSubmit = async () => {
    // Validate email
    if (!validateEmail(email)) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      await onSubmit(email, selectedRole);
      handleClose();
      Alert.alert('Success', `Invitation sent to ${email}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to send invitation';
      Alert.alert('Error', errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const Role = ({ role }: { role: typeof roles[0] }) => (
    <View 
      style={[
        styles.roleContainer, 
        selectedRole === role.id && {
          borderColor: isDark ? '#4CAF50' : '#2E7D32',
          backgroundColor: isDark ? 'rgba(76, 175, 80, 0.2)' : 'rgba(76, 175, 80, 0.1)'
        }
      ]}
    >
      <View style={styles.radioContainer}>
        <View 
          style={[
            styles.radioOuter, 
            selectedRole === role.id && {
              borderColor: isDark ? '#4CAF50' : '#2E7D32'
            }
          ]}
        >
          {selectedRole === role.id && (
            <View 
              style={[
                styles.radioInner, 
                { backgroundColor: isDark ? '#4CAF50' : '#2E7D32' }
              ]} 
            />
          )}
        </View>
      </View>
      <View style={styles.roleInfo}>
        <Text style={[styles.roleTitle, { color: isDark ? '#FFFFFF' : '#000000' }]}>
          {role.label}
        </Text>
        <Text style={[styles.roleDescription, { color: isDark ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)' }]}>
          {role.description}
        </Text>
      </View>
      <View style={{ width: 30 }} />
    </View>
  );
  
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContainer, { backgroundColor }]}>
          <View style={styles.headerContainer}>
            <Text style={[styles.modalTitle, { color: isDark ? '#FFFFFF' : '#000000' }]}>
              Invite to Space
            </Text>
            <Button
              iconName="close-outline"
              onPress={handleClose}
              variant="text"
            />
          </View>
          
          <Text style={[styles.spaceName, { color: isDark ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.9)' }]}>
            Space: {spaceName}
          </Text>
          
          <View style={styles.formContainer}>
            <Text style={[styles.label, { color: isDark ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.9)' }]}>
              Email Address
            </Text>
            <TextInput
              style={[
                styles.input,
                { 
                  borderColor: emailError ? '#F44336' : isDark ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.2)',
                  color: isDark ? '#FFFFFF' : '#000000',
                  backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)'
                }
              ]}
              placeholder="Enter email address"
              placeholderTextColor={isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)'}
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                if (emailError) validateEmail(text);
              }}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
            {emailError ? (
              <Text style={styles.errorText}>{emailError}</Text>
            ) : null}
            
            <Text style={[styles.label, styles.roleLabel, { color: isDark ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.9)' }]}>
              Role
            </Text>
            
            {roles.map((role) => (
              <Pressable 
                key={role.id}
                onPress={() => setSelectedRole(role.id)}
                style={styles.roleButton}
              >
                <Role role={role} />
              </Pressable>
            ))}
          </View>
          
          <View style={styles.buttonsContainer}>
            <Button
              title="Cancel"
              onPress={handleClose}
              variant="secondary"
              style={styles.cancelButton}
            />
            <Button
              title={isSubmitting ? '' : "Send Invitation"}
              onPress={handleSubmit}
              disabled={isSubmitting || !email}
              style={styles.submitButton}
              iconName={isSubmitting ? undefined : "send-outline"}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 20,
  },
  modalContainer: {
    borderRadius: 16,
    width: '100%',
    maxWidth: 500,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    maxHeight: '80%',
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  spaceName: {
    fontSize: 16,
    marginBottom: 24,
  },
  formContainer: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  roleLabel: {
    marginTop: 16,
    marginBottom: 12,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    marginBottom: 8,
  },
  errorText: {
    color: '#F44336',
    fontSize: 14,
    marginBottom: 8,
  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  cancelButton: {
    marginRight: 12,
  },
  submitButton: {
    minWidth: 120,
  },
  roleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 8,
    backgroundColor: 'transparent',
    marginBottom: 8,
  },
  radioContainer: {
    width: 30,
    alignItems: 'center',
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#2E7D32',
  },
  roleInfo: {
    flex: 1,
    marginLeft: 10,
  },
  roleTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  roleDescription: {
    fontSize: 14,
  },
  roleButton: {
    padding: 0,
    marginVertical: 0,
    backgroundColor: 'transparent',
  },
});
