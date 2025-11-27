import { Stack, useRouter } from 'expo-router';
import { useState, useRef } from 'react';
import usePremiumStore from '~/store/premiumStore';
import { Alert } from 'react-native';

export default function SearchLayout() {
  const router = useRouter();
  const [showingLimitAlert, setShowingLimitAlert] = useState(false);
  const lastSearchText = useRef('');
  const lastCountedSearch = useRef('');
  const { canSearch, useSearch, getRemainingSearches, MAX_DAILY_SEARCHES } = usePremiumStore();

  // Live update search query without counting
  const handleTextChange = (text: string) => {
    // Always update the search query for live filtering
    router.setParams({ q: text || '' });
    lastSearchText.current = text;
  };

  // Count search only when user submits or leaves the search bar
  const handleSearchSubmit = (text: string) => {
    // Don't count empty searches or clearing
    if (!text || text.length === 0) {
      lastCountedSearch.current = '';
      return;
    }

    // If same as last counted search, don't count again
    if (text === lastCountedSearch.current) {
      return;
    }

    // Check if user can search
    if (!canSearch()) {
      if (!showingLimitAlert) {
        setShowingLimitAlert(true);
        const remaining = getRemainingSearches();
        Alert.alert(
          'Such-Limit erreicht',
          `Du hast deine ${MAX_DAILY_SEARCHES} täglichen Suchen aufgebraucht.\n\nMit Zitare Premium kannst du unbegrenzt suchen!`,
          [
            { text: 'Später', style: 'cancel', onPress: () => setShowingLimitAlert(false) },
            {
              text: 'Premium werden',
              onPress: () => {
                setShowingLimitAlert(false);
                router.push('/paywall');
              }
            }
          ]
        );
      }
      // Reset to last valid search
      router.setParams({ q: lastCountedSearch.current });
      lastSearchText.current = lastCountedSearch.current;
      return;
    }

    // Count this search
    if (useSearch()) {
      lastCountedSearch.current = text;
    }
  };

  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          headerShown: true, // Must be true for search bar to show
          title: '', // Empty title for clean look
          headerTransparent: true, // Make header transparent
          headerSearchBarOptions: {
            placement: 'automatic',
            placeholder: 'Search quotes, authors...',
            // Update search query live as user types (no counting)
            onChangeText: (event) => {
              handleTextChange(event.nativeEvent.text);
            },
            // Count search ONLY when user submits (presses Enter/Search button)
            onSearchButtonPress: (event) => {
              handleSearchSubmit(event.nativeEvent.text);
            },
          },
        }}
      />
    </Stack>
  );
}