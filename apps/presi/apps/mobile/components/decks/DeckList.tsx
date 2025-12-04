import React, { useState } from 'react';
import {
	View,
	FlatList,
	TouchableOpacity,
	Text,
	StyleSheet,
	Image,
	useWindowDimensions,
	ActivityIndicator,
	Pressable,
} from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { type Deck } from '../../types/models';
import { useTheme } from '../../components/ThemeProvider';
import { CreateItemButton } from '../common/CreateItemButton';
import { MenuRoot, MenuTrigger, MenuContent, MenuItem, MenuItemTitle } from '../common/menu';

interface DeckListProps {
	decks: Deck[];
	onDeckPress: (deck: Deck) => void;
	onCreateDeck: () => void;
	onDeleteDeck: (deck: Deck) => void;
	onShareDeck: (deck: Deck) => void;
	firstSlideImages: { [key: string]: string };
	loading?: boolean;
	slideCounts: { [key: string]: number };
	scrollPadding?: {
		vertical?: { top?: number; bottom?: number };
		horizontal?: { top?: number; bottom?: number };
	};
	deckSpacing?: {
		vertical?: number;
		horizontal?: number;
	};
}

export const DeckList: React.FC<DeckListProps> = ({
	decks,
	onDeckPress,
	onCreateDeck,
	onDeleteDeck,
	onShareDeck,
	firstSlideImages,
	loading = false,
	slideCounts,
	scrollPadding = {
		vertical: { top: 0, bottom: 0 },
		horizontal: { top: 0, bottom: 0 },
	},
	deckSpacing = { vertical: 8, horizontal: 8 },
}) => {
	const { width } = useWindowDimensions();
	const isSmallScreen = width < 768;
	const deckWidth = !isSmallScreen
		? Math.floor((width - 40 - deckSpacing.horizontal * 2) / 2.5)
		: 'auto';
	const { theme } = useTheme();

	if (loading) {
		return (
			<View style={styles.container}>
				<ActivityIndicator size="large" color={theme.colors.primary} />
			</View>
		);
	}

	if (decks.length === 0) {
		return (
			<View style={[styles.container, styles.emptyState]}>
				<MaterialIcons name="dashboard" size={48} color={theme.colors.textTertiary} />
				<Text style={[styles.emptyStateText, { color: theme.colors.textSecondary }]}>
					No decks yet
				</Text>
				<Text style={[styles.emptyStateSubtext, { color: theme.colors.textTertiary }]}>
					Create your first deck to get started
				</Text>
				<CreateItemButton
					onPress={onCreateDeck}
					variant="button"
					title="Neues Deck erstellen"
					buttonText="Erstelle dein erstes Deck"
					icon="library-add"
					buttonIcon="library-add"
				/>
			</View>
		);
	}

	const renderDeck = ({ item }: { item: Deck | 'create' }) => {
		if (item === 'create') {
			return (
				<CreateItemButton
					onPress={onCreateDeck}
					variant="card"
					width={deckWidth}
					title="Neues Deck erstellen"
					buttonText="Neues Deck erstellen"
					icon="library-add"
					buttonIcon="library-add"
				/>
			);
		}

		return (
			<TouchableOpacity
				style={[
					styles.deckContainer,
					!isSmallScreen ? { width: deckWidth } : {},
					{ backgroundColor: 'transparent' },
				]}
				onPress={() => onDeckPress(item)}
			>
				<View style={styles.deckContent}>
					<MenuRoot>
						<MenuTrigger>
							<View style={styles.deckInfoContainer}>
								<View style={styles.metaInfo}>
									<Text style={[styles.metaText, { color: theme.colors.textSecondary }]}>
										{new Date(item.updatedAt).toLocaleDateString('de-DE', {
											day: '2-digit',
											month: '2-digit',
											year: 'numeric',
										})}
									</Text>
									<View
										style={[styles.separator, { backgroundColor: theme.colors.borderPrimary }]}
									/>
									<Text style={[styles.metaText, { color: theme.colors.textSecondary }]}>
										{slideCounts[item.id] || 0} {slideCounts[item.id] === 1 ? 'Slide' : 'Slides'}
									</Text>
								</View>

								<View
									style={[
										styles.imageContainer,
										{ backgroundColor: theme.colors.backgroundSecondary },
									]}
								>
									{firstSlideImages[item.id] ? (
										<Image
											source={{ uri: firstSlideImages[item.id] }}
											style={styles.thumbnail}
											resizeMode="cover"
										/>
									) : (
										<View style={styles.placeholderContainer}>
											<MaterialIcons name="image" size={48} color={theme.colors.textTertiary} />
										</View>
									)}
								</View>

								<View style={[styles.deckHeader, !isSmallScreen && styles.horizontalDeckHeader]}>
									<View
										style={[
											styles.titleContainer,
											!isSmallScreen && styles.horizontalTitleContainer,
										]}
									>
										<Text
											style={[
												styles.deckTitle,
												{ color: theme.colors.textPrimary },
												!isSmallScreen && { textAlign: 'center' },
											]}
											numberOfLines={1}
										>
											{item.title || item.name}
										</Text>
									</View>
								</View>
							</View>
						</MenuTrigger>
						<MenuContent>
							<View
								style={[
									styles.menuContent,
									{
										backgroundColor: theme.colors.backgroundPrimary,
										borderColor: theme.colors.borderPrimary,
									},
								]}
							>
								<MenuItem onSelect={() => onShareDeck(item)} textValue="Share">
									<Pressable
										style={({ hovered }) => [
											styles.menuItem,
											{
												backgroundColor: hovered
													? theme.colors.backgroundTertiary
													: theme.colors.backgroundPrimary,
											},
										]}
									>
										<MenuItemTitle>
											<View style={styles.menuItemContent}>
												<MaterialIcons
													name="share"
													size={18}
													color={theme.colors.textPrimary}
													style={styles.menuItemIcon}
												/>
												<Text style={[styles.menuItemTitle, { color: theme.colors.textPrimary }]}>
													Share
												</Text>
											</View>
										</MenuItemTitle>
									</Pressable>
								</MenuItem>
								<MenuItem onSelect={() => onDeleteDeck(item)} textValue="Delete">
									<Pressable
										style={({ hovered }) => [
											styles.menuItem,
											{
												backgroundColor: hovered
													? theme.colors.backgroundError
													: theme.colors.backgroundPrimary,
											},
										]}
									>
										<MenuItemTitle>
											<View style={styles.menuItemContent}>
												<MaterialIcons
													name="delete"
													size={18}
													color={theme.colors.error}
													style={styles.menuItemIcon}
												/>
												<Text style={[styles.menuItemTitle, { color: theme.colors.error }]}>
													Delete
												</Text>
											</View>
										</MenuItemTitle>
									</Pressable>
								</MenuItem>
							</View>
						</MenuContent>
					</MenuRoot>
				</View>
			</TouchableOpacity>
		);
	};

	return (
		<View style={styles.container}>
			<FlatList
				style={[styles.list, { backgroundColor: 'transparent' }]}
				data={[...decks, 'create']}
				renderItem={renderDeck}
				keyExtractor={(item) => (item === 'create' ? 'create' : item.id)}
				showsVerticalScrollIndicator={false}
				showsHorizontalScrollIndicator={false}
				horizontal={!isSmallScreen}
				contentContainerStyle={[
					styles.listContent,
					{
						backgroundColor: 'transparent',
						paddingHorizontal: 20,
						paddingTop: !isSmallScreen ? scrollPadding.horizontal.top : scrollPadding.vertical.top,
						paddingBottom: !isSmallScreen
							? scrollPadding.horizontal.bottom
							: scrollPadding.vertical.bottom,
					},
					!isSmallScreen && styles.horizontalListContent,
				]}
				scrollIndicatorInsets={{
					top: !isSmallScreen ? scrollPadding.horizontal.top : scrollPadding.vertical.top,
					bottom: !isSmallScreen ? scrollPadding.horizontal.bottom : scrollPadding.vertical.bottom,
				}}
				ItemSeparatorComponent={() => (
					<View
						style={{
							height: deckSpacing.vertical,
							width: deckSpacing.horizontal,
						}}
					/>
				)}
			/>
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	list: {
		flex: 1,
	},
	listContent: {
		padding: 8,
		gap: 16,
	},
	horizontalListContent: {
		padding: 8,
		gap: 16,
		flexDirection: 'row',
		alignItems: 'flex-start',
	},
	deckContainer: {},
	deckContent: {
		backgroundColor: 'transparent',
	},
	deckInfoContainer: {
		width: '100%',
		gap: 8,
	},
	metaInfo: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'flex-end',
		paddingHorizontal: 4,
		gap: 8,
	},
	metaText: {
		fontSize: 12,
		fontWeight: '500',
		textAlign: 'right',
	},
	separator: {
		width: 1,
		height: 12,
	},
	imageContainer: {
		width: '100%',
		aspectRatio: 16 / 9,
		borderRadius: 8,
		overflow: 'hidden',
	},
	thumbnail: {
		width: '100%',
		height: '100%',
	},
	placeholderContainer: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
	},
	deckHeader: {
		flexDirection: 'row',
		alignItems: 'center',
		marginTop: 12,
	},
	horizontalDeckHeader: {
		width: '100%',
		flexDirection: 'column',
		alignItems: 'center',
		marginTop: 12,
		gap: 8,
	},
	titleContainer: {
		flex: 1,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		width: '100%',
	},
	horizontalTitleContainer: {
		flexDirection: 'column',
		alignItems: 'center',
		gap: 4,
		width: '100%',
		position: 'relative',
	},
	actionsContainer: {
		flexDirection: 'row',
		justifyContent: 'flex-end',
		gap: 16,
	},
	horizontalActionsContainer: {
		position: 'absolute',
		top: 0,
		right: 0,
		width: 'auto',
	},
	deckTitle: {
		fontSize: 20,
		fontWeight: '600',
		flex: 1,
		marginRight: 16,
	},
	createDeckContent: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'center',
		gap: 8,
	},
	createDeckText: {
		fontSize: 16,
		fontWeight: '500',
	},
	emptyState: {
		justifyContent: 'center',
		alignItems: 'center',
		gap: 16,
	},
	emptyStateText: {
		fontSize: 18,
		fontWeight: '600',
	},
	emptyStateSubtext: {
		fontSize: 14,
	},
	createButton: {
		paddingHorizontal: 16,
		paddingVertical: 8,
		borderRadius: 8,
		flexDirection: 'row',
		alignItems: 'center',
		gap: 8,
	},
	createButtonText: {
		fontSize: 16,
		fontWeight: '600',
	},
	menuContent: {
		minWidth: 180,
		borderRadius: 8,
		borderWidth: 1,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.1,
		shadowRadius: 4,
		elevation: 4,
		overflow: 'hidden',
	},
	menuItem: {
		height: 44,
		paddingHorizontal: 16,
		justifyContent: 'center',
	},
	menuItemContent: {
		flexDirection: 'row',
		alignItems: 'center',
	},
	menuItemIcon: {
		marginRight: 12,
	},
	menuItemTitle: {
		fontSize: 16,
		fontWeight: '500',
	},
});
