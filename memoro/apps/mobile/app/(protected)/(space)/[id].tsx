import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, ActivityIndicator } from 'react-native';
import { Stack, useLocalSearchParams, router } from 'expo-router';
import { useTheme } from '~/features/theme/ThemeProvider';
import Text from '~/components/atoms/Text';
import Button from '~/components/atoms/Button';
import Icon from '~/components/atoms/Icon';
import { useHeader } from '~/features/menus/HeaderContext';
import { useSpaceContext } from '~/features/spaces/contexts/SpaceContext';
import { Space, Memo } from '~/features/spaces/services/spaceService';
import MemoList from '~/components/molecules/MemoList';
import { useSpaceStore } from '~/features/spaces/store/spaceStore';
import SpaceInvitesManager, { SpaceInvitesManagerHandle } from '~/features/spaces/components/SpaceInvitesManager';

// -------------------------------------------------
// Sub-Component: SpaceHeader
// -------------------------------------------------
interface SpaceHeaderProps {
  name?: string;
  description?: string;
  color?: string;
  memoCount?: number;
  isDefault?: boolean;
}

const SpaceHeader = ({
  name,
  description,
  color = '#4CAF50',
  memoCount = 0,
  isDefault = false,
}: SpaceHeaderProps) => {
  const { isDark } = useTheme();
  
  const styles = StyleSheet.create({
    container: {
      marginTop: 24,
      marginBottom: 24,
      paddingHorizontal: 20,
    },
    headerContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 16,
    },
    colorIndicator: {
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: color,
      marginRight: 12,
    },
    titleContainer: {
      flex: 1,
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      color: isDark ? '#FFFFFF' : '#000000',
    },
    badge: {
      backgroundColor: color,
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 4,
      alignSelf: 'flex-start',
      marginTop: 4,
    },
    badgeText: {
      color: '#FFFFFF',
      fontSize: 12,
      fontWeight: 'bold',
    },
    description: {
      fontSize: 16,
      color: isDark ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)',
      marginTop: 8,
      marginBottom: 16,
    },
    statsContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 8,
    },
    statsText: {
      fontSize: 14,
      color: isDark ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)',
      marginLeft: 8,
    },
  });

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <View style={[styles.colorIndicator, { backgroundColor: color }]} />
        <View style={styles.titleContainer}>
          <Text style={styles.title}>{name || 'Space'}</Text>
          {isDefault && (
            <View style={[styles.badge, { backgroundColor: color }]}>
              <Text style={styles.badgeText}>Standard</Text>
            </View>
          )}
        </View>
      </View>
      {description && <Text style={styles.description}>{description}</Text>}
      <View style={styles.statsContainer}>
        <Icon name="document-text-outline" size={16} color={isDark ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)'} />
        <Text style={styles.statsText}>{memoCount} Memos</Text>
      </View>
    </View>
  );
};

// -------------------------------------------------
// Main Component: SpacePage
// -------------------------------------------------
export default function SpacePage() {
  const { isDark } = useTheme();
  const spaceContext = useSpaceContext();
  
  // Router und Params
  const { id } = useLocalSearchParams<{ id: string }>();
  
  // State für Space-Eigenschaften
  const [space, setSpace] = useState<Space | null>(null);
  const [spaceMemos, setSpaceMemos] = useState<Memo[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMemos, setLoadingMemos] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Ref for the invite manager
  const invitesManagerRef = useRef<SpaceInvitesManagerHandle>(null);

  // Load space data and set it as the current space
  useEffect(() => {
    // Create a flag to prevent state updates after unmount
    let isMounted = true;

    const fetchSpace = async () => {
      if (!id) return;

      try {
        console.debug('SpacePage: Fetching space with id:', id);
        setLoading(true);
        setError(null);

        // Update the global space store to track which space we're in
        // This is critical for the SpaceLinkSelector to know the context
        useSpaceStore.getState().setCurrentSpaceId(id);
        console.debug(`Set current space ID in store to: ${id}`);

        // Fetch space details from the API
        const spaceData = await spaceContext.getSpace(id);

        if (isMounted) {
          setSpace(spaceData);
          console.debug('SpacePage: Fetched space:', spaceData);
        }

      } catch (err) {
        console.error('SpacePage: Error fetching space:', err);
        if (isMounted) {
          setError('Failed to load space');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchSpace();
    
    // Cleanup function to prevent state updates after unmount
    return () => {
      isMounted = false;

      // Clear the current space ID when leaving this page
      useSpaceStore.getState().clearCurrentSpaceId();
      console.debug('Cleared current space ID from store');
    };
  }, [id]);

  // Load space memos
  const [memosError, setMemosError] = useState<string | null>(null);
  
  useEffect(() => {
    // Create a flag to prevent state updates after unmount
    let isMounted = true;
    
    const fetchSpaceMemos = async () => {
      if (!id) return;

      try {
        console.debug('SpacePage: Fetching memos for space:', id);
        setLoadingMemos(true);
        setMemosError(null);
        
        // Fetch memos for this space
        const memos = await spaceContext.getSpaceMemos(id);
        
        // Only update state if component is still mounted
        if (isMounted) {
          setSpaceMemos(memos);
          console.debug('SpacePage: Fetched memos count:', memos.length);
        }
        
      } catch (err) {
        console.error('SpacePage: Error fetching space memos:', err);
        
        // Only update state if component is still mounted
        if (isMounted) {
          setMemosError('Failed to load memos for this space');
        }
      } finally {
        // Only update state if component is still mounted
        if (isMounted) {
          setLoadingMemos(false);
        }
      }
    };

    fetchSpaceMemos();
    
    // Cleanup function to prevent state updates after unmount
    return () => {
      isMounted = false;

      // Clear the current space ID when leaving this page
      useSpaceStore.getState().clearCurrentSpaceId();
      console.debug('Cleared current space ID from store');
    };
  }, [id]);

  // Event-Handler
  const handleEditPress = () => {
    console.debug('Space bearbeiten:', id);
    // Navigate to edit space screen (not implemented yet)
    // router.push(`/(protected)/(space)/edit/${id}`);
  };
  
  const handleDeletePress = async () => {
    if (!id) return;
    
    try {
      console.debug('Attempting to delete space:', id);
      const success = await spaceContext.deleteSpace(id as string);
      if (success) {
        console.debug('Space deleted successfully');
        router.back();
      }
    } catch (err) {
      console.error('Error deleting space:', err);
    }
  };
  

  // Styles
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDark ? '#121212' : '#FFFFFF',
    },
    contentContainer: {
      flex: 1,
      backgroundColor: isDark ? '#121212' : '#FFFFFF',
    },
    headerSection: {
      backgroundColor: isDark ? '#121212' : '#FFFFFF',
    },
    actionSection: {
      paddingHorizontal: 20,
      paddingTop: 8,
      paddingBottom: 20,
    },
    memoListContainer: {
      flex: 1,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    loadingText: {
      fontSize: 16,
      color: isDark ? '#FFFFFF' : '#000000',
    },
    errorContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
    },
    errorText: {
      fontSize: 16,
      color: isDark ? '#FFFFFF' : '#000000',
      textAlign: 'center',
    },
    addButton: {
      marginTop: 16,
      marginBottom: 24,
    },
    divider: {
      height: 1,
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
      marginVertical: 16,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: isDark ? '#FFFFFF' : '#000000',
      marginBottom: 16,
    },
    inviteButton: {
      marginBottom: 16,
    },
  });

  // Header-Konfiguration mit dem useHeader-Hook aktualisieren
  const { updateConfig } = useHeader();
  
  // Header-Konfiguration aktualisieren, wenn die Seite fokussiert wird
  useEffect(() => {
     
    console.debug('Space detail page mounted, updating header config');
    
    // Stabile Referenz auf die Header-Konfiguration
    const headerConfig = {
      title: 'Space Details',
      showBackButton: true,
      rightIcons: [
        { 
          name: 'create-outline', 
          onPress: () => {
             
            console.debug('Edit icon pressed');
            handleEditPress();
          } 
        },
        { 
          name: 'trash-outline', 
          onPress: () => {
             
            console.debug('Delete icon pressed');
            handleDeletePress();
          } 
        },
      ]
    };
    
    updateConfig(headerConfig);
    
    // Header-Konfiguration zurücksetzen, wenn die Komponente unmounted wird
    return () => {
       
      console.debug('Space detail page unmounted');
    };
  }, []);
  
  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.contentContainer}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={isDark ? '#FFFFFF' : '#000000'} />
            <Text style={[styles.loadingText, { marginTop: 16 }]}>Lade Space...</Text>
          </View>
        ) : !space ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>
              {error || 'Space konnte nicht geladen werden.'}
            </Text>
          </View>
        ) : (
          <>
            <View style={styles.headerSection}>
              <SpaceHeader
                name={space.name}
                description={space.description}
                color={space.color || '#4CAF50'}
                memoCount={spaceMemos.length}
                isDefault={space.isDefault}
              />

              <View style={styles.actionSection}>
                {/* Invite Members Section - Only visible to space owners */}
                {space.isOwner && (
                  <Button
                    title="Invite Members"
                    iconName="person-add-outline"
                    onPress={() => invitesManagerRef.current?.openInviteModal()}
                    style={styles.inviteButton}
                  />
                )}
              </View>
            </View>
            
            {/* MemoList for the space */}
            <View style={styles.memoListContainer}>
              {loadingMemos ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color={isDark ? '#FFFFFF' : '#000000'} />
                  <Text style={[styles.loadingText, { marginTop: 8 }]}>Lade Memos...</Text>
                </View>
              ) : memosError ? (
                <View style={styles.errorContainer}>
                  <Text style={styles.errorText}>{memosError}</Text>
                  <Button 
                    title="Erneut versuchen" 
                    onPress={() => {
                      setLoadingMemos(true);
                      setMemosError(null);
                      setSpaceMemos([]);
                      // Re-render will trigger the useEffect again
                    }}
                    style={{ marginTop: 16 }}
                  />
                </View>
              ) : (
                <MemoList 
                  memos={spaceMemos.map(memo => ({
                    ...memo,
                    created_at: memo.created_at || new Date().toISOString(), // Ensure created_at is always a string
                    is_archived: memo.is_archived || false // Ensure is_archived is always a boolean
                  }))}
                  spaceId={id as string}
                />
              )}
            </View>

            {/* Invites Manager Component */}
            <SpaceInvitesManager
              ref={invitesManagerRef}
              spaceId={id as string}
              spaceName={space.name || ''}
              isOwner={Boolean(space.isOwner)}
            />
          </>
        )}
      </View>
    </View>
  );
}
