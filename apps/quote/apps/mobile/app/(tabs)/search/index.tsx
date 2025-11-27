import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, Text, FlatList, TouchableOpacity, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useState } from 'react';
import { Icon } from '~/components/Icon';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  interpolate,
  Extrapolate
} from 'react-native-reanimated';
import { useQuotesStore } from '~/store/quotesStore';
import { useIsDarkMode } from '~/store/settingsStore';
import QuoteCard from '~/components/QuoteCard';
import { useTranslation } from 'react-i18next';
import { LIST_CONTAINER_PADDING } from '~/constants/layout';
import { useTheme } from '~/hooks/useTheme';

const AnimatedFlatList = Animated.createAnimatedComponent(FlatList);
const { height: screenHeight } = Dimensions.get('window');

export default function SearchIndex() {
  const { t } = useTranslation();
  const router = useRouter();
  const isDarkMode = useIsDarkMode();
  const { colors } = useTheme();
  const params = useLocalSearchParams();
  const { q: searchQuery } = params;
  const [viewMode, setViewMode] = useState<'card' | 'list'>('list');
  const scrollY = useSharedValue(0);
  
  // Calculate card height for vertical mode
  const TAB_BAR_HEIGHT = 80;
  const STATUS_BAR_HEIGHT = 44;
  const CARD_HEIGHT = screenHeight - STATUS_BAR_HEIGHT - TAB_BAR_HEIGHT - 100;

  const { quotes, authors, toggleFavorite, initializeStore, isLoading } = useQuotesStore();

  useEffect(() => {
    initializeStore();
  }, []);

  // Filter quotes based on search query
  const filteredQuotes = useMemo(() => {
    if (!searchQuery || typeof searchQuery !== 'string') {
      return quotes; // Show all quotes when no search query
    }

    const query = searchQuery.toLowerCase().trim();
    if (!query) {
      return quotes;
    }

    return quotes.filter(quote => 
      quote.text.toLowerCase().includes(query) ||
      (quote.author?.name && quote.author.name.toLowerCase().includes(query)) ||
      (quote.tags && quote.tags.some(tag => tag.toLowerCase().includes(query))) ||
      (quote.categories && quote.categories.some(cat => cat.toLowerCase().includes(query)))
    );
  }, [quotes, searchQuery]);

  const renderQuote = ({ item, index }) => {
    if (viewMode === 'card') {
      return (
        <View style={{ position: 'relative', width: '100%' }}>
          <QuoteCard
            quote={item}
            variant="vertical"
            index={index}
            scrollY={scrollY}
            cardHeight={CARD_HEIGHT}
            onToggleFavorite={toggleFavorite}
            onAuthorPress={() => {
              if (item?.authorId) {
                router.push(`/author/${item.authorId}`);
              }
            }}
          />
        </View>
      );
    }
    
    // List view
    return (
      <View className="mb-5">
        <QuoteCard
          quote={item}
          onToggleFavorite={toggleFavorite}
          onAuthorPress={() => {
            if (item?.authorId) {
              router.push(`/author/${item.authorId}`);
            }
          }}
        />
      </View>
    );
  };

  const renderEmptyState = () => {
    if (searchQuery && typeof searchQuery === 'string' && searchQuery.trim()) {
      // No results for search
      return (
        <View className="flex-1 justify-center items-center py-20 px-8">
          <Ionicons 
            name="search-outline" 
            size={64} 
            color={isDarkMode ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)'} 
          />
          <Text className={`${isDarkMode ? 'text-white' : 'text-black'} text-lg font-semibold text-center mt-4`}>
            {t('search.noResults', { defaultValue: 'No Results Found' })}
          </Text>
          <Text className={`${isDarkMode ? 'text-white/60' : 'text-black/60'} text-base text-center mt-2`}>
            No quotes found for "{searchQuery}"
          </Text>
          <Text className={`${isDarkMode ? 'text-white/40' : 'text-black/40'} text-sm text-center mt-4`}>
            Try searching for different keywords or authors
          </Text>
        </View>
      );
    }

    // Welcome state when no search
    return (
      <View className="flex-1 justify-center items-center py-20 px-8">
        <Ionicons 
          name="search" 
          size={80} 
          color={isDarkMode ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)'} 
        />
        <Text className={`${isDarkMode ? 'text-white' : 'text-black'} text-xl font-bold text-center mt-6`}>
          {t('search.title', { defaultValue: 'Search Quotes' })}
        </Text>
        <Text className={`${isDarkMode ? 'text-white/60' : 'text-black/60'} text-base text-center mt-2`}>
          {t('search.description', { defaultValue: 'Use the search bar above to find quotes by text, author, or topic' })}
        </Text>
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <View className="flex-1 justify-center items-center">
          <Text className={`${isDarkMode ? 'text-white' : 'text-black'}`}>
            {t('quotes.loadingQuotes', { defaultValue: 'Loading quotes...' })}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen 
        options={{
          title: t('navigation.search'),
          headerShown: true,
          headerTransparent: true,
          headerBlurEffect: isDarkMode ? 'dark' : 'light',
          headerStyle: {
            backgroundColor: 'transparent',
          },
          headerTintColor: isDarkMode ? '#ffffff' : '#000000',
          headerShadowVisible: false,
          headerTitleAlign: 'center',
          headerRight: () => (
            <TouchableOpacity 
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setViewMode(viewMode === 'card' ? 'list' : 'card');
              }}
              style={{
                justifyContent: 'center',
                alignItems: 'center',
                width: 44,
                height: 44,
                marginTop: -4,
              }}
            >
              <Icon
                name={viewMode === 'list' ? 'grid-outline' : 'list-outline'}
                size={24}
                color={isDarkMode ? '#ffffff' : '#000000'}
              />
            </TouchableOpacity>
          ),
          headerRightContainerStyle: {
            paddingRight: 16,
          },
        }} 
      />
      
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <AnimatedFlatList
        data={filteredQuotes}
        renderItem={renderQuote}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={
          filteredQuotes.length === 0
            ? { flex: 1 }
            : { 
                paddingTop: LIST_CONTAINER_PADDING.top,
                paddingBottom: viewMode === 'list' ? LIST_CONTAINER_PADDING.bottom : CARD_HEIGHT * 0.1
              }
        }
        ListHeaderComponent={
          searchQuery && filteredQuotes.length > 0 ? (
            <View className="items-center mb-4">
              <View className={`${isDarkMode ? 'bg-white/10 backdrop-blur-md border border-white/20' : 'bg-black/10 backdrop-blur-md border border-black/20'} px-4 py-2 rounded-full`}>
                <Text className={`${isDarkMode ? 'text-white/90' : 'text-black/90'} text-sm font-medium`}>
                  {filteredQuotes.length} {filteredQuotes.length === 1 ? 'result' : 'results'}
                </Text>
              </View>
            </View>
          ) : null
        }
        ListEmptyComponent={renderEmptyState}
        onScroll={useAnimatedScrollHandler({
          onScroll: (event) => {
            scrollY.value = event.contentOffset.y;
          },
        })}
        scrollEventThrottle={16}
        pagingEnabled={viewMode === 'card'}
        snapToInterval={viewMode === 'card' ? CARD_HEIGHT : undefined}
        snapToAlignment={viewMode === 'card' ? "start" : undefined}
        decelerationRate={viewMode === 'card' ? "fast" : "normal"}
        getItemLayout={viewMode === 'card' ? (data, index) => ({
          length: CARD_HEIGHT,
          offset: CARD_HEIGHT * index,
          index
        }) : undefined}
      />
      </View>
    </>
  );
}