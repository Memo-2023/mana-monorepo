import { useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../components/ThemeProvider';
import { Deck } from '../../types/models';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { SlideList } from '../../components/slides/SlideList';

export default function SharedDeckView() {
  const { id } = useLocalSearchParams();
  const { theme } = useTheme();
  const [deck, setDeck] = useState<Deck | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDeck = async () => {
      try {
        const deckDoc = await getDoc(doc(db, 'decks', id as string));
        if (!deckDoc.exists()) {
          setError('Deck not found');
          return;
        }

        const deckData = deckDoc.data() as Deck;
        if (!deckData.sharing.isPublic) {
          setError('This deck is not publicly accessible');
          return;
        }

        setDeck(deckData);
      } catch (err) {
        setError('Failed to load deck');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchDeck();
  }, [id]);

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Text style={[styles.text, { color: theme.colors.textPrimary }]}>Loading...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Text style={[styles.text, { color: theme.colors.error }]}>{error}</Text>
      </View>
    );
  }

  if (!deck) {
    return null;
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Text style={[styles.title, { color: theme.colors.textPrimary }]}>{deck.name}</Text>
      {deck.description && (
        <Text style={[styles.description, { color: theme.colors.textSecondary }]}>
          {deck.description}
        </Text>
      )}
      <SlideList deckId={id as string} isReadOnly />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  text: {
    fontSize: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    marginBottom: 24,
  },
});
