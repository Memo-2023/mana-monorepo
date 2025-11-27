import React, { useEffect, useState } from 'react';
import StoryCardSkeleton from './StoryCardSkeleton';
import { View, FlatList, StyleSheet, useWindowDimensions } from 'react-native';
import StoryCard from './StoryCard';
import Text from '../atoms/Text';
import { useDebugBorders } from '../../hooks/useDebugBorders';
import { dataService } from '../../src/utils/dataService';

interface PublicStoryListProps {
	limit?: number;
	onDataLoaded?: (hasData: boolean) => void;
}

const useResponsiveLayout = () => {
	const { width: windowWidth } = useWindowDimensions();
	const isWideScreen = windowWidth > 1000;
	const isVeryWideScreen = windowWidth > 1400;

	return {
		offset: isWideScreen ? Math.min((windowWidth - 1000) / 2, 400) : 0,
		maxContentWidth: isVeryWideScreen ? 1400 : '100%',
		horizontalPadding: isWideScreen ? 40 : 16,
		isWideScreen,
		isVeryWideScreen,
	};
};

export default function PublicStoryList({ limit = 10, onDataLoaded }: PublicStoryListProps) {
	const sectionDebug = useDebugBorders('#FFA500', { borderStyle: 'dashed' });
	const listDebug = useDebugBorders('#00FFFF', { borderStyle: 'dashed' });
	const [stories, setStories] = useState<any[]>([]);
	const [loading, setLoading] = useState(true);
	const { isWideScreen } = useResponsiveLayout();

	useEffect(() => {
		const loadPublicStories = async () => {
			try {
				setLoading(true);
				const result = await dataService.getPublicStories('popular', 1, limit);
				const loadedStories = result.stories || [];
				setStories(loadedStories);
				setLoading(false);
				onDataLoaded?.(loadedStories.length > 0);
			} catch (error) {
				console.error('Error loading public stories:', error);
				setLoading(false);
				onDataLoaded?.(false);
			}
		};

		loadPublicStories();
	}, [limit, onDataLoaded]);

	const renderStoryItem = ({ item }: { item: any }) => {
		return (
			<View style={[styles.storyContainer, sectionDebug]}>
				<StoryCard story={item} width={240} />
			</View>
		);
	};

	if (loading) {
		return (
			<FlatList
				data={Array(4)} // Show 4 skeletons
				renderItem={() => (
					<View style={[styles.storyContainer, sectionDebug]}>
						<StoryCardSkeleton width={240} />
					</View>
				)}
				keyExtractor={(_, index) => `skeleton-${index}`}
				horizontal
				showsHorizontalScrollIndicator={false}
				contentContainerStyle={[styles.listContent, listDebug]}
				initialNumToRender={4}
				removeClippedSubviews={false}
			/>
		);
	}

	if (stories.length === 0) {
		return null;
	}

	return (
		<FlatList
			data={stories}
			renderItem={renderStoryItem}
			keyExtractor={(item) => item.id}
			horizontal
			showsHorizontalScrollIndicator={false}
			contentContainerStyle={[styles.listContent, listDebug]}
			initialNumToRender={4}
			removeClippedSubviews={false}
		/>
	);
}

const styles = StyleSheet.create({
	emptyContainer: {
		paddingHorizontal: 32,
		paddingVertical: 40,
		alignItems: 'center',
		justifyContent: 'center',
		minHeight: 200,
		backgroundColor: 'rgba(255, 255, 255, 0.03)',
		marginHorizontal: 16,
		borderRadius: 16,
		borderWidth: 1,
		borderColor: 'rgba(255, 255, 255, 0.08)',
	},
	emptyIconContainer: {
		width: 80,
		height: 80,
		borderRadius: 40,
		backgroundColor: 'rgba(255, 193, 7, 0.1)',
		alignItems: 'center',
		justifyContent: 'center',
		marginBottom: 16,
	},
	emptyIcon: {
		fontSize: 40,
	},
	emptyTitle: {
		fontSize: 18,
		fontWeight: '700',
		color: '#FFFFFF',
		textAlign: 'center',
		marginBottom: 8,
	},
	emptySubtitle: {
		fontSize: 14,
		color: '#CCCCCC',
		textAlign: 'center',
		lineHeight: 20,
	},
	listContent: {
		paddingBottom: 4,
		paddingLeft: 16,
		paddingRight: 16,
	},
	storyContainer: {
		marginRight: 16,
		marginBottom: 8,
		height: 360, // Fixed height to prevent layout shifts
	},
});
