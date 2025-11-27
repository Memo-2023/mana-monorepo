import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  useWindowDimensions,
  Platform
} from 'react-native';
import { useTheme } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Document, getLatestDocument } from '../services/document';
import { conversationApi } from '../services/api';
import { useAuth } from '../context/AuthProvider';
import Markdown from 'react-native-markdown-display';

type DocumentWithTitle = Document & {
  conversation_title: string;
};

export default function DocumentsScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { user } = useAuth();
  const { width } = useWindowDimensions();
  const [documents, setDocuments] = useState<DocumentWithTitle[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Berechne die Anzahl der Spalten basierend auf der Bildschirmbreite
  const columnsCount = useMemo(() => {
    // Mobile (schmaler Bildschirm)
    if (width < 600) {
      return 1;
    }
    // Tablet
    if (width < 1100) {
      return 2;
    }
    // Desktop oder großes Tablet
    return 3;
  }, [width]);

  // Berechne die Breite jeder Karte basierend auf der Spaltenanzahl
  const cardWidth = useMemo(() => {
    const padding = 16;  // Container-Padding rechts und links
    const gap = 16;      // Abstand zwischen Karten
    const contentWidth = width - (padding * 2);
    const gapTotal = gap * (columnsCount - 1);
    const availableWidth = contentWidth - gapTotal;

    // Verhältnis für schmalere Karten, je nach Spaltenanzahl anpassen
    const widthRatio = columnsCount === 1 ? 0.95 : // Fast volle Breite bei 1 Spalte
                       columnsCount === 2 ? 0.48 : // Etwas schmaler bei 2 Spalten
                       0.31;                       // Noch schmaler bei 3 Spalten

    return (availableWidth * widthRatio);
  }, [width, columnsCount]);

  useEffect(() => {
    if (user?.id) {
      loadDocuments();
    }
  }, [user]);

  const loadDocuments = async () => {
    try {
      setIsLoading(true);

      // Lade alle Konversationen des Benutzers über die Backend-API
      const conversations = await conversationApi.getConversations();

      // Filtere nur Konversationen im Dokumentmodus
      const documentConversations = conversations.filter(conv => conv.documentMode);

      if (documentConversations.length === 0) {
        setDocuments([]);
        setIsLoading(false);
        return;
      }

      // Für jede Konversation den neuesten Dokumentstand laden
      const latestDocuments: DocumentWithTitle[] = [];

      for (const conv of documentConversations) {
        try {
          const docData = await getLatestDocument(conv.id);

          if (docData) {
            latestDocuments.push({
              ...docData,
              conversation_title: conv.title || 'Unbenannte Konversation'
            });
          }
        } catch (docError) {
          console.error(`Fehler beim Laden des Dokuments für Konversation ${conv.id}:`, docError);
        }
      }

      setDocuments(latestDocuments);
    } catch (error) {
      console.error('Fehler beim Laden der Dokumente:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const navigateToConversation = (conversationId: string) => {
    router.push(`/conversation/${conversationId}`);
  };

  // Funktion zum Extrahieren eines Titels aus dem Dokumentinhalt
  const extractDocumentTitle = (content: string): string => {
    // Suche nach einer Markdown-Überschrift Ebene 1 am Anfang
    const titleMatch = content.match(/^#\s+(.+)$/m);
    if (titleMatch && titleMatch[1]) {
      return titleMatch[1].trim();
    }
    
    // Alternativ: Suche nach einer Markdown-Überschrift Ebene 2
    const subtitleMatch = content.match(/^##\s+(.+)$/m);
    if (subtitleMatch && subtitleMatch[1]) {
      return subtitleMatch[1].trim();
    }
    
    // Wenn keine Überschrift gefunden wurde, nimm die ersten Wörter
    const firstLine = content.split('\n')[0].trim();
    if (firstLine.length > 0) {
      return firstLine.length > 40 ? `${firstLine.substring(0, 37)}...` : firstLine;
    }
    
    return 'Dokument ohne Titel';
  };
  
  // Funktion zum Entfernen nur der ersten H1-Überschrift aus dem Inhalt
  const removeHeadingFromContent = (content: string, title: string): string => {
    // Prüfe, ob das Dokument mit einer H1-Überschrift beginnt
    const firstLineMatch = content.match(/^#\s+(.+)$/m);
    
    if (firstLineMatch && firstLineMatch.index === 0) {
      // Entferne nur die erste H1-Überschrift am Anfang des Dokuments
      const parts = content.split('\n');
      parts.shift(); // Entferne die erste Zeile (H1-Überschrift)
      
      // Entferne leere Zeilen am Anfang
      let modifiedContent = parts.join('\n').replace(/^\s+/, '');
      
      return modifiedContent;
    }
    
    // Wenn keine H1-Überschrift am Anfang gefunden wurde, 
    // gib den ursprünglichen Inhalt zurück
    return content;
  };
  
  // Funktion zum Formatieren des Datums
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Alle Dokumente</Text>
        <TouchableOpacity style={styles.refreshButton} onPress={loadDocuments}>
          <Ionicons name="refresh" size={24} color={colors.text} />
        </TouchableOpacity>
      </View>
      
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.text }]}>
            Dokumente werden geladen...
          </Text>
        </View>
      ) : documents.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="document-text-outline" size={64} color={colors.text} style={styles.emptyIcon} />
          <Text style={[styles.emptyText, { color: colors.text }]}>
            Keine Dokumente gefunden
          </Text>
          <Text style={[styles.emptySubtext, { color: colors.text }]}>
            Erstelle ein neues Dokument in einer Konversation mit aktiviertem Dokumentmodus.
          </Text>
        </View>
      ) : (
        <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.documentsContainer}>
          {documents.map((doc) => (
            <TouchableOpacity
              key={doc.id}
              style={[
                styles.documentCard,
                { 
                  backgroundColor: colors.card, 
                  borderColor: colors.border,
                  width: cardWidth,
                  // Keine quadratischen Karten mehr, stattdessen festgelegte Höhen
                  height: 280,
                  minHeight: 220, 
                  maxHeight: 320
                }
              ]}
              onPress={() => navigateToConversation(doc.conversation_id)}
            >
              <View style={styles.documentHeader}>
                <Text style={[styles.documentTitle, { color: colors.text }]}>
                  {extractDocumentTitle(doc.content)}
                </Text>
                <View style={styles.documentMeta}>
                  <Text style={[styles.conversationTitle, { color: colors.text }]}>
                    {doc.conversation_title}
                  </Text>
                  <View style={styles.metaRight}>
                    <Text style={[styles.documentDate, { color: colors.text }]}>
                      {formatDate(doc.updated_at)}
                    </Text>
                    <Text style={[styles.documentVersion, { color: colors.text }]}>
                      v{doc.version}
                    </Text>
                  </View>
                </View>
              </View>
              <View style={styles.contentContainer}>
                <ScrollView style={styles.documentContent} nestedScrollEnabled={true}>
                  <Markdown
                    style={{
                      body: { 
                        color: colors.text,
                        fontSize: 13,
                        lineHeight: 18
                      },
                      // Normale Anzeige für H1-Überschriften im Inhalt
                      heading1: {
                        color: colors.text,
                        fontSize: 16,
                        fontWeight: 'bold',
                        marginTop: 8,
                        marginBottom: 6,
                        lineHeight: 20,
                        paddingBottom: 4,
                        borderBottomWidth: 1,
                        borderBottomColor: 'rgba(0,0,0,0.1)',
                      },
                      heading2: {
                        color: colors.text,
                        fontSize: 14,
                        fontWeight: 'bold',
                        marginVertical: 5,
                        lineHeight: 18
                      },
                      paragraph: { 
                        color: colors.text,
                        marginBottom: 8,
                        fontSize: 13,
                        lineHeight: 18
                      },
                      blockquote: {
                        backgroundColor: colors.card,
                        borderLeftColor: colors.primary,
                        borderLeftWidth: 2,
                        paddingHorizontal: 8,
                        paddingVertical: 4,
                        marginVertical: 6
                      },
                      code_block: {
                        backgroundColor: colors.card,
                        padding: 6,
                        borderRadius: 3,
                        fontSize: 12,
                        lineHeight: 16
                      },
                      link: { color: colors.primary }
                    }}
                  >
                    {removeHeadingFromContent(doc.content, extractDocumentTitle(doc.content))}
                  </Markdown>
                </ScrollView>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  backButton: {
    padding: 6,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    flex: 1,
    paddingLeft: 12,
  },
  refreshButton: {
    padding: 6,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyIcon: {
    marginBottom: 20,
    opacity: 0.6,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
    opacity: 0.7,
    maxWidth: '80%',
  },
  scrollContainer: {
    flex: 1,
  },
  documentsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    // In einem flexiblen Layout nicht mehr space-between verwenden
    // sondern einen festen Abstand zwischen Items
    gap: 20,
    // Alignment um die Karten horizontal zu zentrieren
    justifyContent: 'center'
  },
  documentCard: {
    // width wird dynamisch basierend auf columnsCount berechnet
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    // Shadow für die Karten hinzufügen
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
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
      },
    }),
  },
  documentHeader: {
    padding: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  documentTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    lineHeight: 22,
  },
  documentMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingRight: 8,
  },
  conversationTitle: {
    fontSize: 12,
    opacity: 0.7,
    flex: 1,
  },
  metaRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  documentDate: {
    fontSize: 11,
    opacity: 0.7,
  },
  documentVersion: {
    fontSize: 12,
    fontWeight: 'bold',
    backgroundColor: 'rgba(0,0,0,0.1)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  contentContainer: {
    flex: 1,
    // Vorschau-Bereich kleiner machen
    maxHeight: 180,
  },
  documentContent: {
    padding: 12,
    // Zusätzliche Eigenschaften für einen besseren Vorschaubereich
    paddingTop: 8,
  },
});