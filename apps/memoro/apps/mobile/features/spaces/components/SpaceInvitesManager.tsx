import React, { useState, useEffect, useCallback, forwardRef, useImperativeHandle } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { useTheme } from '~/features/theme/ThemeProvider';
import Text from '~/components/atoms/Text';
import Button from '~/components/atoms/Button';
import InviteUserModal from './InviteUserModal';
import InvitesList from './InvitesList';
import spaceService, { SpaceInvite } from '../services/spaceService';

interface SpaceInvitesManagerProps {
  spaceId: string;
  spaceName: string;
  isOwner: boolean;
}

export interface SpaceInvitesManagerHandle {
  openInviteModal: () => void;
}

/**
 * Component for managing space invites - allows sending invites and viewing pending invites
 */
const SpaceInvitesManager = forwardRef<SpaceInvitesManagerHandle, SpaceInvitesManagerProps>(({ spaceId, spaceName, isOwner }, ref) => {
  const { isDark } = useTheme();
  const [invites, setInvites] = useState<SpaceInvite[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  
  // Expose the openInviteModal function to parent components
  useImperativeHandle(ref, () => ({
    openInviteModal: () => setShowInviteModal(true)
  }));

  // Fetch invites for the space
  const fetchInvites = useCallback(async () => {
    if (!spaceId) return;
    
    setIsLoading(true);
    try {
      const invitesData = await spaceService.getSpaceInvites(spaceId);
      setInvites(invitesData);
    } catch (error) {
      console.error('Failed to fetch invites:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      Alert.alert('Error', `Failed to load invites: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  }, [spaceId]);

  // Load invites when component mounts
  useEffect(() => {
    fetchInvites();
  }, [fetchInvites]);

  // Handle sending an invitation
  const handleSendInvite = async (email: string, role: string) => {
    try {
      await spaceService.inviteUserToSpace(spaceId, email, role);
      // Refresh the invites list after sending an invitation
      fetchInvites();
    } catch (error) {
      console.error('Failed to send invite:', error);
      throw error;
    }
  };

  // Handle resending an invitation
  const handleResendInvite = async (invite: SpaceInvite) => {
    try {
      Alert.alert(
        'Resend Invitation',
        `Are you sure you want to resend the invitation to ${invite.email}?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Resend', 
            style: 'default',
            onPress: async () => {
              try {
                await spaceService.resendInvite(invite.id);
                Alert.alert('Success', `Invitation resent to ${invite.email}`);
                fetchInvites();
              } catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                Alert.alert('Error', `Failed to resend invitation: ${errorMessage}`);
              }
            }
          },
        ]
      );
    } catch (error) {
      console.error('Failed to resend invite:', error);
    }
  };
  
  // Handle canceling an invitation
  const handleCancelInvite = async (invite: SpaceInvite) => {
    try {
      Alert.alert(
        'Cancel Invitation',
        `Are you sure you want to cancel the invitation to ${invite.email}?`,
        [
          { text: 'No', style: 'cancel' },
          { 
            text: 'Yes, Cancel', 
            style: 'destructive',
            onPress: async () => {
              try {
                await spaceService.cancelInvite(invite.id);
                Alert.alert('Success', `Invitation to ${invite.email} has been canceled`);
                fetchInvites();
              } catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                Alert.alert('Error', `Failed to cancel invitation: ${errorMessage}`);
              }
            }
          },
        ]
      );
    } catch (error) {
      console.error('Failed to cancel invite:', error);
    }
  };

  // Only show the invite button if the user is the owner of the space
  if (!isOwner) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: isDark ? '#FFFFFF' : '#000000' }]}>
          Space Members & Invitations
        </Text>
        <Button
          title="Invite User"
          iconName="person-add-outline"
          onPress={() => setShowInviteModal(true)}
          style={styles.inviteButton}
        />
      </View>

      <View style={styles.divider} />
      
      <Text style={[styles.sectionTitle, { color: isDark ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)' }]}>
        Pending Invitations
      </Text>
      
      <View style={styles.invitesContainer}>
        <InvitesList
          invites={invites.filter(inv => inv.status.toLowerCase() === 'pending')}
          isLoading={isLoading}
          onRefresh={fetchInvites}
          onResendInvite={handleResendInvite}
          onCancelInvite={handleCancelInvite}
        />
      </View>
      
      {/* Invite User Modal */}
      <InviteUserModal
        visible={showInviteModal}
        spaceId={spaceId}
        spaceName={spaceName}
        onClose={() => setShowInviteModal(false)}
        onSubmit={handleSendInvite}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingVertical: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  inviteButton: {
    minWidth: 130,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  invitesContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
});

export default SpaceInvitesManager;
