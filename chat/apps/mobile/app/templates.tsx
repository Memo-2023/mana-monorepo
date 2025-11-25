import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  SafeAreaView, 
  Alert,
  Modal,
  ActivityIndicator
} from 'react-native';
import { useTheme, useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthProvider';
import { useAppTheme } from '../theme/ThemeProvider';

import TemplateCard from '../components/TemplateCard';
import TemplateForm from '../components/TemplateForm';
import CustomDrawer from '../components/CustomDrawer';
import { 
  Template, 
  getTemplates, 
  createTemplate, 
  updateTemplate,
  deleteTemplate, 
  setDefaultTemplate 
} from '../services/template';

export default function TemplatesScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { user } = useAuth();
  const { isDarkMode } = useAppTheme();
  
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormModalVisible, setIsFormModalVisible] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  
  // Lade die Vorlagen
  const loadTemplates = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const userTemplates = await getTemplates(user.id);
      setTemplates(userTemplates);
    } catch (error) {
      console.error('Fehler beim Laden der Vorlagen:', error);
      Alert.alert('Fehler', 'Die Vorlagen konnten nicht geladen werden.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Lade Vorlagen beim ersten Laden und wenn der Benutzer sich ändert
  useEffect(() => {
    loadTemplates();
  }, [user]);
  
  // Lade Vorlagen erneut, wenn der Screen fokussiert wird
  useFocusEffect(
    useCallback(() => {
      if (user) loadTemplates();
      return () => {};
    }, [user])
  );
  
  // Öffne das Formular zum Erstellen einer neuen Vorlage
  const handleCreateTemplate = () => {
    setSelectedTemplate(null);
    setIsFormModalVisible(true);
  };
  
  // Öffne das Formular zum Bearbeiten einer Vorlage
  const handleEditTemplate = (id: string) => {
    const template = templates.find(t => t.id === id);
    if (template) {
      setSelectedTemplate(template);
      setIsFormModalVisible(true);
    }
  };
  
  // Lösche eine Vorlage nach Bestätigung
  const handleDeleteTemplate = (id: string) => {
    Alert.alert(
      "Vorlage löschen",
      "Möchtest du diese Vorlage wirklich löschen?",
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
              const success = await deleteTemplate(id);
              if (success) {
                setTemplates(prev => prev.filter(t => t.id !== id));
              } else {
                Alert.alert("Fehler", "Die Vorlage konnte nicht gelöscht werden.");
              }
            } catch (error) {
              console.error('Fehler beim Löschen der Vorlage:', error);
              Alert.alert("Fehler", "Die Vorlage konnte nicht gelöscht werden.");
            }
          }
        }
      ]
    );
  };
  
  // Setze eine Vorlage als Standard
  const handleSetDefaultTemplate = async (id: string) => {
    if (!user) return;
    
    try {
      const success = await setDefaultTemplate(id, user.id);
      if (success) {
        // Aktualisiere den lokalen Zustand, um die Änderungen anzuzeigen
        setTemplates(prev => 
          prev.map(t => ({
            ...t,
            is_default: t.id === id
          }))
        );
      } else {
        Alert.alert("Fehler", "Die Standardvorlage konnte nicht gesetzt werden.");
      }
    } catch (error) {
      console.error('Fehler beim Setzen der Standardvorlage:', error);
      Alert.alert("Fehler", "Die Standardvorlage konnte nicht gesetzt werden.");
    }
  };
  
  // Speichert eine neue oder bearbeitete Vorlage
  const handleSubmitTemplate = async (templateData: Partial<Template>) => {
    if (!user) return;
    
    try {
      // Prüfe, ob wir eine bestehende Vorlage bearbeiten oder eine neue erstellen
      if (templateData.id) {
        // Aktualisiere eine bestehende Vorlage
        const success = await updateTemplate(templateData.id, {
          name: templateData.name,
          description: templateData.description,
          system_prompt: templateData.system_prompt,
          initial_question: templateData.initial_question,
          color: templateData.color,
          model_id: templateData.model_id,
          document_mode: templateData.document_mode
        });
        
        if (success) {
          setTemplates(prev => 
            prev.map(t => 
              t.id === templateData.id 
                ? { ...t, ...templateData }
                : t
            )
          );
        } else {
          Alert.alert("Fehler", "Die Vorlage konnte nicht aktualisiert werden.");
        }
      } else {
        // Erstelle eine neue Vorlage
        const newTemplate = await createTemplate({
          user_id: user.id,
          name: templateData.name!,
          description: templateData.description,
          system_prompt: templateData.system_prompt!,
          initial_question: templateData.initial_question,
          color: templateData.color!,
          model_id: templateData.model_id,
          is_default: false,
          document_mode: templateData.document_mode || false,
        });
        
        if (newTemplate) {
          setTemplates(prev => [...prev, newTemplate]);
        } else {
          Alert.alert("Fehler", "Die Vorlage konnte nicht erstellt werden.");
        }
      }
      
      // Schließe das Modal
      setIsFormModalVisible(false);
    } catch (error) {
      console.error('Fehler beim Speichern der Vorlage:', error);
      Alert.alert("Fehler", "Die Vorlage konnte nicht gespeichert werden.");
    }
  };
  
  // Starte einen neuen Chat mit einer Vorlage
  const handleUseTemplate = (id: string) => {
    const template = templates.find(t => t.id === id);
    if (template) {
      // Erstelle einen neuen Chat mit dieser Vorlage
      router.push({
        pathname: '/conversation/new',
        params: {
          templateId: template.id,
          mode: 'template',
          documentMode: template.document_mode ? 'true' : 'false'
        }
      });
    }
  };
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.mainLayout}>
        {/* Drawer / Seitenmenü */}
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
            <View style={styles.header}>
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
              
              <Text style={[styles.title, { color: colors.text }]}>Vorlagen</Text>
              
              <TouchableOpacity 
                style={[styles.addButton, { backgroundColor: colors.primary }]}
                onPress={handleCreateTemplate}
              >
                <Ionicons name="add" size={20} color="white" />
                <Text style={styles.addButtonText}>Neue Vorlage</Text>
              </TouchableOpacity>
            </View>
        
            {/* Beschreibung */}
            <View style={styles.descriptionContainer}>
              <Text style={[styles.description, { color: colors.text + 'CC' }]}>
                Erstelle Vorlagen mit benutzerdefinierten System-Prompts für verschiedene KI-Verhaltensweisen.
              </Text>
            </View>
        
            {/* Vorlagenliste */}
            {isLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={[styles.loadingText, { color: colors.text + '80' }]}>
                  Vorlagen werden geladen...
                </Text>
              </View>
            ) : templates.length > 0 ? (
              <FlatList
                data={templates}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <TemplateCard
                    id={item.id}
                    name={item.name}
                    description={item.description}
                    systemPrompt={item.system_prompt}
                    color={item.color}
                    isDefault={item.is_default}
                    onPress={handleUseTemplate}
                    onEdit={handleEditTemplate}
                    onDelete={handleDeleteTemplate}
                    onSetDefault={handleSetDefaultTemplate}
                  />
                )}
                contentContainerStyle={styles.listContent}
              />
            ) : (
              <View style={styles.emptyContainer}>
                <Ionicons 
                  name="document-text-outline" 
                  size={64} 
                  color={colors.text + '40'} 
                />
                <Text style={[styles.emptyText, { color: colors.text + '80' }]}>
                  Keine Vorlagen vorhanden
                </Text>
                <Text style={[styles.emptySubtext, { color: colors.text + '60' }]}>
                  Erstelle deine erste Vorlage, um loszulegen
                </Text>
              </View>
            )}
            
            {/* Modal für das Erstellen/Bearbeiten von Vorlagen */}
            <Modal
              visible={isFormModalVisible}
              animationType="slide"
              transparent={false}
              onRequestClose={() => setIsFormModalVisible(false)}
            >
              <SafeAreaView style={styles.modalContainer}>
                <TemplateForm
                  initialData={selectedTemplate || undefined}
                  onSubmit={handleSubmitTemplate}
                  onCancel={() => setIsFormModalVisible(false)}
                />
              </SafeAreaView>
            </Modal>
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
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    maxWidth: 800,
    width: '100%',
    alignSelf: 'center',
  },
  menuButton: {
    padding: 8,
    marginRight: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    flex: 1,
    marginLeft: 8,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  addButtonText: {
    color: 'white',
    fontWeight: '500',
    marginLeft: 4,
  },
  descriptionContainer: {
    paddingHorizontal: 20,
    marginBottom: 16,
    maxWidth: 800,
    width: '100%',
    alignSelf: 'center',
  },
  description: {
    fontSize: 14,
  },
  listContent: {
    padding: 16,
    paddingHorizontal: 20,
    paddingBottom: 120,
    maxWidth: 800,
    width: '100%',
    alignSelf: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  emptyContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingTop: 40,
    height: 300,
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
  modalContainer: {
    flex: 1,
  },
});