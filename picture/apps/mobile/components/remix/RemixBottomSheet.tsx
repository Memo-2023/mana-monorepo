import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  Image,
  Pressable,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  Alert,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Slider } from '~/components/ui/Slider';
import { useAuth } from '~/contexts/AuthContext';
import { supabase } from '~/utils/supabase';
import { useModelSelection } from '~/store/modelStore';
import { generateImage } from '~/services/imageGeneration';
import { useTheme } from '~/contexts/ThemeContext';

const { width: screenWidth } = Dimensions.get('window');

type RemixBottomSheetProps = {
  imageUrl: string;
  imageId: string;
  originalPrompt: string;
  onSuccess?: (newImageId: string) => void;
  isOpen: boolean;
  onClose: () => void;
};

export function RemixBottomSheet({
  imageUrl,
  imageId,
  originalPrompt,
  onSuccess,
  isOpen,
  onClose,
}: RemixBottomSheetProps) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  const [prompt, setPrompt] = useState(originalPrompt);
  const [strength, setStrength] = useState(0.75);
  const [isGenerating, setIsGenerating] = useState(false);
  
  const {
    models,
    selectedModel,
    loadingModels,
    hasModels,
    setSelectedModel,
    loadModels,
  } = useModelSelection();

  // Separate img2img and text2img models
  const img2imgModels = models.filter(m => m.supports_img2img);
  const text2imgModels = models.filter(m => !m.supports_img2img);

  useEffect(() => {
    if (isOpen) {
      setPrompt(originalPrompt);
    }
  }, [isOpen, originalPrompt]);

  useEffect(() => {
    // Models are preloaded at app start, only load if error occurred
    if (models.length === 0 && !loadingModels) {
      loadModels();
    }
    // Select first model if none selected - prefer img2img
    if (models.length > 0 && !selectedModel) {
      if (img2imgModels.length > 0) {
        setSelectedModel(img2imgModels[0]);
      } else if (text2imgModels.length > 0) {
        setSelectedModel(text2imgModels[0]);
      }
    }
  }, [models, loadingModels]);

  const handleRemix = async () => {
    if (!prompt.trim() || !selectedModel || !user) {
      Alert.alert('Fehler', 'Bitte fülle alle Felder aus');
      return;
    }

    setIsGenerating(true);

    try {
      // Create generation record with source image
      const { data: generation, error: genError } = await supabase
        .from('image_generations')
        .insert({
          user_id: user.id,
          prompt: prompt.trim(),
          model: selectedModel.name,
          width: 1024,
          height: 1024,
          steps: selectedModel.default_steps,
          guidance_scale: selectedModel.default_guidance_scale,
          source_image_url: imageUrl,
          generation_strength: strength,
          status: 'pending'
        })
        .select()
        .single();

      if (genError) throw genError;

      // Get session for auth
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No active session');

      // Call edge function with optional img2img parameters
      const requestBody: any = {
        prompt: prompt.trim(),
        model_id: selectedModel.replicate_id,
        model_version: selectedModel.version,
        width: 1024,
        height: 1024,
        num_inference_steps: selectedModel.default_steps,
        guidance_scale: selectedModel.default_guidance_scale,
        generation_id: generation.id,
      };

      // Add img2img parameters only if model supports it
      if (selectedModel.supports_img2img) {
        requestBody.source_image_url = imageUrl;
        requestBody.strength = strength;
      }

      const { data, error } = await supabase.functions.invoke('generate-image', {
        body: requestBody,
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        }
      });

      if (error) throw error;

      Alert.alert(
        'Erfolgreich!', 
        `Remix wurde in ${data.generation_time} Sekunden generiert.`,
        [
          { 
            text: 'Anzeigen', 
            onPress: () => {
              onSuccess?.(data.image.id);
              onClose();
            }
          },
          { text: 'OK', onPress: onClose }
        ]
      );

    } catch (error: any) {
      console.error('Remix error:', error);
      Alert.alert(
        'Fehler', 
        error.message || 'Remix konnte nicht erstellt werden'
      );
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Modal
      visible={isOpen}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
      presentationStyle="overFullScreen"
    >
      <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' }}>
        <Pressable
          style={{ flex: 1 }}
          onPress={onClose}
        />

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ maxHeight: '85%' }}
        >
          <View style={{
            backgroundColor: theme.colors.surface,
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
          }}>
            {/* Handle Bar */}
            <View style={{ padding: 8, alignItems: 'center' }}>
              <View style={{
                width: 48,
                height: 4,
                backgroundColor: theme.colors.border,
                borderRadius: 2
              }} />
            </View>

            <ScrollView
              contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <View style={{ padding: 16 }}>
                  {/* Header */}
                  <View className="flex-row justify-between items-center mb-4">
                    <Text style={{ fontSize: 20, fontWeight: 'bold', color: theme.colors.text.primary }}>Remix erstellen</Text>
                    <Pressable onPress={onClose}>
                      <Ionicons name="close" size={24} color={theme.colors.text.tertiary} />
                    </Pressable>
                  </View>

                  {/* Source Image Preview */}
                  <View className="mb-4">
                    <Text style={{ fontSize: 14, fontWeight: '500', color: theme.colors.text.secondary, marginBottom: 8 }}>Original Bild</Text>
                    <Image
                      source={{ uri: imageUrl }}
                      className="w-full h-48 rounded-lg"
                      style={{ backgroundColor: theme.colors.input }}
                      resizeMode="cover"
                    />
                  </View>

                  {/* Prompt Input */}
                  <View className="mb-4">
                    <Text style={{ fontSize: 14, fontWeight: '500', color: theme.colors.text.secondary, marginBottom: 8 }}>
                      Neuer Prompt
                    </Text>
                    <TextInput
                      style={{
                        backgroundColor: theme.colors.input,
                        borderWidth: 1,
                        borderColor: theme.colors.border,
                        borderRadius: 8,
                        paddingHorizontal: 16,
                        paddingVertical: 12,
                        color: theme.colors.text.primary
                      }}
                      placeholder="Beschreibe die gewünschten Änderungen..."
                      placeholderTextColor={theme.colors.text.tertiary}
                      value={prompt}
                      onChangeText={setPrompt}
                      multiline
                      numberOfLines={3}
                      textAlignVertical="top"
                    />
                  </View>

                  {/* Strength Slider - Only for img2img models */}
                  {selectedModel?.supports_img2img && (
                    <View className="mb-4">
                      <View className="flex-row justify-between items-center mb-2">
                        <Text style={{ fontSize: 14, fontWeight: '500', color: theme.colors.text.secondary }}>
                          Änderungsstärke
                        </Text>
                        <Text style={{ fontSize: 14, color: theme.colors.text.tertiary }}>
                          {Math.round(strength * 100)}%
                        </Text>
                      </View>
                      <Slider
                        minimumValue={0.3}
                        maximumValue={0.95}
                        value={strength}
                        onValueChange={setStrength}
                        minimumTrackTintColor={theme.colors.primary.default}
                        maximumTrackTintColor={theme.colors.input}
                        thumbTintColor={theme.colors.primary.default}
                        style={{ height: 40 }}
                      />
                      <View className="flex-row justify-between mt-1">
                        <Text style={{ fontSize: 12, color: theme.colors.text.tertiary }}>Minimal</Text>
                        <Text style={{ fontSize: 12, color: theme.colors.text.tertiary }}>Maximal</Text>
                      </View>
                    </View>
                  )}

                  {/* Model Selection */}
                  <View className="mb-6">
                    <Text style={{ fontSize: 14, fontWeight: '500', color: theme.colors.text.secondary, marginBottom: 8 }}>Modell</Text>
                    {loadingModels ? (
                      <View style={{ paddingVertical: 12, backgroundColor: theme.colors.surface, borderRadius: 8 }}>
                        <ActivityIndicator size="small" color={theme.colors.primary.default} />
                      </View>
                    ) : models.length > 0 ? (
                      <View>
                        {/* Image-to-Image Models */}
                        {img2imgModels.length > 0 && (
                          <View style={{ marginBottom: 12 }}>
                            <Text style={{ fontSize: 12, fontWeight: '500', color: theme.colors.text.tertiary, marginBottom: 6 }}>
                              Image-to-Image (mit Referenzbild)
                            </Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                              {img2imgModels.map((model) => (
                                <Pressable
                                  key={model.id}
                                  onPress={() => setSelectedModel(model)}
                                  className="mr-2 px-4 py-2 rounded-lg border"
                                  style={{
                                    backgroundColor: selectedModel?.id === model.id ? theme.colors.primary.default : theme.colors.surface,
                                    borderColor: selectedModel?.id === model.id ? theme.colors.primary.default : theme.colors.border
                                  }}
                                >
                                  <Text style={{ color: selectedModel?.id === model.id ? '#FFFFFF' : theme.colors.text.secondary, fontWeight: selectedModel?.id === model.id ? '500' : 'normal' }}>
                                    {model.display_name}
                                  </Text>
                                  <Text style={{ fontSize: 12, color: selectedModel?.id === model.id ? '#FFFFFF' : theme.colors.text.tertiary }}>
                                    ~{model.estimated_time_seconds}s
                                  </Text>
                                </Pressable>
                              ))}
                            </ScrollView>
                          </View>
                        )}

                        {/* Text-to-Image Models */}
                        {text2imgModels.length > 0 && (
                          <View>
                            <Text style={{ fontSize: 12, fontWeight: '500', color: theme.colors.text.tertiary, marginBottom: 6 }}>
                              Text-to-Image (ohne Referenzbild)
                            </Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                              {text2imgModels.map((model) => (
                                <Pressable
                                  key={model.id}
                                  onPress={() => setSelectedModel(model)}
                                  className="mr-2 px-4 py-2 rounded-lg border"
                                  style={{
                                    backgroundColor: selectedModel?.id === model.id ? theme.colors.primary.default : theme.colors.surface,
                                    borderColor: selectedModel?.id === model.id ? theme.colors.primary.default : theme.colors.border
                                  }}
                                >
                                  <Text style={{ color: selectedModel?.id === model.id ? '#FFFFFF' : theme.colors.text.secondary, fontWeight: selectedModel?.id === model.id ? '500' : 'normal' }}>
                                    {model.display_name}
                                  </Text>
                                  <Text style={{ fontSize: 12, color: selectedModel?.id === model.id ? '#FFFFFF' : theme.colors.text.tertiary }}>
                                    ~{model.estimated_time_seconds}s
                                  </Text>
                                </Pressable>
                              ))}
                            </ScrollView>
                          </View>
                        )}
                      </View>
                    ) : (
                      <Text style={{ textAlign: 'center', color: theme.colors.text.tertiary, paddingVertical: 12 }}>
                        Keine Modelle verfügbar
                      </Text>
                    )}
                  </View>

                  {/* Generate Button */}
                  <Pressable
                    onPress={handleRemix}
                    disabled={!prompt.trim() || isGenerating || !selectedModel}
                    className="py-3 rounded-lg"
                    style={{
                      backgroundColor: !prompt.trim() || isGenerating || !selectedModel
                        ? theme.colors.input
                        : theme.colors.primary.default
                    }}
                  >
                    {isGenerating ? (
                      <View className="flex-row justify-center items-center">
                        <ActivityIndicator size="small" color="white" />
                        <Text style={{ marginLeft: 8, color: '#FFFFFF', fontWeight: '500' }}>Generiere Remix...</Text>
                      </View>
                    ) : (
                      <Text style={{ textAlign: 'center', color: '#FFFFFF', fontWeight: '500' }}>
                        Remix generieren
                      </Text>
                    )}
                  </Pressable>
                </View>
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    );
  }