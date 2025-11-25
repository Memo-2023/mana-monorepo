import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  SafeAreaView,
  Alert,
} from 'react-native';
import { useTheme } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Document } from '../services/document';

interface DocumentVersionsProps {
  isVisible: boolean;
  documents: Document[];
  onClose: () => void;
  onSelectVersion: (document: Document) => void;
  onDeleteVersion?: (document: Document) => void;
}

export default function DocumentVersions({
  isVisible,
  documents,
  onClose,
  onSelectVersion,
  onDeleteVersion
}: DocumentVersionsProps) {
  const { colors } = useTheme();

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderVersionItem = (document: Document, isLatest: boolean) => {
    // Löschen nur anzeigen, wenn es mehr als eine Version gibt und es nicht die neueste ist
    // oder wenn es die einzige Version ist (nur zur Konsistenz)
    const canDelete = documents.length > 1 || !isLatest;
    
    return (
      <View 
        key={document.id}
        style={[
          styles.versionItem,
          { borderBottomColor: colors.border }
        ]}
      >
        <TouchableOpacity
          style={{flex: 1}}
          activeOpacity={0.6}
          onPress={() => {
            console.log('Version auswählen:', document.id);
            onSelectVersion(document);
          }}
        >
        <View style={styles.versionHeader}>
          <View style={styles.versionBadge}>
            <Text style={styles.versionNumber}>v{document.version}</Text>
          </View>
          {isLatest && (
            <View style={[styles.latestBadge, { backgroundColor: colors.primary }]}>
              <Text style={styles.latestText}>Aktuell</Text>
            </View>
          )}
          
        </View>
        
        <Text style={[styles.versionDate, { color: colors.text + '99' }]}>
          {formatDate(document.created_at)}
        </Text>
        
        <Text 
          style={[styles.versionPreview, { color: colors.text }]}
          numberOfLines={2}
        >
          {document.content.substring(0, 150)}
          {document.content.length > 150 ? '...' : ''}
        </Text>
        </TouchableOpacity>
        
        {/* Löschen-Button außerhalb der Touchable-Fläche für den Artikel */}
        {canDelete && onDeleteVersion && (
          <TouchableOpacity
            style={[styles.deleteSeparateButton, { backgroundColor: colors.card }]}
            activeOpacity={0.7}
            onPress={() => {
              console.log("Löschen-Button separat wurde gedrückt für:", document.id);
              
              // Direkter Aufruf für Testzwecke
              if (onDeleteVersion) {
                console.log("Rufe onDeleteVersion direkt auf für Dokument ID:", document.id);
                onDeleteVersion(document);
                
                // Schließe das Modal nach einer kurzen Verzögerung
                setTimeout(() => {
                  onClose();
                }, 100);
              } else {
                console.error("onDeleteVersion ist nicht definiert!");
              }
            }}
          >
            <Ionicons name="trash" size={18} color="red" />
            <Text style={styles.deleteButtonText}>Löschen</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      transparent={false}
    >
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
          >
            <Ionicons name="close" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.text }]}>Dokumentversionen</Text>
        </View>
        
        <ScrollView style={styles.versionsList}>
          {documents.map((document, index) => renderVersionItem(document, index === 0))}
          
          {documents.length === 0 && (
            <View style={styles.emptyState}>
              <Ionicons name="document-outline" size={48} color={colors.text + '40'} />
              <Text style={[styles.emptyText, { color: colors.text + '80' }]}>
                Keine Dokumentversionen verfügbar
              </Text>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
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
  closeButton: {
    padding: 8,
    marginRight: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  versionsList: {
    flex: 1,
  },
  versionItem: {
    padding: 16,
    borderBottomWidth: 1,
  },
  versionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  versionBadge: {
    backgroundColor: '#e0e0e0',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  versionNumber: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
  },
  latestBadge: {
    marginLeft: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  latestText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
  },
  deleteSeparateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    marginHorizontal: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ff3b30',
  },
  deleteButtonText: {
    color: 'red',
    marginLeft: 6,
    fontSize: 14,
    fontWeight: '500',
  },
  versionDate: {
    fontSize: 13,
    marginBottom: 8,
  },
  versionPreview: {
    fontSize: 14,
    lineHeight: 20,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    textAlign: 'center',
  },
});