import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, SafeAreaView, Alert, ActivityIndicator, Pressable, Platform } from 'react-native';
import { useTheme } from '@react-navigation/native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthProvider';
import { getUserSpaces, Space, deleteSpace } from '../../services/space';

export default function SpaceListScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { user } = useAuth();
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedSpaceId, setExpandedSpaceId] = useState<string | null>(null);
  
  // Laden der Spaces beim ersten Rendern und wenn der Screen fokussiert wird
  const loadSpaces = useCallback(async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      console.log("Lade Spaces für User:", user.id);
      const userSpaces = await getUserSpaces(user.id);
      console.log(`${userSpaces.length} Spaces geladen`);
      setSpaces(userSpaces);
    } catch (error) {
      console.error('Fehler beim Laden der Spaces:', error);
      Alert.alert('Fehler', 'Die Spaces konnten nicht geladen werden.');
    } finally {
      setIsLoading(false);
    }
  }, [user]);
  
  // Lade Spaces beim ersten Rendern
  useEffect(() => {
    loadSpaces();
  }, [loadSpaces]);
  
  // Lade Spaces erneut, wenn der Screen fokussiert wird
  useFocusEffect(
    useCallback(() => {
      loadSpaces();
      return () => {};
    }, [loadSpaces])
  );
  
  // Erstellen eines neuen Spaces
  const handleCreateSpace = () => {
    router.push('/spaces/new');
  };
  
  // Zu einem Space navigieren
  const handleSpacePress = (id: string) => {
    router.push(`/spaces/${id}`);
  };
  
  // Toggle-Funktion für das Optionsmenü
  const toggleOptionsMenu = (id: string) => {
    setExpandedSpaceId(expandedSpaceId === id ? null : id);
  };
  
  // Einen Space verlassen
  const handleLeaveSpace = async (id: string) => {
    Alert.alert(
      "Space verlassen",
      "Möchtest du diesen Space wirklich verlassen?",
      [
        {
          text: "Abbrechen",
          style: "cancel"
        },
        {
          text: "Verlassen",
          style: "destructive",
          onPress: async () => {
            // Diese Funktion würde einen Benutzer aus einem Space entfernen
            // TODO: removeMember(id, user.id); implementieren
            Alert.alert("Info", "Diese Funktion ist noch nicht implementiert.");
          }
        }
      ]
    );
  };
  
  // Einen Space löschen (nur für Besitzer)
  const handleDeleteSpace = async (id: string) => {
    Alert.alert(
      "Space löschen",
      "Möchtest du diesen Space wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.",
      [
        {
          text: "Abbrechen",
          style: "cancel"
        },
        {
          text: "Löschen",
          style: "destructive",
          onPress: async () => {
            try {
              const success = await deleteSpace(id);
              
              if (success) {
                // Aus der lokalen Liste entfernen
                setSpaces(prev => prev.filter(space => space.id !== id));
                Alert.alert("Erfolg", "Der Space wurde gelöscht.");
              } else {
                Alert.alert("Fehler", "Der Space konnte nicht gelöscht werden.");
              }
            } catch (error) {
              console.error('Fehler beim Löschen des Spaces:', error);
              Alert.alert("Fehler", "Der Space konnte nicht gelöscht werden.");
            }
          }
        }
      ]
    );
  };
  
  const renderSpaceItem = ({ item }: { item: Space }) => {
    const showOptions = expandedSpaceId === item.id;
    const isOwner = item.owner_id === user?.id;
    
    return (
      <View style={[
        styles.spaceItemWrapper, 
        { 
          backgroundColor: colors.card,
          borderWidth: 1,
          borderColor: colors.border,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 2
        }
      ]}>
        <Pressable
          style={({ pressed, hovered }) => [
            styles.spaceItem,
            hovered && { backgroundColor: colors.cardHover },
            pressed && { opacity: 0.9 }
          ]}
          onPress={() => handleSpacePress(item.id)}
          onLongPress={() => toggleOptionsMenu(item.id)}
        >
          {({ pressed, hovered }) => (
            <>
              <View style={styles.spaceContent}>
                <View style={styles.spaceHeader}>
                  <View style={styles.titleRow}>
                    <Ionicons 
                      name="people-outline" 
                      size={18} 
                      color={colors.primary} 
                      style={styles.titleIcon} 
                    />
                    <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
                      {item.name}
                    </Text>
                    {isOwner && (
                      <View style={[styles.ownerBadge, { backgroundColor: colors.primary + '20' }]}>
                        <Text style={[styles.ownerBadgeText, { color: colors.primary }]}>
                          Besitzer
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
                
                {item.description && (
                  <Text 
                    style={[styles.description, { color: colors.text + 'CC' }]}
                    numberOfLines={2}
                  >
                    {item.description}
                  </Text>
                )}
                
                <View style={styles.statsContainer}>
                  <Text style={[styles.timestamp, { color: colors.text + '80' }]}>
                    Erstellt: {new Date(item.created_at).toLocaleDateString()}
                  </Text>
                </View>
              </View>
              
              <Pressable 
                style={({ pressed, hovered }) => [
                  styles.optionsButton,
                  hovered && { backgroundColor: colors.menuItemHover },
                  pressed && { opacity: 0.7 }
                ]}
                onPress={() => toggleOptionsMenu(item.id)}
              >
                {({ pressed, hovered }) => (
                  <Ionicons 
                    name="ellipsis-vertical" 
                    size={20} 
                    color={colors.text + '80'} 
                  />
                )}
              </Pressable>
            </>
          )}
        </Pressable>
        
        {showOptions && (
          <View style={[styles.optionsContainer, { 
            backgroundColor: colors.card,
            borderTopWidth: 1,
            borderTopColor: colors.border
          }]}>
            {isOwner && (
              <Pressable 
                style={({ pressed, hovered }) => [
                  styles.optionButton,
                  hovered && { backgroundColor: colors.menuItemHover },
                  pressed && { opacity: 0.8 }
                ]}
                onPress={() => router.push(`/spaces/${item.id}/settings`)}
              >
                {({ pressed, hovered }) => (
                  <>
                    <Ionicons name="settings-outline" size={18} color={colors.text} />
                    <Text style={[styles.optionText, { color: colors.text }]}>Einstellungen</Text>
                  </>
                )}
              </Pressable>
            )}
            
            <Pressable 
              style={({ pressed, hovered }) => [
                styles.optionButton,
                hovered && { backgroundColor: colors.menuItemHover },
                pressed && { opacity: 0.8 }
              ]}
              onPress={() => router.push(`/spaces/${item.id}/invite`)}
            >
              {({ pressed, hovered }) => (
                <>
                  <Ionicons name="person-add-outline" size={18} color={colors.text} />
                  <Text style={[styles.optionText, { color: colors.text }]}>Einladen</Text>
                </>
              )}
            </Pressable>
            
            {isOwner ? (
              <Pressable 
                style={({ pressed, hovered }) => [
                  styles.optionButton,
                  hovered && { backgroundColor: colors.dangerHover },
                  pressed && { opacity: 0.8 }
                ]}
                onPress={() => handleDeleteSpace(item.id)}
              >
                {({ pressed, hovered }) => (
                  <>
                    <Ionicons name="trash-outline" size={18} color="#FF3B30" />
                    <Text style={[styles.optionText, { color: "#FF3B30" }]}>Löschen</Text>
                  </>
                )}
              </Pressable>
            ) : (
              <Pressable 
                style={({ pressed, hovered }) => [
                  styles.optionButton,
                  hovered && { backgroundColor: colors.dangerHover },
                  pressed && { opacity: 0.8 }
                ]}
                onPress={() => handleLeaveSpace(item.id)}
              >
                {({ pressed, hovered }) => (
                  <>
                    <Ionicons name="exit-outline" size={18} color="#FF3B30" />
                    <Text style={[styles.optionText, { color: "#FF3B30" }]}>Verlassen</Text>
                  </>
                )}
              </Pressable>
            )}
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Spaces</Text>
      </View>
      
      <View style={styles.contentContainer}>
        {/* Create new space button */}
        <TouchableOpacity
          style={[styles.createSpaceButton, { backgroundColor: colors.primary }]}
          onPress={handleCreateSpace}
        >
          <Ionicons name="add" size={24} color="white" />
          <Text style={styles.createSpaceText}>Neuen Space erstellen</Text>
        </TouchableOpacity>
        
        {/* Space list */}
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.text + '80' }]}>
              Spaces werden geladen...
            </Text>
          </View>
        ) : spaces.length > 0 ? (
          <FlatList
            data={spaces}
            keyExtractor={(item) => item.id}
            renderItem={renderSpaceItem}
            contentContainerStyle={styles.listContent}
          />
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons 
              name="people-outline" 
              size={64} 
              color={colors.text + '40'} 
            />
            <Text style={[styles.emptyText, { color: colors.text + '80' }]}>
              Keine Spaces gefunden
            </Text>
            <Text style={[styles.emptySubtext, { color: colors.text + '60' }]}>
              Erstelle einen neuen Space oder frage nach einer Einladung
            </Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  createSpaceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  createSpaceText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  listContent: {
    paddingBottom: 16,
  },
  spaceItemWrapper: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
      web: {
        boxShadow: '0 2px 6px rgba(0, 0, 0, 0.1)',
      },
    }),
  },
  spaceItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
  },
  spaceContent: {
    flex: 1,
  },
  spaceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  titleIcon: {
    marginRight: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
  },
  ownerBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    marginLeft: 8,
  },
  ownerBadgeText: {
    fontSize: 12,
    fontWeight: '500',
  },
  description: {
    fontSize: 14,
    marginBottom: 12,
    lineHeight: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  timestamp: {
    fontSize: 12,
  },
  optionsButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionsContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
    paddingBottom: 12,
    paddingTop: 8,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginLeft: 8,
    borderRadius: 6,
  },
  optionText: {
    fontSize: 14,
    marginLeft: 6,
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    marginTop: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
  },
});