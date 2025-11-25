import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import { createConversation, sendMessageAndGetResponse } from '../../../services/conversation';
import { useAuth } from '../../../context/AuthProvider';
import { Alert } from 'react-native';

// Typendefinition für Parameter
interface ConversationNewParams {
  initialMessage?: string;
  modelId?: string;
  templateId?: string;
  mode?: 'free' | 'guided' | 'template';
  documentMode?: string; // String, da Query-Parameter immer Strings sind
  spaceId?: string; // ID des Space, falls vorhanden
}

export default function NewConversation() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useLocalSearchParams<ConversationNewParams>();
  const [isFetching, setIsFetching] = useState(true);

  // Extrahiere die Parameter
  const initialMessage = params?.initialMessage || '';
  const modelId = params?.modelId || '550e8400-e29b-41d4-a716-446655440000'; // Default zu GPT-4o-mini
  const templateId = params?.templateId;
  const mode = (params?.mode || 'free') as 'free' | 'guided' | 'template';
  const documentMode = params?.documentMode === 'true';
  const spaceId = params?.spaceId;
  
  console.log('Erhaltene Parameter:', {
    initialMessage: initialMessage.substring(0, 50),
    modelId,
    templateId,
    mode,
    documentMode,
    spaceId: spaceId || 'nicht angegeben'
  });
  
  // Log für Debug-Zwecke
  console.log("⭐️ Neue Konversation wird erstellt mit Space ID:", spaceId || "keine");

  useEffect(() => {
    if (!user) {
      console.error('Kein Benutzer gefunden');
      router.replace('/auth/login');
      return;
    }

    if (!initialMessage) {
      console.warn('Keine Nachricht gefunden');
      router.replace('/');
      return;
    }

    const startConversation = async () => {
      try {
        setIsFetching(true);
        console.log('Erstelle Konversation...');
        
        // 1. Erstelle eine neue Konversation
        const conversationId = await createConversation(
          user.id,
          modelId,
          mode,
          templateId,
          documentMode,
          spaceId
        );

        if (!conversationId) {
          throw new Error('Fehler beim Erstellen der Konversation');
        }

        console.log('Konversation erstellt mit ID:', conversationId);
        
        // 2. Sende die initiale Nachricht
        const response = await sendMessageAndGetResponse(
          conversationId,
          initialMessage,
          modelId,
          templateId,
          documentMode
        );

        console.log('Antwort erhalten');
        
        // 3. Navigiere zur Konversation
        router.replace(`/conversation/${conversationId}`);
      } catch (error) {
        console.error('Fehler beim Starten der Konversation:', error);
        Alert.alert(
          'Fehler',
          'Die Konversation konnte nicht gestartet werden.',
          [
            {
              text: 'OK',
              onPress: () => router.replace('/')
            }
          ]
        );
      } finally {
        setIsFetching(false);
      }
    };

    startConversation();
  }, [user, initialMessage, modelId, templateId, mode, documentMode, spaceId, router]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#0000ff" />
      <Text style={styles.text}>Starte Konversation...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    marginTop: 20,
    fontSize: 16,
  }
});