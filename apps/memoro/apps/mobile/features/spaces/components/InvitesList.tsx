import React from 'react';
import { View, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import { useTheme } from '~/features/theme/ThemeProvider';
import Text from '~/components/atoms/Text';
import Icon from '~/components/atoms/Icon';
import Button from '~/components/atoms/Button';
import { SpaceInvite } from '../services/spaceService';

interface InvitesListProps {
  invites: SpaceInvite[];
  isLoading: boolean;
  onRefresh: () => void;
  onResendInvite?: (invite: SpaceInvite) => void;
  onCancelInvite?: (invite: SpaceInvite) => void;
}

/**
 * Component for displaying a list of space invites
 */
export default function InvitesList({ invites, isLoading, onRefresh, onResendInvite, onCancelInvite }: InvitesListProps) {
  const { isDark, themeVariant } = useTheme();
  
  if (isLoading && invites.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={isDark ? '#FFFFFF' : '#000000'} />
      </View>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return '#FFC107'; // Amber
      case 'accepted':
        return '#4CAF50'; // Green
      case 'declined':
        return '#F44336'; // Red
      default:
        return '#9E9E9E'; // Grey
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('de-DE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const renderInviteItem = ({ item }: { item: SpaceInvite }) => {
    const statusColor = getStatusColor(item.status);
    const isPending = item.status.toLowerCase() === 'pending';
    
    return (
      <View style={[
        styles.inviteItem, 
        { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)' }
      ]}>
        <View style={styles.inviteHeader}>
          <Text style={[styles.emailText, { color: isDark ? '#FFFFFF' : '#000000' }]}>
            {item.email}
          </Text>
          <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
            <Text style={styles.statusText}>
              {item.status}
            </Text>
          </View>
        </View>
        
        <View style={styles.inviteDetails}>
          <View style={styles.detailItem}>
            <Icon name="calendar-outline" size={16} color={isDark ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)'} />
            <Text style={[styles.detailText, { color: isDark ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)' }]}>
              Invited: {formatDate(item.created_at)}
            </Text>
          </View>
          
          <View style={styles.detailItem}>
            <Icon name="person-outline" size={16} color={isDark ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)'} />
            <Text style={[styles.detailText, { color: isDark ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)' }]}>
              Role: {item.role.charAt(0).toUpperCase() + item.role.slice(1)}
            </Text>
          </View>
          
          {item.responded_at && (
            <View style={styles.detailItem}>
              <Icon name="checkmark-outline" size={16} color={isDark ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)'} />
              <Text style={[styles.detailText, { color: isDark ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)' }]}>
                Responded: {formatDate(item.responded_at)}
              </Text>
            </View>
          )}
        </View>
        
        {isPending && (
          <View style={styles.actions}>
            {onResendInvite && (
              <Button
                title="Resend"
                variant="secondary"
                onPress={() => onResendInvite(item)}
                style={styles.resendButton}
              />
            )}
            {onCancelInvite && (
              <Button
                title="Cancel"
                variant="danger"
                onPress={() => onCancelInvite(item)}
                style={styles.cancelButton}
              />
            )}
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {invites.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Icon 
            name="mail-outline" 
            size={48} 
            color={isDark ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.3)'} 
          />
          <Text style={[
            styles.emptyText, 
            { color: isDark ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)' }
          ]}>
            No invitations have been sent for this space yet.
          </Text>
        </View>
      ) : (
        <FlatList
          data={invites}
          keyExtractor={(item) => item.id}
          renderItem={renderInviteItem}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          refreshing={isLoading}
          onRefresh={onRefresh}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 16,
  },
  listContent: {
    paddingTop: 8,
    paddingBottom: 24,
  },
  inviteItem: {
    borderRadius: 12,
    marginBottom: 12,
    padding: 16,
  },
  inviteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  emailText: {
    fontSize: 16,
    fontWeight: '600',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 16,
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  inviteDetails: {
    marginBottom: 12,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailText: {
    fontSize: 14,
    marginLeft: 8,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  resendButton: {
    minWidth: 80,
    marginRight: 8,
  },
  cancelButton: {
    minWidth: 80,
  },
});
