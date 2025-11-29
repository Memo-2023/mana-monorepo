import React, { useState, useMemo, useCallback } from 'react';
import {
	View,
	StyleSheet,
	FlatList,
	Dimensions,
	TouchableOpacity,
	ActivityIndicator,
	RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Text from '../components/atoms/Text';
import CommonHeader from '../components/molecules/CommonHeader';
import SearchBar from '../components/molecules/SearchBar';
import Avatar from '../components/atoms/Avatar';
import { usePublicCharacters } from '../hooks/usePublicCharacters';
import BottomFilterTabs, { type FilterTab } from '../components/molecules/BottomFilterTabs';

export default function DiscoverCharactersScreen() {
	const router = useRouter();
	const [activeTab, setActiveTab] = useState<FilterTab>('popular');
	const [isSearchVisible, setIsSearchVisible] = useState(false);
	const [searchQuery, setSearchQuery] = useState('');

	// Temporarily disabled - backend endpoints not yet implemented
	const {
		characters,
		loading,
		error,
		loadMore,
		hasMore,
		refresh,
		refreshing,
		voteForCharacter,
		removeVote,
		cloneCharacter,
	} = usePublicCharacters(activeTab, null);

	// Override to show coming soon message if error
	const showComingSoon = error?.includes('404') || error?.includes('failed');

	const screenWidth = Dimensions.get('window').width;
	const isWideScreen = screenWidth > 1000;
	const containerWidth = isWideScreen ? 1200 : screenWidth;
	const numColumns = 2; // Always use 2 columns like the characters page
	const avatarSize = isWideScreen ? 180 : Math.min(150, (screenWidth - 96) / 2);

	const handleSearchPress = useCallback(() => {
		setIsSearchVisible(true);
	}, []);

	const handleCloseSearch = useCallback(() => {
		setIsSearchVisible(false);
		setSearchQuery('');
	}, []);

	const handleTabPress = useCallback((tab: FilterTab) => {
		setActiveTab(tab);
	}, []);

	const handleCharacterPress = useCallback(
		(character: any) => {
			// Navigate to character detail page
			router.push(`/character/${character.id}`);
		},
		[router]
	);

	const handleVote = useCallback(
		async (characterId: string, voteType: 'like' | 'love' | 'star') => {
			await voteForCharacter(characterId, voteType);
		},
		[voteForCharacter]
	);

	const handleClone = useCallback(
		async (characterId: string) => {
			const result = await cloneCharacter(characterId);
			if (result) {
				router.push(`/character/${result.character.id}`);
			}
		},
		[cloneCharacter, router]
	);

	const filteredCharacters = useMemo(() => {
		if (!searchQuery.trim()) {
			return characters;
		}

		const query = searchQuery.toLowerCase().trim();
		return characters.filter(
			(character) =>
				character?.name?.toLowerCase().includes(query) ||
				character?.original_description?.toLowerCase().includes(query)
		);
	}, [characters, searchQuery]);

	const HeaderButtons = () => (
		<View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
			<TouchableOpacity
				onPress={() => router.push('/share-code-input')}
				style={styles.headerButton}
				hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
			>
				<Ionicons name="enter-outline" size={24} color="#ffffff" />
			</TouchableOpacity>
			<TouchableOpacity
				onPress={handleSearchPress}
				style={styles.headerButton}
				hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
			>
				<Ionicons name="search-outline" size={24} color="#ffffff" />
			</TouchableOpacity>
		</View>
	);

	const renderCharacterItem = ({ item }) => (
		<TouchableOpacity style={styles.characterContainer} onPress={() => handleCharacterPress(item)}>
			<Avatar imageUrl={item.image_url} name={item.name} size={avatarSize} />
		</TouchableOpacity>
	);

	const renderHeader = () => null;

	const renderFooter = () => {
		if (!hasMore) return null;

		return (
			<View style={styles.footerLoader}>
				<ActivityIndicator size="small" color="#FFCB00" />
			</View>
		);
	};

	const renderEmptyState = () => {
		// Show coming soon message if backend endpoints not ready
		if (showComingSoon) {
			return (
				<View style={styles.emptyState}>
					<Ionicons name="construct-outline" size={64} color="#FFD700" />
					<Text style={styles.emptyStateTitle}>Bald verfügbar!</Text>
					<Text style={styles.emptyStateText}>
						Die öffentliche Charakter-Galerie wird bald verfügbar sein.
						{'\n\n'}Du kannst bereits deine eigenen Charaktere über den Share-Button
						veröffentlichen.
					</Text>
				</View>
			);
		}

		return (
			<View style={styles.emptyState}>
				<Ionicons name="people-outline" size={64} color="#666666" />
				<Text style={styles.emptyStateTitle}>Keine Charaktere gefunden</Text>
				<Text style={styles.emptyStateText}>
					{searchQuery
						? 'Versuche es mit anderen Suchbegriffen'
						: 'Bald werden hier magische Charaktere erscheinen'}
				</Text>
			</View>
		);
	};

	return (
		<SafeAreaView style={styles.safeArea} edges={['top']}>
			<CommonHeader title="Charaktere entdecken" rightComponent={<HeaderButtons />} />

			{isSearchVisible && (
				<SearchBar
					value={searchQuery}
					onChangeText={setSearchQuery}
					onClose={handleCloseSearch}
					placeholder="Charaktere suchen..."
					autoFocus
				/>
			)}

			<View style={[styles.container, { maxWidth: containerWidth }]}>
				{loading && !refreshing ? (
					<View style={styles.loadingContainer}>
						<ActivityIndicator size="large" color="#FFCB00" />
						<Text style={styles.loadingText}>Charaktere werden geladen...</Text>
					</View>
				) : error && !showComingSoon ? (
					<View style={styles.errorContainer}>
						<Text style={styles.errorText}>Fehler beim Laden der Charaktere</Text>
						<TouchableOpacity onPress={refresh} style={styles.retryButton}>
							<Text style={styles.retryButtonText}>Erneut versuchen</Text>
						</TouchableOpacity>
					</View>
				) : (
					<FlatList
						data={filteredCharacters}
						renderItem={renderCharacterItem}
						keyExtractor={(item) => item.id}
						numColumns={2}
						ListHeaderComponent={renderHeader}
						ListFooterComponent={renderFooter}
						ListEmptyComponent={renderEmptyState}
						onEndReached={loadMore}
						onEndReachedThreshold={0.5}
						refreshControl={
							<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor="#FFCB00" />
						}
						contentContainerStyle={styles.listContent}
						showsVerticalScrollIndicator={false}
					/>
				)}
			</View>

			<BottomFilterTabs activeTab={activeTab} onTabPress={handleTabPress} />
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
		alignSelf: 'center',
		width: '100%',
	},
	listContent: {
		paddingTop: 100, // Space for header
		paddingBottom: 0, // Space for bottom tabs
	},
	characterContainer: {
		flex: 1,
		maxWidth: '50%',
		alignItems: 'center',
		justifyContent: 'center',
		padding: 16,
	},
	headerButton: {
		width: 40,
		height: 40,
		alignItems: 'center',
		justifyContent: 'center',
		borderRadius: 20,
	},
	loadingContainer: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		paddingTop: 200,
	},
	loadingText: {
		color: '#A0A0A0',
		marginTop: 16,
		fontSize: 16,
	},
	errorContainer: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		paddingTop: 200,
	},
	errorText: {
		color: '#FF4444',
		fontSize: 16,
		marginBottom: 16,
	},
	retryButton: {
		backgroundColor: '#FFCB00',
		paddingHorizontal: 24,
		paddingVertical: 12,
		borderRadius: 24,
	},
	retryButtonText: {
		color: '#000000',
		fontSize: 16,
		fontWeight: '600',
	},
	footerLoader: {
		paddingVertical: 20,
		alignItems: 'center',
	},
	emptyState: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		paddingTop: 100,
	},
	emptyStateTitle: {
		color: '#FFFFFF',
		fontSize: 20,
		fontWeight: '600',
		marginTop: 16,
		marginBottom: 8,
	},
	emptyStateText: {
		color: '#A0A0A0',
		fontSize: 16,
		textAlign: 'center',
		paddingHorizontal: 32,
	},
});
