import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Stack, router, useFocusEffect } from 'expo-router';
import { useTexts } from '~/hooks/useTexts';
import { Header } from '~/components/Header';
import { useTheme } from '~/hooks/useTheme';
import { useStore } from '~/store/store';
import { Dropdown } from '~/components/dropdown';
import { GERMAN_VOICES, QUALITY_LABELS, PROVIDER_LABELS, getVoiceById } from '~/constants/voices';
import { urlExtractorService } from '~/services/urlExtractorService';

export default function AddTextScreen() {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { createText, refetch } = useTexts();
  const { colors } = useTheme();
  const { settings } = useStore();
  const [selectedVoice, setSelectedVoice] = useState(settings.voice || 'de-DE-Neural2-A');
  const [inputMode, setInputMode] = useState<'text' | 'url'>('text');
  const [url, setUrl] = useState('');
  const [extracting, setExtracting] = useState(false);

  const handleExtractUrl = async () => {
    if (!url.trim()) {
      setError('Bitte gib eine URL ein');
      return;
    }

    setExtracting(true);
    setError(null);

    const { data, error: extractError } = await urlExtractorService.extractFromUrl(url);

    setExtracting(false);

    if (extractError) {
      setError(extractError.message);
      return;
    }

    if (data) {
      setTitle(data.title);
      setContent(urlExtractorService.formatExtractedContent(data));
      if (data.tags.length > 0) {
        setTags(data.tags.join(', '));
      }
    }
  };

  const handleSave = async () => {
    if (!title.trim()) {
      setError('Bitte gib einen Titel ein');
      return;
    }

    if (!content.trim()) {
      setError('Bitte gib einen Text ein');
      return;
    }

    setLoading(true);
    setError(null);

    const tagsArray = tags
      .split(',')
      .map((tag) => tag.trim())
      .filter((tag) => tag.length > 0);

    try {
      const { data, error } = await createText(title.trim(), content.trim(), {
        tags: tagsArray,
        tts: { speed: settings.speed || 1.0, voice: selectedVoice },
        source: inputMode === 'url' ? url : undefined,
      });

      if (error) {
        console.error('Error creating text:', error);
        setError(error);
        setLoading(false);
      } else {
        console.log('Text created successfully:', data);
        // Navigate back immediately - the list will refresh via useFocusEffect
        router.back();
      }
    } catch (err) {
      console.error('Unexpected error:', err);
      setError(err instanceof Error ? err.message : 'Unerwarteter Fehler');
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className={`flex-1 ${colors.background}`}>
      <Stack.Screen options={{ headerShown: false }} />
      <Header
        title="Neuer Text"
        rightComponent={
          <Pressable onPress={handleSave} disabled={loading}>
            {loading ? (
              <ActivityIndicator size="small" color="#3B82F6" />
            ) : (
              <Text className="font-semibold text-blue-600">Speichern</Text>
            )}
          </Pressable>
        }
      />

      <ScrollView className="flex-1 p-4">
        {error && (
          <View className={`mb-4 rounded-lg border border-red-200 ${colors.errorLight} p-3`}>
            <Text className="text-red-700">{error}</Text>
          </View>
        )}

        <View className="mb-4">
          <Text className={`mb-2 text-sm font-medium ${colors.text}`}>Titel</Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="Titel des Textes"
            className={`rounded-lg border ${colors.border} ${colors.surface} px-3 py-3 text-base ${colors.text}`}
            autoFocus
          />
        </View>

        <View className="mb-4">
          <Text className={`mb-2 text-sm font-medium ${colors.text}`}>
            Tags (durch Komma getrennt)
          </Text>
          <TextInput
            value={tags}
            onChangeText={setTags}
            placeholder="z.B. Roman, Favorit, Entspannung"
            className={`rounded-lg border ${colors.border} ${colors.surface} px-3 py-3 text-base ${colors.text}`}
          />
        </View>

        <View className="mb-4">
          <Text className={`mb-2 text-sm font-medium ${colors.text}`}>Stimme</Text>
          <Dropdown
            value={selectedVoice}
            onValueChange={setSelectedVoice}
            placeholder="Stimme wählen"
            title="Stimme auswählen"
            groups={Object.entries(
              GERMAN_VOICES.reduce(
                (groups, voice) => {
                  const provider = voice.provider;
                  if (!groups[provider]) {
                    groups[provider] = {};
                  }
                  const quality = voice.quality;
                  if (!groups[provider][quality]) {
                    groups[provider][quality] = [];
                  }
                  groups[provider][quality].push(voice);
                  return groups;
                },
                {} as Record<string, Record<string, typeof GERMAN_VOICES>>
              )
            ).map(([provider, qualityGroups]) => ({
              title: PROVIDER_LABELS[provider as keyof typeof PROVIDER_LABELS],
              options: Object.entries(qualityGroups).flatMap(([quality, voices]) =>
                voices.map((voice) => ({
                  label: `${QUALITY_LABELS[quality as keyof typeof QUALITY_LABELS]} - ${voice.label}`,
                  value: voice.value,
                }))
              ),
            }))}
          />
        </View>

        <View className="mb-4">
          <View className="mb-2 flex-row">
            <Pressable
              onPress={() => setInputMode('text')}
              className={`mr-2 rounded-lg px-4 py-2 ${inputMode === 'text' ? colors.primary : colors.surface}`}>
              <Text className={inputMode === 'text' ? 'font-medium text-white' : `${colors.text}`}>
                Text
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setInputMode('url')}
              className={`rounded-lg px-4 py-2 ${inputMode === 'url' ? colors.primary : colors.surface}`}>
              <Text className={inputMode === 'url' ? 'font-medium text-white' : `${colors.text}`}>
                URL
              </Text>
            </Pressable>
          </View>

          {inputMode === 'text' ? (
            <TextInput
              value={content}
              onChangeText={setContent}
              placeholder="Füge hier deinen Text ein..."
              multiline
              textAlignVertical="top"
              className={`min-h-[200px] rounded-lg border ${colors.border} ${colors.surface} px-3 py-3 text-base ${colors.text}`}
            />
          ) : (
            <View>
              <TextInput
                value={url}
                onChangeText={setUrl}
                placeholder="https://example.com/artikel"
                autoCapitalize="none"
                autoCorrect={false}
                className={`rounded-lg border ${colors.border} ${colors.surface} px-3 py-3 text-base ${colors.text} mb-2`}
              />
              <Pressable
                onPress={handleExtractUrl}
                disabled={extracting || !url.trim()}
                className={`mb-2 rounded-lg px-4 py-3 ${
                  extracting || !url.trim() ? 'bg-gray-300' : colors.primary
                }`}>
                {extracting ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text className="text-center font-medium text-white">Text extrahieren</Text>
                )}
              </Pressable>
              {content && (
                <TextInput
                  value={content}
                  onChangeText={setContent}
                  placeholder="Extrahierter Text..."
                  multiline
                  textAlignVertical="top"
                  className={`min-h-[150px] rounded-lg border ${colors.border} ${colors.surface} px-3 py-3 text-base ${colors.text}`}
                />
              )}
            </View>
          )}
        </View>

        <View className={`mb-4 rounded-lg ${colors.surfaceSecondary} p-3`}>
          <Text className={`text-sm ${colors.textSecondary}`}>
            💡 Tipp: Du kannst später Audio für diesen Text generieren und offline anhören.
          </Text>
        </View>

        <Pressable
          onPress={handleSave}
          disabled={loading}
          className={`mb-4 rounded-lg px-4 py-3 ${loading ? 'bg-gray-400' : colors.primary}`}>
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-center text-base font-semibold text-white">Speichern</Text>
          )}
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
