import React, { useEffect, useState } from 'react';
import Skeleton from '../atoms/Skeleton';
import { View, FlatList, StyleSheet, TouchableOpacity, useWindowDimensions } from 'react-native';
import Avatar from '../atoms/Avatar';
import Text from '../atoms/Text';
import { useDebugBorders } from '../../hooks/useDebugBorders';
import { dataService } from '../../src/utils/dataService';

interface PublicCharacterListProps {
	onCharacterPress?: (character: any) => void;
	limit?: number;
	onDataLoaded?: (hasData: boolean) => void;
}

const useResponsiveOffset = () => {
	const { width: windowWidth } = useWindowDimensions();
	return {
		offset: windowWidth > 1000 ? 400 : 0,
		isWideScreen: windowWidth > 1000,
	};
};

export default function PublicCharacterList({
	onCharacterPress,
	limit = 20,
	onDataLoaded,
}: PublicCharacterListProps) {
	const containerDebug = useDebugBorders('#FF0000');
	const cardDebug = useDebugBorders('#00FF00');
	const listDebug = useDebugBorders('#0000FF');
	const avatarDebug = useDebugBorders('#FF00FF');
	const [characters, setCharacters] = useState<any[]>([]);
	const [loading, setLoading] = useState(true);
	const { offset, isWideScreen } = useResponsiveOffset();

	useEffect(() => {
		const loadPublicCharacters = async () => {
			try {
				setLoading(true);
				const result = await dataService.getPublicCharacters('popular', limit, 0);
				const loadedCharacters = result.characters || [];
				setCharacters(loadedCharacters);
				setLoading(false);
				onDataLoaded?.(loadedCharacters.length > 0);
			} catch (error) {
				console.error('Error loading public characters:', error);
				setLoading(false);
				onDataLoaded?.(false);
			}
		};

		loadPublicCharacters();
	}, [limit, onDataLoaded]);

	const renderCharacter = ({ item }: { item: any }) => (
		<TouchableOpacity
			style={[styles.characterCard, cardDebug]}
			onPress={() => onCharacterPress?.(item)}
		>
			<View style={[avatarDebug, styles.avatarContainer]}>
				<Avatar imageUrl={item.image_url} name={item.name} size={100} />
			</View>
		</TouchableOpacity>
	);

	const renderSpacer = () =>
		isWideScreen ? <View style={[styles.spacer, { width: offset }]} /> : null;

	const SkeletonCharacter = () => (
		<TouchableOpacity style={[styles.characterCard, cardDebug]} disabled>
			<View style={[avatarDebug, styles.skeletonAvatarContainer]}>
				<Skeleton style={styles.skeletonAvatar} />
			</View>
		</TouchableOpacity>
	);

	if (loading) {
		return (
			<View style={[styles.container, containerDebug]}>
				<FlatList
					horizontal
					showsHorizontalScrollIndicator={false}
					data={isWideScreen ? [null, 1, 2, 3, 4] : [1, 2, 3, 4]} // No create button for public characters
					renderItem={({ index }) => {
						if (index === 0 && isWideScreen) {
							return renderSpacer();
						}
						return <SkeletonCharacter />;
					}}
					keyExtractor={(_, index) => `skeleton-${index}`}
					contentContainerStyle={styles.listContent}
					initialNumToRender={5}
					removeClippedSubviews={false}
				/>
			</View>
		);
	}

	if (characters.length === 0) {
		return null;
	}

	return (
		<View style={[styles.container, containerDebug]}>
			<FlatList
				style={listDebug}
				data={isWideScreen ? [null, ...characters] : characters}
				renderItem={({ item, index }) => {
					if (index === 0 && isWideScreen) {
						return renderSpacer();
					}
					return renderCharacter({ item: item! });
				}}
				keyExtractor={(item, index) => item?.id || `spacer-${index}`}
				horizontal
				showsHorizontalScrollIndicator={false}
				contentContainerStyle={styles.listContent}
				initialNumToRender={5}
				removeClippedSubviews={false}
			/>
		</View>
	);
}

const styles = StyleSheet.create({
	avatarContainer: {
		shadowColor: '#000',
		shadowOffset: {
			width: 4,
			height: 4,
		},
		shadowOpacity: 0.3,
		shadowRadius: 5,
		elevation: 8,
	},
	skeletonAvatarContainer: {
		justifyContent: 'center',
		alignItems: 'center',
		height: 100, // Match the avatar size
	},
	skeletonAvatar: {
		width: 100,
		height: 100,
		borderRadius: 50,
		backgroundColor: '#2C2C2C',
	},
	container: {
		marginTop: 4,
		marginBottom: 0, // Kein unterer Rand
		width: '100%',
		height: 140, // Feste Höhe, um Layout-Sprünge zu verhindern
	},
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
		marginTop: 4,
	},
	emptyIconContainer: {
		width: 80,
		height: 80,
		borderRadius: 40,
		backgroundColor: 'rgba(156, 39, 176, 0.1)',
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
		paddingRight: 16, // Gleicher Abstand wie paddingLeft im Hauptcontainer
		paddingLeft: 16,
	},
	characterCard: {
		width: 120,
		marginRight: -5,
	},
	spacer: {
		width: 400,
	},
});
