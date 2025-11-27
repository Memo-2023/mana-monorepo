import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  ScrollView,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { api } from '@/services/api';
import { useJobStore } from '@/stores/jobs';

export default function TranscribeScreen() {
  const [url, setUrl] = useState('');
  const [language, setLanguage] = useState('de');
  const [provider, setProvider] = useState<'openai' | 'local'>('openai');
  const [loading, setLoading] = useState(false);

  const addJob = useJobStore((state) => state.addJob);

  const languages = [
    { code: 'de', name: 'German' },
    { code: 'en', name: 'English' },
    { code: 'es', name: 'Spanish' },
    { code: 'fr', name: 'French' },
  ];

  const handleSubmit = async () => {
    if (!url.trim()) {
      Alert.alert('Error', 'Please enter a YouTube URL');
      return;
    }

    setLoading(true);
    try {
      const job = await api.createJob({ url, language, provider });
      addJob(job);
      setUrl('');
      Alert.alert('Success', 'Transcription job started!', [
        { text: 'OK', onPress: () => router.push('/(tabs)/') },
      ]);
    } catch (error) {
      Alert.alert(
        'Error',
        error instanceof Error ? error.message : 'Failed to start transcription'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.form}>
        <View style={styles.field}>
          <Text style={styles.label}>YouTube URL</Text>
          <TextInput
            style={styles.input}
            value={url}
            onChangeText={setUrl}
            placeholder="https://www.youtube.com/watch?v=..."
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Language</Text>
          <View style={styles.optionsRow}>
            {languages.map((lang) => (
              <Pressable
                key={lang.code}
                style={[
                  styles.option,
                  language === lang.code && styles.optionSelected,
                ]}
                onPress={() => setLanguage(lang.code)}
              >
                <Text
                  style={[
                    styles.optionText,
                    language === lang.code && styles.optionTextSelected,
                  ]}
                >
                  {lang.name}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Provider</Text>
          <View style={styles.optionsRow}>
            <Pressable
              style={[
                styles.option,
                provider === 'openai' && styles.optionSelected,
              ]}
              onPress={() => setProvider('openai')}
            >
              <Text
                style={[
                  styles.optionText,
                  provider === 'openai' && styles.optionTextSelected,
                ]}
              >
                OpenAI
              </Text>
            </Pressable>
            <Pressable
              style={[
                styles.option,
                provider === 'local' && styles.optionSelected,
              ]}
              onPress={() => setProvider('local')}
            >
              <Text
                style={[
                  styles.optionText,
                  provider === 'local' && styles.optionTextSelected,
                ]}
              >
                Local
              </Text>
            </Pressable>
          </View>
          <Text style={styles.hint}>
            {provider === 'openai'
              ? 'Fast, cloud-based transcription'
              : 'Free, requires local Whisper'}
          </Text>
        </View>

        <Pressable
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? 'Starting...' : 'Start Transcription'}
          </Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  form: {
    padding: 16,
  },
  field: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
  },
  optionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  option: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
  },
  optionSelected: {
    backgroundColor: '#9333ea',
    borderColor: '#9333ea',
  },
  optionText: {
    fontSize: 14,
    color: '#374151',
  },
  optionTextSelected: {
    color: '#fff',
    fontWeight: '600',
  },
  hint: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 8,
  },
  button: {
    backgroundColor: '#9333ea',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
