import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  useWindowDimensions,
  Platform,
  Alert,
} from 'react-native';
import { useTheme } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Document } from '../services/document';
import Markdown from 'react-native-markdown-display';

interface DocumentPanelProps {
  document: Document | null;
  isLoading?: boolean;
  versionCount: number;
  onSave?: (content: string) => void;
  onShowVersions?: () => void;
  onNextVersion?: () => void;
  onPreviousVersion?: () => void;
  onDeleteVersion?: (document: Document) => void;
}

// Hilfsfunktion, um zu prüfen, ob der Dark Mode aktiv ist
const isDarkMode = (colors: any) => {
  return colors.background === '#000' || 
         colors.background === '#121212' || 
         colors.background.includes('rgba(0,0,0') ||
         colors.text === '#fff' || 
         colors.text === '#ffffff';
};

export default function DocumentPanel({
  document,
  isLoading = false,
  versionCount,
  onSave,
  onShowVersions,
  onNextVersion,
  onPreviousVersion,
  onDeleteVersion
}: DocumentPanelProps) {
  const { colors } = useTheme();
  const [content, setContent] = useState<string>(document?.content || '');
  const [editing, setEditing] = useState<boolean>(false);
  const { width } = useWindowDimensions();
  
  // Aktualisiere den Content, wenn sich das Dokument ändert
  useEffect(() => {
    if (document) {
      setContent(document.content);
    }
  }, [document]);

  const handleEdit = () => {
    setEditing(true);
  };

  const handleCancel = () => {
    setContent(document?.content || '');
    setEditing(false);
  };

  const handleSave = () => {
    if (onSave) {
      onSave(content);
    }
    setEditing(false);
  };

  const renderVersionControls = () => {
    // Aktuelle Version und Versionszählung
    const currentVersion = document?.version || 1;
    const hasMultipleVersions = versionCount > 1;
    const canGoBack = currentVersion > 1;
    const canGoForward = currentVersion < versionCount;
    
    return (
      <View style={styles.versionControls}>
        {/* Pfeil zurück */}
        <TouchableOpacity 
          style={[
            styles.versionArrow,
            !canGoBack && styles.versionArrowDisabled
          ]}
          onPress={canGoBack ? onPreviousVersion : undefined}
          disabled={!canGoBack}
        >
          <Ionicons 
            name="chevron-back" 
            size={16} 
            color={canGoBack ? '#666' : '#CCC'} 
          />
        </TouchableOpacity>
        
        {/* Version Badge */}
        <TouchableOpacity 
          style={styles.versionBadge}
          onPress={onShowVersions}
        >
          <Text style={styles.versionText}>v{currentVersion}</Text>
          {hasMultipleVersions && (
            <Text style={styles.versionCount}>{versionCount}</Text>
          )}
        </TouchableOpacity>
        
        {/* Pfeil vorwärts */}
        <TouchableOpacity 
          style={[
            styles.versionArrow,
            !canGoForward && styles.versionArrowDisabled
          ]}
          onPress={canGoForward ? onNextVersion : undefined}
          disabled={!canGoForward}
        >
          <Ionicons 
            name="chevron-forward" 
            size={16} 
            color={canGoForward ? '#666' : '#CCC'} 
          />
        </TouchableOpacity>
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.card }]}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>Dokument</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.text }]}>
            Dokument wird geladen...
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.card }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Dokument</Text>
        {renderVersionControls()}
        <View style={styles.actions}>
          {editing ? (
            <>
              <TouchableOpacity style={styles.actionButton} onPress={handleCancel}>
                <Ionicons name="close" size={22} color={colors.text} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton} onPress={handleSave}>
                <Ionicons name="checkmark" size={22} color={colors.primary} />
              </TouchableOpacity>
            </>
          ) : (
            <>
              {document && onDeleteVersion && versionCount > 1 && (
                <TouchableOpacity 
                  style={styles.actionButton} 
                  onPress={() => {
                    if (document) {
                      console.log('Löschen-Button in DocumentPanel gedrückt für Version:', document.version);
                      
                      Alert.alert(
                        "Version löschen",
                        `Möchtest du die Version ${document.version} wirklich löschen?`,
                        [
                          {
                            text: "Abbrechen",
                            style: "cancel"
                          },
                          {
                            text: "Löschen",
                            style: "destructive",
                            onPress: () => {
                              console.log('Löschvorgang bestätigt für Version:', document.version);
                              if (onDeleteVersion) {
                                onDeleteVersion(document);
                              } else {
                                console.error('onDeleteVersion Funktion ist nicht definiert');
                              }
                            }
                          }
                        ]
                      );
                    }
                  }}
                >
                  <Ionicons name="trash-outline" size={22} color="#ff3b30" />
                  <Text style={{fontSize: 10, color: '#ff3b30', marginLeft: 4}}>Löschen</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity style={styles.actionButton} onPress={handleEdit}>
                <Ionicons name="create-outline" size={22} color={colors.text} />
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
      {editing ? (
        <TextInput
          style={[
            styles.editor,
            { 
              color: colors.text,
              backgroundColor: colors.background,
              borderColor: colors.border
            }
          ]}
          multiline
          value={content}
          onChangeText={setContent}
          autoFocus
          textAlignVertical="top"
        />
      ) : (
        <ScrollView style={styles.contentContainer}>
          {document?.content ? (
            <Markdown
              style={{
                body: { 
                  color: colors.text,
                  fontSize: 15,
                  lineHeight: 22
                },
                heading1: {
                  color: colors.text,
                  borderBottomWidth: 1,
                  borderBottomColor: colors.border,
                  paddingBottom: 8,
                  marginBottom: 12
                },
                heading2: {
                  color: colors.text,
                  borderBottomWidth: 1,
                  borderBottomColor: colors.border + '60',
                  paddingBottom: 6,
                  marginBottom: 10
                },
                heading3: { color: colors.text },
                heading4: { color: colors.text },
                heading5: { color: colors.text },
                heading6: { color: colors.text },
                paragraph: { 
                  color: colors.text,
                  marginBottom: 12
                },
                list_item: { color: colors.text },
                blockquote: {
                  backgroundColor: colors.card,
                  borderLeftColor: colors.primary,
                  borderLeftWidth: 4,
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  marginVertical: 8
                },
                code_block: {
                  backgroundColor: isDarkMode(colors) ? '#1E1E1E' : '#F5F5F5',
                  padding: 10,
                  borderRadius: 6
                },
                link: { color: colors.primary }
              }}
            >
              {document.content}
            </Markdown>
          ) : (
            <Text style={[styles.content, { color: colors.text }]}>
              Noch kein Dokument erstellt.
            </Text>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
    marginHorizontal: 16,
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
  },
  versionControls: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
  },
  versionArrow: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  versionArrowDisabled: {
    backgroundColor: 'rgba(0,0,0,0.02)',
  },
  versionBadge: {
    backgroundColor: 'rgba(0,0,0,0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 4,
  },
  versionText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#666',
  },
  versionCount: {
    fontSize: 10,
    fontWeight: '700',
    color: '#fff',
    backgroundColor: '#666',
    width: 16,
    height: 16,
    borderRadius: 8,
    textAlign: 'center',
    lineHeight: 16,
    marginLeft: 4,
  },
  actions: {
    flexDirection: 'row',
  },
  actionButton: {
    padding: 6,
    marginLeft: 8,
  },
  contentContainer: {
    padding: 16,
    flex: 1,
    paddingBottom: 60, // Extra padding für besseres Scrollen
  },
  content: {
    fontSize: 15,
    lineHeight: 22,
  },
  editor: {
    flex: 1,
    padding: 16,
    fontSize: 15,
    lineHeight: 24,
    borderWidth: 1,
    borderRadius: 8,
    margin: 8,
    textAlignVertical: 'top',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
  },
});