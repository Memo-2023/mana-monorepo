import React from 'react';
import {
	View,
	FlatList,
	TouchableOpacity,
	Text,
	StyleSheet,
	Image,
	useWindowDimensions,
	Platform,
	Pressable,
} from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Slide } from '../../types/models';
import { useTheme } from '../ThemeProvider';
import { MenuRoot, MenuTrigger, MenuContent, MenuItem, MenuItemTitle } from '../common/menu';

interface SlideListProps {
	slides: Slide[];
	showNotes?: boolean;
	onEditSlide?: (slide: Slide) => void;
	onCreateSlide?: () => void;
	onDeleteSlide?: (slide: Slide) => void;
	onMoveSlide?: (slide: Slide, direction: 'up' | 'down') => void;
	loading?: boolean;
}

export const SlideList: React.FC<SlideListProps> = ({
	slides,
	showNotes = false,
	onEditSlide,
	onCreateSlide,
	onDeleteSlide,
	onMoveSlide,
	loading,
}) => {
	const { width } = useWindowDimensions();
	const { theme } = useTheme();
	const isSmallScreen = width < 768; // Tablet breakpoint

	// Calculate slide width to show 2.5 slides
	const slideWidth = !isSmallScreen ? Math.floor(width / 2.5) : 'auto';

	if (loading) {
		return (
			<View style={[styles.emptyState, { backgroundColor: theme.colors.backgroundPrimary }]}>
				<MaterialIcons name="hourglass-empty" size={48} color={theme.colors.textSecondary} />
				<Text style={[styles.emptyStateText, { color: theme.colors.textSecondary }]}>
					Loading...
				</Text>
			</View>
		);
	}

	const renderItem = ({ item, index }: { item: Slide | 'create'; index: number }) => {
		if (item === 'create') {
			return (
				<TouchableOpacity
					style={[
						styles.slideContainer,
						{
							width: slideWidth,
						},
					]}
					onPress={onCreateSlide}
				>
					<View style={styles.slideContent}>
						<View
							style={[styles.imageContainer, { backgroundColor: theme.colors.backgroundSecondary }]}
						>
							<View style={styles.placeholderContainer}>
								<MaterialIcons
									name="add-photo-alternate"
									size={48}
									color={theme.colors.textTertiary}
								/>
							</View>
						</View>
						<View style={styles.slideFooter}>
							<Text style={[styles.slideNumber, { color: theme.colors.textPrimary }]}>
								Neuen Slide erstellen
							</Text>
						</View>
					</View>
				</TouchableOpacity>
			);
		}

		return (
			<View
				style={[
					styles.slideContainer,
					{
						width: slideWidth,
					},
				]}
			>
				<MenuRoot>
					<MenuTrigger>
						<TouchableOpacity onPress={() => onEditSlide?.(item)} style={{ flex: 1 }}>
							<View style={styles.slideContent}>
								<View
									style={[
										styles.imageContainer,
										{ backgroundColor: theme.colors.backgroundSecondary },
									]}
								>
									{item.imageUrl ? (
										<Image
											source={{ uri: item.imageUrl }}
											style={styles.thumbnail}
											resizeMode="cover"
										/>
									) : (
										<View style={styles.placeholderContainer}>
											<MaterialIcons name="image" size={48} color={theme.colors.textTertiary} />
										</View>
									)}
								</View>
								<View style={styles.slideFooter}>
									<Text style={[styles.slideNumber, { color: theme.colors.textPrimary }]}>
										{item.title || `Slide ${index + 1}`}
									</Text>
								</View>
								{showNotes && item.notes && (
									<Text
										style={[styles.notes, { color: theme.colors.textSecondary }]}
										numberOfLines={2}
									>
										{item.notes}
									</Text>
								)}
							</View>
						</TouchableOpacity>
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
							{onMoveSlide && index > 0 && (
								<MenuItem
									onSelect={() => {
										console.log('[SlideList] Selected Move Up for slide:', item.id);
										onMoveSlide(item, 'up');
									}}
									textValue="Move Up"
								>
									<Pressable
										onPress={() => {
											console.log('[SlideList] Pressed Move Up for slide:', item.id);
											onMoveSlide(item, 'up');
										}}
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
													name="arrow-upward"
													size={18}
													color={theme.colors.textPrimary}
													style={styles.menuItemIcon}
												/>
												<Text style={[styles.menuItemTitle, { color: theme.colors.textPrimary }]}>
													Nach oben
												</Text>
											</View>
										</MenuItemTitle>
									</Pressable>
								</MenuItem>
							)}
							{onMoveSlide && index < slides.length - 1 && (
								<MenuItem
									onSelect={() => {
										console.log('[SlideList] Selected Move Down for slide:', item.id);
										onMoveSlide(item, 'down');
									}}
									textValue="Move Down"
								>
									<Pressable
										onPress={() => {
											console.log('[SlideList] Pressed Move Down for slide:', item.id);
											onMoveSlide(item, 'down');
										}}
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
													name="arrow-downward"
													size={18}
													color={theme.colors.textPrimary}
													style={styles.menuItemIcon}
												/>
												<Text style={[styles.menuItemTitle, { color: theme.colors.textPrimary }]}>
													Nach unten
												</Text>
											</View>
										</MenuItemTitle>
									</Pressable>
								</MenuItem>
							)}
							{onDeleteSlide && (
								<MenuItem onSelect={() => onDeleteSlide(item)} textValue="Delete">
									<Pressable
										onPress={() => onDeleteSlide(item)}
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
													Löschen
												</Text>
											</View>
										</MenuItemTitle>
									</Pressable>
								</MenuItem>
							)}
						</View>
					</MenuContent>
				</MenuRoot>
			</View>
		);
	};

	if (slides.length === 0) {
		return (
			<View style={styles.emptyContainer}>
				<View style={styles.emptyState}>
					<MaterialIcons name="slideshow" size={48} color={theme.colors.textSecondary} />
					<Text style={[styles.emptyStateText, { color: theme.colors.textSecondary }]}>
						Keine Slides
					</Text>
					<Text style={[styles.emptyStateSubtext, { color: theme.colors.textSecondary }]}>
						Erstelle deinen ersten Slide
					</Text>
				</View>
				<TouchableOpacity
					style={[
						styles.slideContainer,
						{
							width: slideWidth,
						},
					]}
					onPress={onCreateSlide}
				>
					<View style={styles.slideContent}>
						<View
							style={[styles.imageContainer, { backgroundColor: theme.colors.backgroundSecondary }]}
						>
							<View style={styles.placeholderContainer}>
								<MaterialIcons
									name="add-photo-alternate"
									size={48}
									color={theme.colors.textTertiary}
								/>
							</View>
						</View>
						<View style={styles.slideFooter}>
							<Text style={[styles.slideNumber, { color: theme.colors.textPrimary }]}>
								Erstelle deinen ersten Slide
							</Text>
						</View>
					</View>
				</TouchableOpacity>
			</View>
		);
	}

	return (
		<View style={styles.container}>
			<FlatList
				data={[...slides, 'create']}
				renderItem={renderItem}
				keyExtractor={(item) => (item === 'create' ? 'create' : item.id)}
				horizontal={!isSmallScreen}
				showsHorizontalScrollIndicator={false}
				contentContainerStyle={[styles.listContent, !isSmallScreen && { paddingHorizontal: 16 }]}
				extraData={slides.map((s) => s.order).join(',')}
			/>
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	listContent: {
		paddingBottom: 100,
	},
	horizontalListContent: {
		flexGrow: 1,
		paddingHorizontal: 16,
		gap: 16,
		alignItems: 'center',
		minHeight: '100%',
	},
	slideContainer: {
		marginHorizontal: 16,
		marginVertical: 8,
	},
	slideContent: {
		gap: 8,
	},
	imageContainer: {
		width: '100%',
		height: undefined,
		aspectRatio: 16 / 9,
		borderRadius: 4,
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
	slideFooter: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		marginTop: 0,
	},
	slideNumber: {
		fontSize: 18,
		fontWeight: '600',
	},
	actionButtons: {
		flexDirection: 'row',
		gap: 8,
	},
	actionButton: {
		width: 32,
		height: 32,
		borderRadius: 16,
		justifyContent: 'center',
		alignItems: 'center',
	},
	notes: {
		fontSize: 14,
		marginTop: 4,
	},
	emptyState: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		padding: 20,
	},
	emptyStateText: {
		fontSize: 20,
		fontWeight: '600',
		marginTop: 16,
	},
	emptyStateSubtext: {
		fontSize: 14,
		marginTop: 8,
	},
	emptyContainer: {
		flex: 1,
		justifyContent: 'space-between',
		paddingBottom: 32,
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
