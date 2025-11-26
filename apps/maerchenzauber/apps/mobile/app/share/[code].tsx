import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { fetchWithAuth } from '../../src/utils/api';
import Text from '../../components/atoms/Text';
import Button from '../../components/atoms/Button';
import CommonHeader from '../../components/molecules/CommonHeader';
import Avatar from '../../components/atoms/Avatar';
import { Colors } from '../../constants/Colors';
import { usePublicCharacters } from '../../hooks/usePublicCharacters';

export default function ShareCodeScreen() {
  const { code } = useLocalSearchParams<{ code: string }>();
  const router = useRouter();
  const [character, setCharacter] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { cloneCharacter } = usePublicCharacters();

  useEffect(() => {
    loadCharacterByCode();
  }, [code]);

  const loadCharacterByCode = async () => {
    try {
      setLoading(true);
      const response = await fetchWithAuth(`/characters/public/share/${code}`);
      
      if (!response.ok) {
        throw new Error('Charakter nicht gefunden');
      }

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }

      setCharacter(data.character);
      setError(null);
    } catch (err) {
      console.error('Error loading character by share code:', err);
      setError('Dieser Share-Code ist ungültig oder abgelaufen.');
    } finally {
      setLoading(false);
    }
  };

  const handleCloneCharacter = async () => {
    if (!character) return;
    
    const result = await cloneCharacter(character.id);
    if (result) {
      router.replace(`/character/${result.character.id}`);
    }
  };

  const handleViewCharacter = () => {
    if (!character) return;
    router.push(`/character/${character.id}`);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <CommonHeader title="Geteilter Charakter" showBackButton />
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#FFCB00" />
          <Text style={styles.loadingText}>Lade Charakter...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <CommonHeader title="Fehler" showBackButton />
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <Button
            title="Zurück"
            onPress={() => router.back()}
            variant="primary"
            size="md"
            style={styles.button}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <CommonHeader title="Geteilter Charakter" showBackButton />
      <View style={styles.container}>
        <View style={styles.characterCard}>
          <Avatar
            imageUrl={character?.image_url}
            name={character?.name}
            size={180}
          />
          <Text style={styles.characterName}>{character?.name}</Text>
          <Text style={styles.characterDescription}>
            {character?.original_description}
          </Text>
          
          <View style={styles.shareInfo}>
            <Text style={styles.shareCode}>Share-Code: {code}</Text>
            <Text style={styles.sharedBy}>
              Geteilt von einem Freund
            </Text>
          </View>
        </View>

        <View style={styles.actions}>
          <Button
            title="Zu meinen Charakteren hinzufügen"
            onPress={handleCloneCharacter}
            variant="primary"
            size="lg"
            style={styles.button}
          />
          <Button
            title="Charakter ansehen"
            onPress={handleViewCharacter}
            variant="secondary"
            size="lg"
            style={styles.button}
            color="#333333"
            textStyle={{ color: "#ffffff" }}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#181818',
  },
  container: {
    flex: 1,
    padding: 16,
    maxWidth: 600,
    width: '100%',
    alignSelf: 'center',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  characterCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginTop: 32,
    marginBottom: 32,
  },
  characterName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 16,
    marginBottom: 8,
  },
  characterDescription: {
    fontSize: 16,
    color: '#A0A0A0',
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 16,
  },
  shareInfo: {
    marginTop: 24,
    padding: 16,
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    borderRadius: 12,
    alignItems: 'center',
  },
  shareCode: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFD700',
    marginBottom: 8,
  },
  sharedBy: {
    fontSize: 14,
    color: '#A0A0A0',
  },
  actions: {
    gap: 12,
  },
  button: {
    marginBottom: 12,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#A0A0A0',
  },
  errorText: {
    fontSize: 18,
    color: '#FF4444',
    textAlign: 'center',
    marginBottom: 24,
  },
});