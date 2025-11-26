import React, { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { View, ScrollView, ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Pressable } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '~/features/theme/ThemeProvider';
import { useRouter } from 'expo-router';
import colors from 'tailwindcss/colors';
import Text from '~/components/atoms/Text';
import Button from '~/components/atoms/Button';
import Input from '~/components/atoms/Input';
import { getAuthenticatedClient } from '~/features/auth/lib/supabaseClient';
import { authService } from '~/features/auth/services/authService';
import { useHeader } from '~/features/menus/HeaderContext';

// Typdefinitionen für Blueprint und Prompts
interface AdviceTip {
  id: string;
  content: {
    de: string;
    en: string;
  };
}

interface Prompt {
  id: string;
  title: {
    de: string;
    en: string;
  };
  prompt_text: {
    de: string;
    en: string;
  };
}

/**
 * Seite zum Erstellen eines neuen Blueprints mit Prompts
 * 
 * Ermöglicht die Erstellung eines neuen Blueprints mit mehrsprachigen Inhalten
 * und zugehörigen Prompts.
 */
export default function CreateBlueprintPage() {
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const { isDark, themeVariant } = useTheme();
  const { updateConfig } = useHeader();
  
  // Holen der Theme-Farben basierend auf der aktuellen Variante
  const themeColors = (colors as any).theme?.extend?.colors as Record<string, any>;
  
  // Rahmenfarbe basierend auf dem Theme
  const borderColor = isDark
    ? themeColors?.dark?.[themeVariant]?.border || '#424242'
    : themeColors?.[themeVariant]?.border || '#e6e6e6';
    
  // Konfiguriere den Header beim Laden der Komponente
  useEffect(() => {
    // Verwende eine lokale Funktion, um die Header-Konfiguration zu aktualisieren
    // und vermeide so, updateConfig als Abhängigkeit hinzuzufügen
    const configureHeader = () => {
      updateConfig({
        title: 'blueprints.create_new',
        showBackButton: true,
        showMenu: false,
      });
    };
    
    configureHeader();
    
    // Cleanup-Funktion, die beim Verlassen der Seite aufgerufen wird
    return () => {
      // ENTFERNT: updateConfig überschreibt andere Seiten-Titel
      // Die nächste Seite wird ihre eigene Header-Konfiguration setzen
    };
  }, []); // Leere Abhängigkeitsliste
  const [supabaseClient, setSupabaseClient] = useState<any>(null);
  
  // Initialisiere den Supabase-Client und hole den aktuellen Benutzer
  useEffect(() => {
    const initSupabase = async () => {
      try {
        // Authentifizierten Client verwenden statt direktem Zugriff
        const authenticatedClient = await getAuthenticatedClient();
        
        console.debug('Authentifizierter Supabase-Client erstellt');
        setSupabaseClient(authenticatedClient);
        
        // Hole den Benutzer aus dem Token für spätere Verwendung
        const userData = await authService.getUserFromToken();
        if (userData) {
          console.debug('Benutzer aus Token gefunden:', userData.id);
        } else {
          console.debug('Kein Benutzer im Token gefunden');
        }
      } catch (err) {
        console.debug('Fehler beim Initialisieren des Supabase-Clients:', err);
        setError(t('common.error_connection', 'Verbindungsfehler. Bitte versuche es später erneut.'));
      }
    };
    
    initSupabase();
  }, [t]);
  
  // Blueprint-Daten
  const [nameDE, setNameDE] = useState('Mein Test Blueprint');
  const [nameEN, setNameEN] = useState('My Test Blueprint');
  const [descriptionDE, setDescriptionDE] = useState('Dies ist ein Test-Blueprint mit automatisch ausgefüllten Daten zum Testen der Speicherfunktion.');
  const [descriptionEN, setDescriptionEN] = useState('This is a test blueprint with automatically filled data to test the save function.');
  const [isPublic, setIsPublic] = useState(true);
  
  // Advice-Tipps
  const [adviceTips, setAdviceTips] = useState<AdviceTip[]>([
    { id: 'tip1', content: { de: 'Erster Tipp: Achte auf die Details', en: 'First tip: Pay attention to details' } },
    { id: 'tip2', content: { de: 'Zweiter Tipp: Nimm dir Zeit', en: 'Second tip: Take your time' } },
    { id: 'tip3', content: { de: 'Dritter Tipp: Mache regelmäßige Pausen', en: 'Third tip: Take regular breaks' } },
    { id: 'tip4', content: { de: 'Vierter Tipp: Überprüfe deine Arbeit', en: 'Fourth tip: Review your work' } },
  ]);
  
  // Prompts
  const [prompts, setPrompts] = useState<Prompt[]>([
    { 
      id: 'prompt1', 
      title: { de: 'Erste Aufgabe', en: 'First Task' }, 
      prompt_text: { de: 'Beschreibe den ersten Schritt im Detail und erkläre, warum er wichtig ist.', en: 'Describe the first step in detail and explain why it is important.' }
    },
    { 
      id: 'prompt2', 
      title: { de: 'Zweite Aufgabe', en: 'Second Task' }, 
      prompt_text: { de: 'Analysiere die Ergebnisse und gib Feedback zu den wichtigsten Punkten.', en: 'Analyze the results and provide feedback on the most important points.' }
    }
  ]);
  
  // Status
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Keine separate handleGoBack-Funktion mehr nötig, da der globale Header den Zurück-Button bereitstellt
  
  // Verwende das Theme für die Hintergrundfarbe und Rahmenfarbe
  const containerStyle = {
    backgroundColor: isDark ? '#121212' : '#FFFFFF'
  };
  
  // Füge einen neuen Advice-Tipp hinzu
  const addAdviceTip = () => {
    const newTipId = `tip${adviceTips.length + 1}`;
    setAdviceTips([
      ...adviceTips,
      { id: newTipId, content: { de: '', en: '' } }
    ]);
  };

  // Aktualisiere einen Advice-Tipp
  const updateAdviceTip = (id: string, language: 'de' | 'en', value: string) => {
    const newAdviceTips = adviceTips.map(tip => {
      if (tip.id === id) {
        return {
          ...tip,
          content: {
            ...tip.content,
            [language]: value
          }
        };
      }
      return tip;
    });
    setAdviceTips(newAdviceTips);
  };

  // Entferne einen Advice-Tipp
  const removeAdviceTip = (id: string) => {
    setAdviceTips(adviceTips.filter(tip => tip.id !== id));
  };

  // Füge einen neuen Prompt hinzu
  const addPrompt = () => {
    const newPromptId = `prompt${prompts.length + 1}`;
    setPrompts([
      ...prompts,
      { 
        id: newPromptId, 
        title: { de: '', en: '' }, 
        prompt_text: { de: '', en: '' }
      }
    ]);
  };

  // Aktualisiere einen Prompt
  const updatePrompt = (id: string, field: 'title' | 'prompt_text', language: 'de' | 'en', value: string) => {
    const newPrompts = prompts.map(prompt => {
      if (prompt.id === id) {
        return {
          ...prompt,
          [field]: {
            ...prompt[field],
            [language]: value
          }
        };
      }
      return prompt;
    });
    setPrompts(newPrompts);
  };

  // Entferne einen Prompt
  const removePrompt = (id: string) => {
    setPrompts(prompts.filter(prompt => prompt.id !== id));
  };

  // Validiere die Eingaben
  const validateForm = () => {
    if (!nameDE && !nameEN) {
      setError(t('blueprints.error_name_required', 'Bitte gib einen Namen für den Blueprint ein.'));
      return false;
    }

    // Prüfe, ob mindestens ein Advice-Tipp ausgefüllt ist
    const hasAdviceTip = adviceTips.some(tip => 
      tip.content.de.trim() !== '' || tip.content.en.trim() !== ''
    );
    
    if (!hasAdviceTip) {
      setError(t('blueprints.error_advice_required', 'Bitte füge mindestens einen Advice-Tipp hinzu.'));
      return false;
    }

    // Prüfe, ob mindestens ein Prompt ausgefüllt ist
    const hasPrompt = prompts.some(prompt => 
      (prompt.title.de.trim() !== '' || prompt.title.en.trim() !== '') &&
      (prompt.prompt_text.de.trim() !== '' || prompt.prompt_text.en.trim() !== '')
    );
    
    if (!hasPrompt) {
      setError(t('blueprints.error_prompt_required', 'Bitte füge mindestens einen Prompt hinzu.'));
      return false;
    }

    return true;
  };

  // Speichere den Blueprint über eine API-Route
  const saveBlueprint = async () => {
     
    console.debug('🔍 saveBlueprint: Funktion gestartet');
     
    console.debug('🔍 saveBlueprint: Validiere Formular');
    
    if (!validateForm()) {
       
      console.debug('❌ saveBlueprint: Formularvalidierung fehlgeschlagen');
      return;
    }
    
     
    console.debug('✅ saveBlueprint: Formularvalidierung erfolgreich');
     
    console.debug('🔍 saveBlueprint: Prüfe Supabase-Client', { clientExists: !!supabaseClient });
    
    if (!supabaseClient) {
       
      console.debug('❌ saveBlueprint: Kein Supabase-Client vorhanden');
      setError(t('common.error_connection', 'Verbindungsfehler. Bitte versuche es später erneut.'));
      return;
    }

    try {
       
      console.debug('🔍 saveBlueprint: Starte Speichervorgang');
      setIsSubmitting(true);
      setError(null);

      // Hole den aktuellen Benutzer aus dem Token
       
      console.debug('🔍 saveBlueprint: Hole Benutzer aus Token');
      const userData = await authService.getUserFromToken();
      
      if (!userData) {
         
        console.debug('❌ saveBlueprint: Kein Benutzer im Token gefunden');
        setError(t('auth.not_authenticated', 'Du bist nicht angemeldet.'));
        return;
      }
      
       
      console.debug('✅ saveBlueprint: Benutzer gefunden', { userId: userData.id });
      
      // Verwende die Benutzer-ID aus dem Token
      const userId = userData.id;
      
      // Bereite die Advice-Tipps vor
      const validAdviceTips = adviceTips.filter(tip => 
        tip.content.de.trim() !== '' || tip.content.en.trim() !== ''
      );
      
      // Erstelle ein Array für die Tipps im Format der bestehenden Einträge
      const tipsArray = validAdviceTips.map((tip, index) => ({
        id: `tip${index + 1}`,
        order: index + 1,
        content: tip.content
      }));
      
      // Erstelle den Blueprint direkt in der Tabelle
       
      console.debug('🔍 saveBlueprint: Erstelle Blueprint in der Datenbank', {
        userId,
        nameDE,
        nameEN,
        descriptionDE: descriptionDE.substring(0, 20) + '...',
        descriptionEN: descriptionEN.substring(0, 20) + '...',
        isPublic,
        tipsCount: tipsArray.length
      });
      
      const { data: blueprint, error: blueprintError } = await supabaseClient
        .from('blueprints')
        .insert({
          user_id: userId,
          name: { de: nameDE, en: nameEN },
          description: { de: descriptionDE, en: descriptionEN },
          is_public: isPublic,
          // Füge die Advice-Struktur mit den Tipps hinzu
          advice: {
            metadata: {
              version: '1.0',
              lastUpdated: new Date().toISOString(),
              supportedLanguages: ['de', 'en']
            },
            sections: tipsArray
          }
        })
        .select('id')
        .single();

      if (blueprintError) {
         
        console.debug('❌ saveBlueprint: Fehler beim Erstellen des Blueprints:', blueprintError);
        setError(t('blueprints.error_create', 'Der Blueprint konnte nicht erstellt werden.'));
        return;
      }
      
       
      console.debug('✅ saveBlueprint: Blueprint erfolgreich erstellt', { blueprintId: blueprint?.id });

      // Die Advice-Tipps wurden bereits im Blueprint gespeichert

      // Speichere die Prompts
       
      console.debug('🔍 saveBlueprint: Filtere gültige Prompts');
      const validPrompts = prompts.filter(prompt => 
        (prompt.title.de.trim() !== '' || prompt.title.en.trim() !== '') &&
        (prompt.prompt_text.de.trim() !== '' || prompt.prompt_text.en.trim() !== '')
      );
      
       
      console.debug('🔍 saveBlueprint: Gültige Prompts gefunden', { count: validPrompts.length });

      // Erstelle alle Prompts zuerst
       
      console.debug('🔍 saveBlueprint: Beginne mit der Erstellung der Prompts');
      const createdPrompts = [];
      for (const prompt of validPrompts) {
        try {
          // Erstelle den Prompt
           
          console.debug('🔍 saveBlueprint: Erstelle Prompt', {
            titleDE: prompt.title.de.substring(0, 20) + '...',
            titleEN: prompt.title.en.substring(0, 20) + '...',
            promptTextDE: prompt.prompt_text.de.substring(0, 20) + '...',
            promptTextEN: prompt.prompt_text.en.substring(0, 20) + '...',
            isPublic
          });
          
          const { data: promptData, error: promptError } = await supabaseClient
            .from('prompts')
            .insert({
              // Verwende die korrekten Feldnamen entsprechend der Datenbankstruktur
              prompt_text: prompt.prompt_text,
              memory_title: prompt.title,  // Verwende memory_title statt title
              is_public: isPublic,
              user_id: userId, // Füge die Benutzer-ID hinzu
            })
            .select('id')
            .single();

          if (promptError) {
             
            console.debug('❌ saveBlueprint: Fehler beim Erstellen eines Prompts:', promptError);
            continue;
          }
          
           
          console.debug('✅ saveBlueprint: Prompt erfolgreich erstellt', { promptId: promptData?.id });

          if (promptData) {
            createdPrompts.push(promptData.id);
          }
        } catch (err) {
          console.debug('Unerwarteter Fehler beim Erstellen eines Prompts:', err);
        }
      }
      
      // Erstelle dann alle Verknüpfungen in einer einzigen Operation
      if (createdPrompts.length > 0) {
        try {
           
          console.debug('🔍 saveBlueprint: Erstelle Verknüpfungen zwischen Blueprint und Prompts', {
            blueprintId: blueprint.id,
            promptIds: createdPrompts
          });
          
          // Erstelle ein Array von Verknüpfungsobjekten
          const promptLinks = createdPrompts.map(promptId => {
             
            console.debug('🔍 saveBlueprint: Erstelle Verknüpfung für Prompt ID:', promptId);
            return {
              blueprint_id: blueprint.id,
              prompt_id: promptId
            };
          });
          
           
          console.debug('🔍 saveBlueprint: Verknüpfungsobjekte:', JSON.stringify(promptLinks));
          
          // Füge alle Verknüpfungen in einer einzigen Operation ein
           
          console.debug('🔍 saveBlueprint: Füge Verknüpfungen in die Datenbank ein');
          const { data: linkData, error: linkError } = await supabaseClient
            .from('prompt_blueprints')
            .insert(promptLinks)
            .select();

          if (linkError) {
             
            console.debug('❌ saveBlueprint: Fehler beim Verknüpfen der Prompts:', linkError);
          } else {
             
            console.debug('✅ saveBlueprint: Verknüpfungen erfolgreich erstellt', { count: linkData?.length });
          }
        } catch (err) {
           
          console.debug('❌ saveBlueprint: Unerwarteter Fehler beim Verknüpfen der Prompts:', err);
        }
      } else {
         
        console.debug('ℹ️ saveBlueprint: Keine Prompts zum Verknüpfen vorhanden.');
      }

      // Navigiere zur Homepage und wähle den neuen Blueprint direkt aus
      // Speichere die Blueprint-ID im AsyncStorage, damit sie beim Laden der Homepage verfügbar ist
      try {
         
        console.debug('🔍 saveBlueprint: Speichere Blueprint-ID im AsyncStorage', { blueprintId: blueprint.id });
        await AsyncStorage.setItem('selectedBlueprintId', blueprint.id);
        
        // Navigiere zur Homepage
         
        console.debug('🔍 saveBlueprint: Navigiere zur Homepage');
        router.push('/');
        
        // Informiere den Benutzer, dass der Blueprint erstellt wurde
        Alert.alert(
          t('blueprints.success_title', 'Blueprint erstellt'),
          t('blueprints.success_message', 'Dein Blueprint wurde erfolgreich erstellt und ausgewählt.')
        );
      } catch (error) {
         
        console.debug('❌ saveBlueprint: Fehler beim Speichern der Blueprint-ID:', error);
        
        // Navigiere trotzdem zur Homepage
         
        console.debug('🔍 saveBlueprint: Navigiere trotzdem zur Homepage');
        router.push('/');
      }

    } catch (err) {
       
      console.debug('❌ saveBlueprint: Unerwarteter Fehler:', err);
      setError(t('common.error_unexpected', 'Ein unerwarteter Fehler ist aufgetreten.'));
    } finally {
       
      console.debug('🔍 saveBlueprint: Funktion abgeschlossen, setze isSubmitting auf false');
      setIsSubmitting(false);
    }
  };

  // Zeige Ladeindikator, wenn der Supabase-Client noch nicht initialisiert ist
  if (!supabaseClient && !error) {
    return (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" color="#4FC3F7" />
        <Text className="mt-4 text-base">{t('common.loading', 'Wird geladen...')}</Text>
      </View>
    );
  }
  
  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1, width: '100%' }}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
    >
      <View className="flex-1 relative" style={containerStyle}>
        <ScrollView className="flex-1 p-4 pb-24">
          {error && (
            <View className="bg-red-100/10 p-3 rounded-lg mb-4">
              <Text className="text-red-500 text-center">{error}</Text>
            </View>
          )}
          
          {/* Blueprint-Grunddaten */}
          <View className="mb-8 w-full">
            <Text className="text-lg font-bold mb-4">
              {t('blueprints.basic_info', 'Grundinformationen')}
            </Text>
            
            <View className="mb-4">
              <Text className="text-sm mb-2">{t('blueprints.name_de', 'Name (Deutsch)')}</Text>
              <Input
                value={nameDE}
                onChangeText={setNameDE}
                placeholder={t('blueprints.name_placeholder_de', 'z.B. Textanalyse')}
              />
            </View>
            
            <View className="mb-4">
              <Text className="text-sm mb-2">{t('blueprints.name_en', 'Name (Englisch)')}</Text>
              <Input
                value={nameEN}
                onChangeText={setNameEN}
                placeholder={t('blueprints.name_placeholder_en', 'z.B. Text Analysis')}
              />
            </View>
            
            <View className="mb-4">
              <Text className="text-sm mb-2">{t('blueprints.description_de', 'Beschreibung (Deutsch)')}</Text>
              <Input
                value={descriptionDE}
                onChangeText={setDescriptionDE}
                placeholder={t('blueprints.description_placeholder_de', 'Beschreibe den Zweck dieses Blueprints...')}
                textArea
                numberOfLines={4}
              />
            </View>
            
            <View className="mb-4">
              <Text className="text-sm mb-2">{t('blueprints.description_en', 'Beschreibung (Englisch)')}</Text>
              <Input
                value={descriptionEN}
                onChangeText={setDescriptionEN}
                placeholder={t('blueprints.description_placeholder_en', 'Describe the purpose of this blueprint...')}
                textArea
                numberOfLines={4}
              />
            </View>
          </View>
          
          {/* Advice-Tipps */}
          <View className="mb-8 w-full">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-lg font-bold mb-4">
                {t('blueprints.advice_tips', 'Advice-Tipps')}
              </Text>
              <Button
                onPress={addAdviceTip}
                title={t('common.add', 'Hinzufügen')}
                variant="secondary"
                iconName="add"
              />
            </View>
            
            {adviceTips.map((tip, index) => (
              <View key={tip.id} className="mb-4 p-3 border rounded-lg" style={{ borderColor }}>
                <View className="flex-row justify-between items-center mb-3">
                  <Text className="text-base font-bold">
                    {t('blueprints.tip_number', 'Tipp {{number}}', { number: index + 1 })}
                  </Text>
                </View>
                
                <View className="mb-4">
                  <Text className="text-sm mb-2">{t('blueprints.tip_content_de', 'Inhalt (Deutsch)')}</Text>
                  <Input
                    value={tip.content.de}
                    onChangeText={(text) => updateAdviceTip(tip.id, 'de', text)}
                    placeholder={t('blueprints.tip_placeholder_de', 'Gib einen hilfreichen Tipp ein...')}
                    textArea
                    numberOfLines={3}
                  />
                </View>
                
                <View className="mb-4">
                  <Text className="text-sm mb-2">{t('blueprints.tip_content_en', 'Inhalt (Englisch)')}</Text>
                  <Input
                    value={tip.content.en}
                    onChangeText={(text) => updateAdviceTip(tip.id, 'en', text)}
                    placeholder={t('blueprints.tip_placeholder_en', 'Enter a helpful tip...')}
                    textArea
                    numberOfLines={3}
                  />
                </View>
              </View>
            ))}
          </View>
          
          {/* Prompts */}
          <View className="mb-8 w-full">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-lg font-bold mb-4">
                {t('blueprints.prompts', 'Prompts')}
              </Text>
              <Button
                onPress={addPrompt}
                title={t('common.add', 'Hinzufügen')}
                variant="secondary"
                iconName="add"
              />
            </View>
            
            {prompts.map((prompt, index) => (
              <View key={prompt.id} className="mb-4 p-3 border rounded-lg" style={{ borderColor }}>
                <View className="flex-row justify-between items-center mb-3">
                  <Text className="text-base font-bold">
                    {t('blueprints.prompt_number', 'Prompt {{number}}', { number: index + 1 })}
                  </Text>
                </View>
                
                <View className="mb-4">
                  <Text className="text-sm mb-2">{t('blueprints.prompt_title_de', 'Titel (Deutsch)')}</Text>
                  <Input
                    value={prompt.title.de}
                    onChangeText={(text) => updatePrompt(prompt.id, 'title', 'de', text)}
                    placeholder={t('blueprints.prompt_title_placeholder_de', 'z.B. Zusammenfassung')}
                  />
                </View>
                
                <View className="mb-4">
                  <Text className="text-sm mb-2">{t('blueprints.prompt_title_en', 'Titel (Englisch)')}</Text>
                  <Input
                    value={prompt.title.en}
                    onChangeText={(text) => updatePrompt(prompt.id, 'title', 'en', text)}
                    placeholder={t('blueprints.prompt_title_placeholder_en', 'z.B. Summary')}
                  />
                </View>
                
                <View className="mb-4">
                  <Text className="text-sm mb-2">{t('blueprints.prompt_text_de', 'Prompt-Text (Deutsch)')}</Text>
                  <Input
                    value={prompt.prompt_text.de}
                    onChangeText={(text) => updatePrompt(prompt.id, 'prompt_text', 'de', text)}
                    placeholder={t('blueprints.prompt_text_placeholder_de', 'z.B. Fasse den folgenden Text ausführlich zusammen')}
                    textArea
                    numberOfLines={3}
                  />
                </View>
                
                <View className="mb-4">
                  <Text className="text-sm mb-2">{t('blueprints.prompt_text_en', 'Prompt-Text (Englisch)')}</Text>
                  <Input
                    value={prompt.prompt_text.en}
                    onChangeText={(text) => updatePrompt(prompt.id, 'prompt_text', 'en', text)}
                    placeholder={t('blueprints.prompt_text_placeholder_en', 'z.B. Summarize the following text in detail')}
                    textArea
                    numberOfLines={3}
                  />
                </View>
              </View>
            ))}
          </View>
          
          {/* Speichern-Button */}
          <View className="mt-6 mb-24 items-center w-full" style={{ zIndex: 999 }}>
            {isSubmitting ? (
              <ActivityIndicator size="large" color="#4FC3F7" />
            ) : (
              <Pressable 
                onPress={() => {
                   
                  console.debug('👉 BUTTON CLICK: Speichern-Button wurde geklickt');
                  saveBlueprint();
                }}
                className="bg-blue-500 py-3 px-6 rounded-xl active:bg-blue-700 w-full max-w-[200px]"
                style={{
                  elevation: 5,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.25,
                  shadowRadius: 3.84,
                }}
              >
                <Text className="text-white text-center font-bold text-lg">
                  {t('common.save', 'Speichern')}
                </Text>
              </Pressable>
            )}
          </View>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

// NativeWind styles are used directly in the className props
