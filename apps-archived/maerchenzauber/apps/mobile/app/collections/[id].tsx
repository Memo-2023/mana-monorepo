import React, { useState, useEffect } from 'react';
import {
	View,
	StyleSheet,
	FlatList,
	Dimensions,
	ActivityIndicator,
	ImageBackground,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import StoryCard from '../../components/molecules/StoryCard';
import Text from '../../components/atoms/Text';
import CommonHeader from '../../components/molecules/CommonHeader';
import { dataService } from '../../src/utils/dataService';
import { useAuth } from '../../src/contexts/AuthContext';
import StoryCardSkeleton from '../../components/molecules/StoryCardSkeleton';

interface Collection {
	id: string;
	name: string;
	description: string;
	type: string;
	icon_url?: string;
	banner_url?: string;
	metadata?: any;
}

export default function CollectionDetailScreen() {
	const { id } = useLocalSearchParams();
	const router = useRouter();
	const [collection, setCollection] = useState<Collection | null>(null);
	const [stories, setStories] = useState<any[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const { isAuthenticated } = useAuth();

	const screenWidth = Dimensions.get('window').width;
	const isWideScreen = screenWidth > 1000;
	const containerWidth = isWideScreen ? 600 : screenWidth;
	const cardWidth = Math.min((containerWidth - 48) / 2, 280);

	useEffect(() => {
		fetchCollectionData();
	}, [id]);

	const fetchCollectionData = async () => {
		if (!isAuthenticated || !id) {
			setError('Not authenticated or invalid collection');
			setLoading(false);
			return;
		}

		try {
			setLoading(true);

			// Fetch collection details
			const collections = await dataService.getCollections();
			const collectionData = collections.find((c) => c.id === id);

			if (collectionData) {
				setCollection(collectionData);
			}

			// Fetch collection stories
			const collectionStories = await dataService.getCollectionStories(id as string);
			setStories(collectionStories);

			setError(null);
		} catch (err) {
			console.error('Error fetching collection:', err);
			setError(err instanceof Error ? err.message : 'Failed to fetch collection');
		} finally {
			setLoading(false);
		}
	};

	const renderStoryItem = ({ item }) => (
		<View style={styles.cardContainer}>
			<StoryCard
				story={item}
				width={cardWidth}
				showBadge={item.visibility === 'featured'}
				badgeText={item.visibility === 'featured' ? '⭐ Featured' : undefined}
				showVoteCount={true}
				voteCount={item.vote_count || 0}
			/>
		</View>
	);

	const renderHeader = () => (
		<View style={styles.headerContainer}>
			{collection?.banner_url ? (
				<ImageBackground
					source={{ uri: collection.banner_url }}
					style={styles.bannerImage}
					resizeMode="cover"
				>
					<LinearGradient
						colors={['transparent', 'rgba(24, 24, 24, 0.9)']}
						style={styles.bannerGradient}
					>
						<View style={styles.headerContent}>
							{renderCollectionIcon()}
							<Text style={styles.collectionTitle}>{collection?.name}</Text>
							<Text style={styles.collectionDescription}>{collection?.description}</Text>
							{renderCollectionBadge()}
						</View>
					</LinearGradient>
				</ImageBackground>
			) : (
				<View style={styles.headerContent}>
					{renderCollectionIcon()}
					<Text style={styles.collectionTitle}>{collection?.name}</Text>
					<Text style={styles.collectionDescription}>{collection?.description}</Text>
					{renderCollectionBadge()}
				</View>
			)}

			<View style={styles.statsContainer}>
				<View style={styles.statItem}>
					<Ionicons name="book" size={20} color="#FFD700" />
					<Text style={styles.statText}>{stories.length} Geschichten</Text>
				</View>
				{collection?.type === 'contest' && (
					<View style={styles.statItem}>
						<Ionicons name="trophy" size={20} color="#FFD700" />
						<Text style={styles.statText}>Wettbewerb</Text>
					</View>
				)}
				{collection?.type === 'seasonal' && (
					<View style={styles.statItem}>
						<Ionicons name="calendar" size={20} color="#FFD700" />
						<Text style={styles.statText}>Saisonal</Text>
					</View>
				)}
			</View>
		</View>
	);

	const renderCollectionIcon = () => {
		if (collection?.icon_url) {
			return (
				<View style={styles.iconContainer}>
					<ImageBackground
						source={{ uri: collection.icon_url }}
						style={styles.iconImage}
						resizeMode="cover"
					/>
				</View>
			);
		}

		const iconName =
			collection?.type === 'contest'
				? 'trophy'
				: collection?.type === 'seasonal'
					? 'calendar'
					: collection?.type === 'official'
						? 'star'
						: 'library';

		return (
			<View style={styles.iconContainer}>
				<Ionicons name={iconName} size={48} color="#FFD700" />
			</View>
		);
	};

	const renderCollectionBadge = () => {
		if (collection?.type === 'official') {
			return (
				<View style={styles.badge}>
					<Text style={styles.badgeText}>✨ Offiziell</Text>
				</View>
			);
		}
		return null;
	};

	const renderEmptyState = () => (
		<View style={styles.emptyState}>
			<Ionicons name="book-outline" size={64} color="#666" />
			<Text style={styles.emptyStateTitle}>Keine Geschichten</Text>
			<Text style={styles.emptyStateText}>Diese Sammlung enthält noch keine Geschichten</Text>
		</View>
	);

	if (loading) {
		return (
			<SafeAreaView style={styles.safeArea} edges={['top']}>
				<CommonHeader title="Sammlung" showBackButton={true} />
				<View style={styles.loadingContainer}>
					<ActivityIndicator size="large" color="#FFD700" />
				</View>
			</SafeAreaView>
		);
	}

	if (error) {
		return (
			<SafeAreaView style={styles.safeArea} edges={['top']}>
				<CommonHeader title="Sammlung" showBackButton={true} />
				<View style={styles.errorContainer}>
					<Ionicons name="alert-circle" size={64} color="#FF6B6B" />
					<Text style={styles.errorText}>{error}</Text>
				</View>
			</SafeAreaView>
		);
	}

	return (
		<SafeAreaView style={styles.safeArea} edges={['top']}>
			<CommonHeader title="Sammlung" showBackButton={true} />

			<FlatList
				data={stories}
				renderItem={renderStoryItem}
				keyExtractor={(item) => item.id}
				numColumns={2}
				showsVerticalScrollIndicator={false}
				contentContainerStyle={[
					styles.listContent,
					stories.length === 0 && styles.emptyListContent,
				]}
				columnWrapperStyle={stories.length > 0 ? styles.row : undefined}
				ListHeaderComponent={renderHeader}
				ListEmptyComponent={renderEmptyState}
			/>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	safeArea: {
		flex: 1,
		backgroundColor: '#181818',
	},
	loadingContainer: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
	},
	errorContainer: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		padding: 20,
	},
	errorText: {
		fontSize: 16,
		color: '#FF6B6B',
		marginTop: 12,
		textAlign: 'center',
	},
	headerContainer: {
		marginBottom: 24,
		marginTop: 100,
	},
	bannerImage: {
		width: '100%',
		height: 200,
	},
	bannerGradient: {
		flex: 1,
		justifyContent: 'flex-end',
	},
	headerContent: {
		padding: 20,
		alignItems: 'center',
	},
	iconContainer: {
		width: 80,
		height: 80,
		borderRadius: 40,
		backgroundColor: 'rgba(255, 215, 0, 0.1)',
		alignItems: 'center',
		justifyContent: 'center',
		marginBottom: 16,
		borderWidth: 2,
		borderColor: 'rgba(255, 215, 0, 0.3)',
	},
	iconImage: {
		width: 80,
		height: 80,
		borderRadius: 40,
		overflow: 'hidden',
	},
	collectionTitle: {
		fontSize: 28,
		fontWeight: 'bold',
		color: '#FFFFFF',
		marginBottom: 8,
		textAlign: 'center',
	},
	collectionDescription: {
		fontSize: 16,
		color: '#999999',
		textAlign: 'center',
		marginBottom: 12,
		paddingHorizontal: 20,
	},
	badge: {
		backgroundColor: '#FFD700',
		paddingHorizontal: 12,
		paddingVertical: 6,
		borderRadius: 16,
		marginTop: 8,
	},
	badgeText: {
		fontSize: 14,
		fontWeight: '700',
		color: '#181818',
	},
	statsContainer: {
		flexDirection: 'row',
		justifyContent: 'center',
		paddingHorizontal: 20,
		paddingTop: 16,
		gap: 24,
	},
	statItem: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 8,
	},
	statText: {
		fontSize: 14,
		color: '#FFFFFF',
		fontWeight: '600',
	},
	listContent: {
		paddingHorizontal: 16,
		paddingBottom: 16,
	},
	emptyListContent: {
		flexGrow: 1,
	},
	row: {
		justifyContent: 'space-between',
		width: '100%',
	},
	cardContainer: {
		marginBottom: 16,
	},
	emptyState: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'center',
		paddingVertical: 60,
	},
	emptyStateTitle: {
		fontSize: 18,
		fontWeight: '600',
		color: '#FFFFFF',
		marginTop: 16,
	},
	emptyStateText: {
		fontSize: 14,
		color: '#999',
		marginTop: 8,
		textAlign: 'center',
	},
});
