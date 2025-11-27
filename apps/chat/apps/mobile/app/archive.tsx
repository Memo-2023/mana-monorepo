import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  SafeAreaView, 
  Alert,
  ActivityIndicator 
} from 'react-native';
import { useTheme, useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthProvider';
import { useAppTheme } from '../theme/ThemeProvider';
import CustomDrawer from '../components/CustomDrawer';
import {
  getArchivedConversations,
  getMessages,
  deleteConversation,
  unarchiveConversation
} from '../services/conversation';
import { modelApi } from '../services/api';

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

export default function ArchiveScreen() {
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
      console.log("Lade archivierte Konversationen für User:", user.id);
      // Lade alle archivierten Konversationen des Benutzers
      const userConversations = await getArchivedConversations(user.id);
      console.log(`${userConversations.length} archivierte Konversationen geladen`, new Date().toLocaleTimeString());
      
      // Lade für jede Konversation die letzte Nachricht und das Modell
      const conversationItems: ConversationItem[] = [];
      
      for (const conv of userConversations) {
        try {
          // Lade die Nachrichten der Konversation
          const messages = await getMessages(conv.id);
          // Lade das Modell über die Backend API
          const modelData = await modelApi.getModel(conv.model_id);

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
  
  // Wiederherstellen einer archivierten Konversation
  const handleUnarchiveConversation = async (id: string) => {
    try {
      const success = await unarchiveConversation(id);
      if (success) {
        // Aus der lokalen Liste entfernen
        setConversations(prev => prev.filter(conv => conv.id !== id));
        Alert.alert("Erfolg", "Die Konversation wurde wiederhergestellt.");
      } else {
        Alert.alert("Fehler", "Die Konversation konnte nicht wiederhergestellt werden.");
      }
    } catch (error) {
      console.error('Fehler beim Wiederherstellen der Konversation:', error);
      Alert.alert("Fehler", "Die Konversation konnte nicht wiederhergestellt werden.");
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
      <View style={[styles.conversationItemWrapper, { backgroundColor: colors.card }]}>
        <TouchableOpacity
          style={styles.conversationItem}
          onPress={() => handleConversationPress(item.id)}
          onLongPress={() => toggleOptionsMenu(item.id)}
        >
          <View style={styles.conversationContent}>
            <View style={styles.conversationHeader}>
              <View style={styles.titleRow}>
                <Ionicons 
                  name="archive-outline" 
                  size={18} 
                  color={colors.text} 
                  style={styles.titleIcon} 
                />
                <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
                  {item.title}
                </Text>
              </View>
              <Text style={[styles.timestamp, { color: colors.text + '80' }]}>
                {formatDate(item.timestamp)}
              </Text>
            </View>
            <View style={styles.modelContainer}>
              <Text style={[styles.modelName, { color: colors.text + 'AA' }]}>
                {item.modelName}
              </Text>
            </View>
            
            <Text 
              style={[styles.lastMessage, { color: colors.text + 'CC' }]}
              numberOfLines={1}
            >
              {item.lastMessage}
            </Text>
            
            <View style={styles.modeContainer}>
              <Text style={[styles.modeText, { color: colors.text + '80' }]}>
                {item.mode === 'frei' ? 'Freier Modus' : 
                item.mode === 'geführt' ? 'Geführter Modus' : 'Vorlagen-Modus'}
              </Text>
            </View>
          </View>
          
          <TouchableOpacity onPress={() => toggleOptionsMenu(item.id)}>
            <Ionicons name="ellipsis-vertical" size={20} color={colors.text + '80'} />
          </TouchableOpacity>
        </TouchableOpacity>
        
        {showOptions && (
          <View style={[styles.optionsContainer, { backgroundColor: colors.card }]}>
            <TouchableOpacity 
              style={styles.optionButton}
              onPress={() => handleUnarchiveConversation(item.id)}
            >
              <Ionicons name="arrow-undo-outline" size={18} color={colors.text} />
              <Text style={[styles.optionText, { color: colors.text }]}>Wiederherstellen</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.optionButton}
              onPress={() => handleDeleteConversation(item.id)}
            >
              <Ionicons name="trash-outline" size={18} color="#FF3B30" />
              <Text style={[styles.optionText, { color: "#FF3B30" }]}>Löschen</Text>
            </TouchableOpacity>
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
              <TouchableOpacity
                style={styles.menuButton}
                onPress={() => setIsDrawerOpen(!isDrawerOpen)}
              >
                <Ionicons 
                  name="menu-outline"
                  size={28} 
                  color={colors.text} 
                />
              </TouchableOpacity>
              
              <View style={styles.headerContentContainer}>
                <TouchableOpacity
                  style={styles.backButton}
                  onPress={() => router.back()}
                >
                  <Ionicons name="chevron-back" size={24} color={colors.text} />
                </TouchableOpacity>
                
                <Text style={[styles.title, { color: colors.text }]}>Archiv</Text>
              </View>
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
                />
              ) : (
                <View style={styles.emptyContainer}>
                  <Ionicons 
                    name="archive-outline" 
                    size={64} 
                    color={colors.text + '40'} 
                  />
                  <Text style={[styles.emptyText, { color: colors.text + '80' }]}>
                    Keine archivierten Konversationen
                  </Text>
                  <Text style={[styles.emptySubtext, { color: colors.text + '60' }]}>
                    Archivierte Gespräche erscheinen hier
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
    width: '100%',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  menuButton: {
    padding: 12,
    marginRight: 0,
    zIndex: 5,
  },
  headerContentContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  listContainer: {
    flex: 1,
    width: '100%',
    maxWidth: 800,
    alignSelf: 'center',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 120,
    width: '100%',
    maxWidth: 800,
    alignSelf: 'center',
  },
  conversationItemWrapper: {
    borderRadius: 12,
    marginTop: 12,
    overflow: 'hidden',
  },
  conversationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  conversationContent: {
    flex: 1,
  },
  optionsContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
    paddingBottom: 12,
    paddingTop: 4,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginLeft: 12,
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
  timestamp: {
    fontSize: 12,
  },
  modelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  modelName: {
    fontSize: 12,
    fontWeight: '400',
  },
  lastMessage: {
    fontSize: 14,
    marginBottom: 6,
  },
  modeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modeText: {
    fontSize: 12,
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
    marginTop: 8,
    textAlign: 'center',
  },
});