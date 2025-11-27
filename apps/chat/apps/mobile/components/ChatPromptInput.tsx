import React, { useState, forwardRef, useImperativeHandle, useRef, useEffect } from 'react';
import { View, TextInput, TouchableOpacity, Text, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { useTheme } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../theme/ThemeProvider';
import ModelDropdown from './ModelDropdown';
import { useRouter } from 'expo-router';
import { createConversation, addMessage } from '../services/conversation';
import { useAuth } from '../context/AuthProvider';
import { Template, getTemplates } from '../services/template';

type ConversationStarterProps = {
  onSend?: (message: string) => void;
  placeholder?: string;
};

// Definiere die Ref-Methoden, die von außen aufgerufen werden können
export interface ConversationStarterRef {
  focus: () => void;
}

const ConversationStarter = forwardRef<ConversationStarterRef, ConversationStarterProps>(({ onSend, placeholder = 'Ask anything' }, ref) => {
  const [text, setText] = useState('');
  const [selectedModelId, setSelectedModelId] = useState('550e8400-e29b-41d4-a716-446655440000'); // Default to Azure OpenAI GPT-O3-Mini
  const [isCreatingConversation, setIsCreatingConversation] = useState(false);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const { colors } = useTheme();
  const { isDarkMode } = useAppTheme();
  const router = useRouter();
  const { user } = useAuth();
  const inputRef = useRef<TextInput>(null);
  
  // Expose methods via ref
  useImperativeHandle(ref, () => ({
    focus: () => {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }
  }));
  
  // Laden der Vorlagen beim ersten Rendern
  useEffect(() => {
    const loadTemplates = async () => {
      if (!user) return;
      
      setIsLoadingTemplates(true);
      try {
        const userTemplates = await getTemplates(user.id);
        setTemplates(userTemplates);
      } catch (error) {
        console.error('Fehler beim Laden der Vorlagen:', error);
      } finally {
        setIsLoadingTemplates(false);
      }
    };
    
    loadTemplates();
  }, [user]);

  const handleSend = async () => {
    if (text.trim()) {
      console.log("handleSend wird aufgerufen mit Text:", text.trim());

      // Prüfen ob onSend-Prop existiert, aber für jetzt ignorieren
      if (onSend && false) { // Deaktiviert: wir wollen immer unseren eigenen Code ausführen
        console.log("onSend-Prop gefunden, rufe diese auf");
        onSend(text.trim());
        setText('');
        return;
      }

      // Andernfalls starte eine neue Konversation
      try {
        setIsCreatingConversation(true);
        console.log("Starte Erstellung einer neuen Konversation...");
        
        // Verwende den Benutzer aus dem Auth-Kontext
        if (!user) {
          console.error('Kein Benutzer angemeldet');
          router.replace('/auth/login');
          return;
        }
        
        console.log(`Chat starten mit Modell-ID: ${selectedModelId}`);
        
        const trimmedText = text.trim();
        
        // WICHTIG: Setze Text zurück, bevor wir navigieren (UI-Block vermeiden)
        setText('');
        
        const mode = selectedTemplate ? 'template' : 'free';
        const templateId = selectedTemplate?.id;
        const modelToUse = selectedTemplate?.model_id || selectedModelId;
        
        // Versuche zwei verschiedene Methoden, damit eine davon funktioniert
        try {
          // 1. Methode: Mit Route-Parametern im Objekt
          console.log(`Methode 1: Mit Parametern im Objekt (${mode}, ${templateId || 'keine Vorlage'})`);
          router.push({
            pathname: '/conversation/new',
            params: {
              initialMessage: trimmedText,
              modelId: modelToUse,
              mode: mode,
              ...(templateId && { templateId })
            }
          });
        } catch (routerError) {
          console.error("Fehler bei Methode 1:", routerError);
          
          // 2. Methode: Mit Query-String
          console.log(`Methode 2: Mit Query-String`);
          let queryParams = `?initialMessage=${encodeURIComponent(
            trimmedText
          )}&modelId=${encodeURIComponent(
            modelToUse
          )}&mode=${encodeURIComponent(mode)}`;
          
          if (templateId) {
            queryParams += `&templateId=${encodeURIComponent(templateId)}`;
          }
          
          router.push(`/conversation/new${queryParams}`);
        }
        
        // Zurücksetzen der ausgewählten Vorlage nach Navigation
        setSelectedTemplate(null);
        
        console.log(`Navigation zur Konversation ausgeführt`);
      } catch (error) {
        console.error('Fehler beim Erstellen der Konversation:', error);
        alert(`Fehler: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`);
      } finally {
        setIsCreatingConversation(false);
      }
    } else {
      console.log("Text ist leer, keine Aktion");
    }
  };
  
  // Handler für das Auswählen einer Vorlage
  const handleTemplateSelect = (template: Template) => {
    // Wenn die Vorlage bereits ausgewählt ist, deaktivieren wir sie
    if (selectedTemplate?.id === template.id) {
      setSelectedTemplate(null);
      // Zurücksetzen des Texts, wenn es die Vorschau war
      if (text.startsWith('Frage: ')) {
        setText('');
      }
      return;
    }
    
    // Sonst wählen wir die Vorlage aus
    setSelectedTemplate(template);
    setSelectedModelId(template.model_id || selectedModelId);
    
    // Vorschau der initialen Frage im Eingabefeld anzeigen, wenn vorhanden
    if (text.trim() === '') {
      if (template.initial_question) {
        setText(`Frage: ${template.initial_question}`);
      }
    }
  };

  return (
    <View className="w-full px-4 max-w-3xl self-center">
      <View className={`rounded-lg p-4 ${isDarkMode ? 'bg-[#2C2C2E]' : 'bg-white'}`}>
        <View className="flex-row justify-between items-center mb-3">
          <Text className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Modell:</Text>
          <ModelDropdown 
            selectedModelId={selectedModelId} 
            onSelectModel={setSelectedModelId} 
          />
        </View>
        
        <TextInput
          ref={inputRef}
          className={`w-full min-h-[40px] text-base ${isDarkMode ? 'text-white' : 'text-black'}`}
          placeholder={placeholder}
          placeholderTextColor={isDarkMode ? '#8E8E93' : '#8E8E93'}
          value={text}
          onChangeText={setText}
          multiline
          maxLength={1000}
        />
        
        <View className="flex-row justify-between items-center mt-4">
          <View className="flex-row space-x-4">
            <TouchableOpacity className="flex-row items-center">
              <Ionicons name="attach" size={20} color={isDarkMode ? '#FFFFFF' : '#000000'} />
              <Text className={`ml-1 ${isDarkMode ? 'text-white' : 'text-black'}`}>Attach</Text>
            </TouchableOpacity>
            
            <TouchableOpacity className="flex-row items-center">
              <Ionicons name="search" size={20} color={isDarkMode ? '#FFFFFF' : '#000000'} />
              <Text className={`ml-1 ${isDarkMode ? 'text-white' : 'text-black'}`}>Search</Text>
            </TouchableOpacity>
          </View>
          
          <TouchableOpacity 
            className={`flex-row items-center px-3 py-2 rounded-full ${text.trim() ? 'bg-[#0A84FF]' : 'bg-[#0A84FF]/20'}`}
            onPress={() => {
              console.log("Senden-Button gedrückt");
              handleSend();
            }}
            disabled={!text.trim() || isCreatingConversation}
            activeOpacity={0.7}
          >
            {isCreatingConversation ? (
              <View className="flex-row items-center">
                <View className="h-4 w-4 mr-1">
                  <ActivityIndicator size="small" color="#FFFFFF" />
                </View>
                <Text className="text-white">Wird erstellt...</Text>
              </View>
            ) : (
              <>
                <Ionicons name="send" size={18} color={text.trim() ? '#FFFFFF' : '#0A84FF'} />
                <Text className={`ml-1 ${text.trim() ? 'text-white' : 'text-[#0A84FF]'}`}>Senden</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
      
      <View className="mt-4">
        <View>
          <Text className={`text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            Vorlagen:
          </Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false} 
            className="flex-row"
          >
            {isLoadingTemplates ? (
              <View className={`flex-row items-center justify-center mr-2 px-3 py-1 rounded-full border ${
                isDarkMode ? 'bg-[#2C2C2E] border-[#38383A]' : 'bg-white border-[#E5E5EA]'
              }`}>
                <ActivityIndicator size="small" color={isDarkMode ? '#FFFFFF' : '#0A84FF'} style={{marginRight: 6}} />
                <Text className={`text-sm ${isDarkMode ? 'text-white' : 'text-black'}`}>
                  Laden...
                </Text>
              </View>
            ) : templates.length > 0 ? (
              templates.map((template) => (
                <TouchableOpacity 
                  key={template.id} 
                  className={`flex-row items-center mr-2 px-3 py-1 rounded-full border ${
                    selectedTemplate?.id === template.id
                      ? isDarkMode 
                        ? 'bg-[#0A84FF]80 border-[#0A84FF]' 
                        : 'bg-[#0A84FF]40 border-[#0A84FF]'
                      : isDarkMode 
                        ? 'bg-[#2C2C2E] border-[#38383A]' 
                        : 'bg-white border-[#E5E5EA]'
                  }`}
                  onPress={() => handleTemplateSelect(template)}
                >
                  <View 
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: 5,
                      backgroundColor: template.color || '#0A84FF',
                      marginRight: 6
                    }}
                  />
                  <Text className={`text-sm ${
                    selectedTemplate?.id === template.id
                      ? isDarkMode ? 'text-white font-medium' : 'text-[#0A84FF] font-medium'
                      : isDarkMode ? 'text-white' : 'text-black'
                  }`}>
                    {template.name}
                  </Text>
                  {selectedTemplate?.id === template.id && (
                    <Ionicons 
                      name="checkmark-circle" 
                      size={14} 
                      color={isDarkMode ? '#FFFFFF' : '#0A84FF'} 
                      style={{marginLeft: 4}}
                    />
                  )}
                </TouchableOpacity>
              ))
            ) : (
              <TouchableOpacity 
                className={`flex-row items-center mr-2 px-3 py-1 rounded-full border ${
                  isDarkMode ? 'bg-[#2C2C2E] border-[#38383A]' : 'bg-white border-[#E5E5EA]'
                }`}
                onPress={() => router.push('/templates')}
              >
                <Ionicons 
                  name="add-circle-outline" 
                  size={16} 
                  color={isDarkMode ? '#FFFFFF' : '#000000'} 
                  style={styles.chipIcon} 
                />
                <Text className={`text-sm ${isDarkMode ? 'text-white' : 'text-black'}`}>
                  Vorlage erstellen
                </Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity 
              className={`flex-row items-center px-3 py-1 rounded-full border ${
                isDarkMode ? 'bg-[#2C2C2E] border-[#38383A]' : 'bg-white border-[#E5E5EA]'
              }`}
              onPress={() => router.push('/templates')}
            >
              <Ionicons 
                name="settings-outline" 
                size={16} 
                color={isDarkMode ? '#FFFFFF' : '#000000'} 
                style={styles.chipIcon} 
              />
              <Text className={`text-sm ${isDarkMode ? 'text-white' : 'text-black'}`}>
                Verwalten
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </View>
  );
});

// Styles für Elemente, die nicht mit NativeWind gestylt werden können
const styles = StyleSheet.create({
  chipIcon: {
    marginRight: 6,
  },
});

export default ConversationStarter;