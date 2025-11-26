import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  SafeAreaView, 
  Alert,
  ActivityIndicator, 
  Pressable,
  Platform,
  Dimensions
} from 'react-native';
import { useTheme, useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthProvider';
import { useAppTheme } from '../theme/ThemeProvider';
import CustomDrawer from '../components/CustomDrawer';
import { 
  getConversations, 
  getMessages, 
  deleteConversation, 
  archiveConversation 
} from '../services/conversation';
import { supabase } from '../utils/supabase';

// Typendefinitionen für Konversationen
type ConversationItem = {
  id: string;
  modelName: string;
  title: string;
  lastMessage: string;
  timestamp: Date;
  mode: 'frei' | 'geführt' | 'vorlage';
};

// Hilfsfunktion zur Formatierung des Datums
const formatDate = (date: Date) => {
  const day = date.getDate().toString().padStart(2, '0');
  const month = new Intl.DateTimeFormat('de-DE', { month: 'short' }).format(date);
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${day}. ${month}, ${hours}:${minutes}`;
};

export default function ConversationsScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { user } = useAuth();
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { isDarkMode } = useAppTheme();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Eine Funktion, die Konversationen lädt und wiederverwendet werden kann
  const loadConversations = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      console.log("Lade Konversationen für User:", user.id);
      // Lade alle nicht-archivierten Konversationen des Benutzers
      const userConversations = await getConversations(user.id);
      console.log(`${userConversations.length} Konversationen geladen`, new Date().toLocaleTimeString());
      
      // Lade für jede Konversation die letzte Nachricht und das Modell
      const conversationItems: ConversationItem[] = [];
      
      for (const conv of userConversations) {
        try {
          // Lade die Nachrichten der Konversation
          const messages = await getMessages(conv.id);
          // Lade das Modell aus der Datenbank
          const { data: modelData } = await supabase
            .from('models')
            .select('name')
            .eq('id', conv.model_id)
            .single();
          
          // Finde die letzte Nachricht (die nicht vom System ist)
          const lastMessage = messages
            .filter(msg => msg.sender !== 'system')
            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];
          
          if (lastMessage) {
            conversationItems.push({
              id: conv.id,
              modelName: modelData?.name || 'Unbekanntes Modell',
              title: conv.title || 'Unbenannte Konversation',
              lastMessage: lastMessage.message_text,
              timestamp: new Date(conv.updated_at),
              mode: conv.conversation_mode === 'free' ? 'frei' : 
                    conv.conversation_mode === 'guided' ? 'geführt' : 'vorlage'
            });
          }
        } catch (error) {
          console.error(`Fehler beim Laden der Details für Konversation ${conv.id}:`, error);
        }
      }
      
      setConversations(conversationItems);
    } catch (error) {
      console.error('Fehler beim Laden der Konversationen:', error);
      Alert.alert('Fehler', 'Die Konversationen konnten nicht geladen werden.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Lade die Konversationen beim ersten Rendern und wenn sich der User ändert
  useEffect(() => {
    loadConversations();
  }, [user]);
  
  // Lade Konversationen erneut, wenn der Screen fokussiert wird
  useFocusEffect(
    useCallback(() => {
      if (user) loadConversations();
      return () => {};
    }, [user])
  );

  const handleConversationPress = (id: string) => {
    // Navigiere zum Konversations-Screen mit der ID
    router.push(`/conversation/${id}`);
  };
  
  // Löschen einer Konversation
  const handleDeleteConversation = (id: string) => {
    Alert.alert(
      "Konversation löschen",
      "Möchtest du diese Konversation wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.",
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
              const success = await deleteConversation(id);
              if (success) {
                // Aus der lokalen Liste entfernen
                setConversations(prev => prev.filter(conv => conv.id !== id));
                Alert.alert("Erfolg", "Die Konversation wurde gelöscht.");
              } else {
                Alert.alert("Fehler", "Die Konversation konnte nicht gelöscht werden.");
              }
            } catch (error) {
              console.error('Fehler beim Löschen der Konversation:', error);
              Alert.alert("Fehler", "Die Konversation konnte nicht gelöscht werden.");
            }
          }
        }
      ]
    );
  };
  
  // Archivieren einer Konversation
  const handleArchiveConversation = async (id: string) => {
    try {
      const success = await archiveConversation(id);
      if (success) {
        // Aus der lokalen Liste entfernen
        setConversations(prev => prev.filter(conv => conv.id !== id));
        Alert.alert("Erfolg", "Die Konversation wurde archiviert.");
      } else {
        Alert.alert("Fehler", "Die Konversation konnte nicht archiviert werden.");
      }
    } catch (error) {
      console.error('Fehler beim Archivieren der Konversation:', error);
      Alert.alert("Fehler", "Die Konversation konnte nicht archiviert werden.");
    }
  };

  // Zustandsverwaltung für die Optionsmenüs der Konversationselemente
  const [expandedConversationId, setExpandedConversationId] = useState<string | null>(null);
  
  // Toggle-Funktion für das Optionsmenü
  const toggleOptionsMenu = (id: string) => {
    setExpandedConversationId(expandedConversationId === id ? null : id);
  };
  
  const renderConversationItem = ({ item }: { item: ConversationItem }) => {
    const showOptions = expandedConversationId === item.id;
    
    return (
      <View style={[
        styles.conversationItemWrapper, 
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
            styles.conversationItem,
            hovered && { backgroundColor: colors.cardHover },
            pressed && { opacity: 0.9 }
          ]}
          onPress={() => handleConversationPress(item.id)}
          onLongPress={() => toggleOptionsMenu(item.id)}
        >
          {({ pressed, hovered }) => (
            <>
              <View style={styles.conversationContent}>
                <View style={styles.conversationHeader}>
                  <View style={styles.titleRow}>
                    <Ionicons 
                      name="chatbubble-ellipses-outline" 
                      size={18} 
                      color={colors.primary} 
                      style={styles.titleIcon} 
                    />
                    <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
                      {item.title}
                    </Text>
                  </View>
                </View>
                
                <View style={styles.badgeContainer}>
                  <View style={[styles.modelBadge, { backgroundColor: colors.primary + '15' }]}>
                    <Text style={[styles.modelName, { color: colors.primary }]}>
                      {item.modelName}
                    </Text>
                  </View>
                  
                  <View style={[styles.modeBadge, { backgroundColor: colors.muted + '30' }]}>
                    <Text style={[styles.modeText, { color: colors.text + '90' }]}>
                      {item.mode === 'frei' ? 'Frei' : 
                      item.mode === 'geführt' ? 'Geführt' : 'Vorlage'}
                    </Text>
                  </View>
                  
                  <Text style={[styles.timestamp, { color: colors.text + '80' }]}>
                    {formatDate(item.timestamp)}
                  </Text>
                </View>
                
                <Text 
                  style={[styles.lastMessage, { color: colors.text + 'CC' }]}
                  numberOfLines={3}
                >
                  {item.lastMessage}
                </Text>
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
            <Pressable 
              style={({ pressed, hovered }) => [
                styles.optionButton,
                hovered && { backgroundColor: colors.menuItemHover },
                pressed && { opacity: 0.8 }
              ]}
              onPress={() => handleArchiveConversation(item.id)}
            >
              {({ pressed, hovered }) => (
                <>
                  <Ionicons name="archive-outline" size={18} color={colors.text} />
                  <Text style={[styles.optionText, { color: colors.text }]}>Archivieren</Text>
                </>
              )}
            </Pressable>
            
            <Pressable 
              style={({ pressed, hovered }) => [
                styles.optionButton,
                hovered && { backgroundColor: colors.dangerHover },
                pressed && { opacity: 0.8 }
              ]}
              onPress={() => handleDeleteConversation(item.id)}
            >
              {({ pressed, hovered }) => (
                <>
                  <Ionicons name="trash-outline" size={18} color="#FF3B30" />
                  <Text style={[styles.optionText, { color: "#FF3B30" }]}>Löschen</Text>
                </>
              )}
            </Pressable>
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.mainLayout}>
        {/* Permanenter Drawer links */}
        {isDrawerOpen && (
          <View style={styles.drawerContainer}>
            <CustomDrawer 
              isVisible={isDrawerOpen}
              onClose={() => setIsDrawerOpen(false)}
            />
          </View>
        )}
        
        {/* Hauptinhalt */}
        <View style={styles.mainContainer}>
          <View style={styles.contentContainer}>
            <View style={styles.headerContainer}>
              <Pressable
                style={({ pressed, hovered }) => [
                  styles.menuButton,
                  hovered && { backgroundColor: colors.menuItemHover },
                  pressed && { opacity: 0.7 }
                ]}
                onPress={() => setIsDrawerOpen(!isDrawerOpen)}
              >
                {({ pressed, hovered }) => (
                  <Ionicons 
                    name="menu-outline"
                    size={28} 
                    color={colors.text} 
                  />
                )}
              </Pressable>
              
              <Text style={[styles.headerTitle, { color: colors.text }]}>Konversationen</Text>
            </View>
            
            {/* Konversationsliste */}
            <View style={styles.listContainer}>
              {isLoading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color={colors.primary} />
                  <Text style={[styles.loadingText, { color: colors.text + '80' }]}>
                    Konversationen werden geladen...
                  </Text>
                </View>
              ) : conversations.length > 0 ? (
                <FlatList
                  data={conversations}
                  keyExtractor={(item) => item.id}
                  renderItem={renderConversationItem}
                  contentContainerStyle={styles.listContent}
                  numColumns={Platform.OS === 'web' ? Math.min(Math.floor((Dimensions.get('window').width - 32) / 400), 3) : 1}
                  key={Platform.OS === 'web' ? Math.min(Math.floor((Dimensions.get('window').width - 32) / 400), 3) : 1}
                />
              ) : (
                <View style={styles.emptyContainer}>
                  <Ionicons 
                    name="chatbubbles-outline" 
                    size={64} 
                    color={colors.text + '40'} 
                  />
                  <Text style={[styles.emptyText, { color: colors.text + '80' }]}>
                    Keine Konversationen vorhanden
                  </Text>
                  <Text style={[styles.emptySubtext, { color: colors.text + '60' }]}>
                    Starte eine neue Konversation über den Hauptbildschirm
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  mainLayout: {
    flex: 1,
    flexDirection: 'row',
  },
  mainContainer: {
    flex: 1,
    alignItems: 'center',
  },
  drawerContainer: {
    width: 260,
    height: '100%',
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    zIndex: 10,
  },
  contentContainer: {
    flex: 1,
    maxWidth: 1200,
    width: '100%',
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
    zIndex: 10, // Stelle sicher, dass der Header über allem anderen liegt
    elevation: 10, // Für Android
  },
  menuButton: {
    padding: 10,
    marginRight: 12,
    zIndex: 5,
    borderRadius: 20,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  listContainer: {
    flex: 1,
    width: '100%',
    paddingHorizontal: 16,
  },
  listContent: {
    paddingBottom: 20,
    paddingTop: 12,
    gap: 16,
    alignSelf: 'center',
    justifyContent: Platform.OS === 'web' ? 'flex-start' : undefined,
  },
  conversationItemWrapper: {
    borderRadius: 12,
    overflow: 'hidden',
    margin: 8,
    width: Platform.OS === 'web' ? 380 : undefined,
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
  conversationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
  },
  conversationContent: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
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
  conversationHeader: {
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
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
    marginBottom: 2,
  },
  badgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 8,
    flexWrap: 'wrap',
  },
  modelBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  modelName: {
    fontSize: 12,
    fontWeight: '500',
  },
  modeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  timestamp: {
    fontSize: 11,
    marginLeft: 'auto', // Um es an den rechten Rand zu schieben
  },
  lastMessage: {
    fontSize: 14,
    marginBottom: 6,
    lineHeight: 20,
    marginTop: 4,
    flex: 1, // Damit die Nachricht den verbleibenden Platz einnimmt
  },
  modeText: {
    fontSize: 11,
    fontWeight: '500',
  },
  optionsButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Container für den Ladezustand
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    marginTop: 40,
  },
  loadingText: {
    fontSize: 16,
    marginTop: 16,
    textAlign: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    marginTop: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
  },
});