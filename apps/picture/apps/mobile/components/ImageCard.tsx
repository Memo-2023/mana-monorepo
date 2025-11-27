import { Pressable, View, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import ContextMenu from 'react-native-context-menu-view';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '~/contexts/ThemeContext';
import { Text } from '~/components/Text';
import { Button } from '~/components/Button';
import { Tag } from '~/store/tagStore';
import { usePromptStore } from '~/store/promptStore';
import { LAYOUT } from '~/constants';
import { getThumbnailUrl, getSizeForViewMode } from '~/utils/image';

const { width } = Dimensions.get('window');

type ImageCardProps = {
	id: string;
	publicUrl: string | null;
	prompt: string;
	createdAt: string;
	isFavorite?: boolean;
	model?: string;
	tags?: Tag[];
	viewMode: 'single' | 'grid3' | 'grid5';
	blurhash?: string | null;
	isGenerating?: boolean; // New prop for generating state

	// Gallery mode props
	onToggleFavorite?: () => void;

	// Explore mode props
	creatorUsername?: string;
	likesCount?: number;
	userHasLiked?: boolean;
	onToggleLike?: () => void;
};

export function ImageCard({
	id,
	publicUrl,
	prompt,
	createdAt,
	isFavorite,
	model,
	tags,
	viewMode,
	blurhash,
	isGenerating,
	onToggleFavorite,
	creatorUsername,
	likesCount,
	userHasLiked,
	onToggleLike,
}: ImageCardProps) {
	const { theme } = useTheme();
	const { setPrompt } = usePromptStore();
	const isSingleColumn = viewMode === 'single';
	const isGalleryMode = !!onToggleFavorite;

	// Get appropriate thumbnail URL based on view mode
	const thumbnailUrl = getThumbnailUrl(publicUrl, getSizeForViewMode(viewMode));

	// Get tiny thumbnail for progressive loading (blur-up effect)
	const tinyThumbnailUrl = getThumbnailUrl(publicUrl, 'tiny');

	// Calculate image size based on view mode
	const getImageSize = () => {
		const spacing = 4; // Minimal spacing between items
		switch (viewMode) {
			case 'single':
				return width - spacing * 2; // Minimal outer padding
			case 'grid3':
				return (width - spacing * 4) / 3; // Left + right + 2 gaps
			case 'grid5':
				return (width - spacing * 6) / 5; // Left + right + 4 gaps
			default:
				return width - spacing * 2;
		}
	};

	const imageSize = getImageSize();

	// Format model name for display
	const formatModelName = (modelName?: string) => {
		if (!modelName) return 'Unbekannt';

		// Remove common prefixes and clean up
		const cleaned = modelName
			.replace(/^(black-forest-labs\/|bytedance\/|lucataco\/|stability-ai\/)/, '')
			.replace(/-/g, ' ')
			.split(' ')
			.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
			.join(' ');

		return cleaned;
	};

	// Context menu actions
	const contextMenuActions = isGalleryMode
		? [
				{
					title: isFavorite ? 'Von Favoriten entfernen' : 'Zu Favoriten hinzufügen',
					systemIcon: isFavorite ? 'heart.fill' : 'heart',
				},
				{
					title: 'Teilen',
					systemIcon: 'square.and.arrow.up',
				},
				{
					title: 'Details anzeigen',
					systemIcon: 'info.circle',
				},
				{
					title: new Date(createdAt).toLocaleDateString('de-DE', {
						day: '2-digit',
						month: '2-digit',
						year: 'numeric',
					}),
					systemIcon: 'calendar',
					disabled: true,
				},
				{
					title: formatModelName(model),
					systemIcon: 'cpu',
					disabled: true,
				},
			]
		: [
				// Explore mode actions
				{
					title: userHasLiked ? 'Like entfernen' : 'Liken',
					systemIcon: userHasLiked ? 'heart.fill' : 'heart',
				},
				{
					title: 'Teilen',
					systemIcon: 'square.and.arrow.up',
				},
				{
					title: 'Details anzeigen',
					systemIcon: 'info.circle',
				},
				{
					title: `von ${creatorUsername || 'Anonym'}`,
					systemIcon: 'person',
					disabled: true,
				},
				{
					title: new Date(createdAt).toLocaleDateString('de-DE', {
						day: '2-digit',
						month: '2-digit',
						year: 'numeric',
					}),
					systemIcon: 'calendar',
					disabled: true,
				},
				{
					title: formatModelName(model),
					systemIcon: 'cpu',
					disabled: true,
				},
			];

	const handleContextMenu = (e: any) => {
		const index = e.nativeEvent.index;

		if (isGalleryMode) {
			switch (index) {
				case 0: // Toggle favorite
					onToggleFavorite?.();
					break;
				case 1: // Share
					// TODO: Implement share functionality
					console.log('Share image:', id);
					break;
				case 2: // View details
					router.push(`/image/${id}`);
					break;
			}
		} else {
			// Explore mode
			switch (index) {
				case 0: // Toggle like
					onToggleLike?.();
					break;
				case 1: // Share
					// TODO: Implement share functionality
					console.log('Share image:', id);
					break;
				case 2: // View details
					router.push(`/image/${id}`);
					break;
			}
		}
	};

	const CardContent = isSingleColumn ? (
		// Single Column: Image and info as separate elements
		<Pressable
			style={{
				width: imageSize,
				margin: 0,
				marginHorizontal: 4,
				marginBottom: 24,
			}}
			onPress={() => router.push(`/image/${id}`)}
		>
			{/* Image Container */}
			<View
				style={{
					backgroundColor: theme.colors.surface,
					borderRadius: 8,
					overflow: 'hidden',
					width: imageSize,
					height: imageSize,
				}}
			>
				{/* Show loading state for generating images */}
				{isGenerating ? (
					<View
						style={{
							width: imageSize,
							height: imageSize,
							justifyContent: 'center',
							alignItems: 'center',
							backgroundColor: theme.colors.input,
						}}
					>
						<Ionicons name="hourglass-outline" size={32} color={theme.colors.text.tertiary} />
						<Text
							variant="body"
							color="tertiary"
							align="center"
							style={{ paddingHorizontal: 8, marginTop: 8 }}
						>
							Generiere...
						</Text>
					</View>
				) : thumbnailUrl ? (
					<Image
						source={{ uri: thumbnailUrl }}
						style={{ width: imageSize, height: imageSize }}
						contentFit="cover"
						transition={200}
						cachePolicy="memory-disk"
						placeholder={
							tinyThumbnailUrl
								? { uri: tinyThumbnailUrl } // Progressive: Show tiny thumbnail first
								: { blurhash: blurhash || 'L5H2EC=PM+yV0g-mq.wG9c010J}I' } // Fallback to BlurHash
						}
						placeholderContentFit="cover"
					/>
				) : (
					<View
						style={{
							width: imageSize,
							height: imageSize,
							justifyContent: 'center',
							alignItems: 'center',
							backgroundColor: theme.colors.input,
						}}
					>
						<Text variant="body" color="tertiary" align="center" style={{ paddingHorizontal: 8 }}>
							{prompt.substring(0, 50)}...
						</Text>
					</View>
				)}
			</View>

			{/* Info below image - outside the image container */}
			<View
				style={{
					paddingTop: 12,
					paddingHorizontal: 4,
				}}
			>
				{/* Prompt with Author/Favorite/Likes */}
				<View
					style={{
						flexDirection: 'row',
						alignItems: 'center',
						justifyContent: 'space-between',
						gap: 8,
					}}
				>
					<Pressable
						onPress={(e) => {
							if (isGalleryMode) {
								e.stopPropagation();
								setPrompt(prompt);
							}
						}}
						style={{ flex: 1, marginRight: 8 }}
					>
						<Text variant="body" weight="semibold" numberOfLines={1}>
							{prompt}
						</Text>
					</Pressable>

					{/* Gallery Mode: Favorite Badge */}
					{isGalleryMode && isFavorite && (
						<Ionicons name="heart" size={16} color={theme.colors.text.secondary} />
					)}

					{/* Explore Mode: Author Name and Likes */}
					{!isGalleryMode && (
						<View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flexShrink: 0 }}>
							<Text variant="body" color="secondary" numberOfLines={1}>
								{creatorUsername || 'Anonym'}
							</Text>

							<Button
								icon={userHasLiked ? 'heart' : 'heart-outline'}
								iconSize={16}
								iconColor={userHasLiked ? '#ef4444' : theme.colors.text.secondary}
								variant="ghost"
								onPress={(e) => {
									e?.stopPropagation();
									onToggleLike?.();
								}}
								className="p-0"
							>
								<Text style={{ color: theme.colors.text.secondary, fontSize: 12, marginLeft: 4 }}>
									{likesCount || 0}
								</Text>
							</Button>
						</View>
					)}
				</View>
			</View>
		</Pressable>
	) : (
		// Grid View: Original layout with overlays
		<Pressable
			style={{
				backgroundColor: theme.colors.surface,
				borderRadius: viewMode === 'grid5' ? 4 : 8,
				overflow: 'hidden',
				width: imageSize,
				height: imageSize,
				margin: 2,
			}}
			onPress={() => router.push(`/image/${id}`)}
		>
			{/* Show loading state for generating images */}
			{isGenerating ? (
				<View
					style={{
						width: imageSize,
						height: imageSize,
						justifyContent: 'center',
						alignItems: 'center',
						backgroundColor: theme.colors.input,
					}}
				>
					<Ionicons
						name="hourglass-outline"
						size={viewMode === 'grid5' ? 20 : 32}
						color={theme.colors.text.tertiary}
					/>
					{viewMode !== 'grid5' && (
						<Text
							variant="body"
							color="tertiary"
							align="center"
							style={{ paddingHorizontal: 8, marginTop: 8 }}
						>
							Generiere...
						</Text>
					)}
				</View>
			) : thumbnailUrl ? (
				<Image
					source={{ uri: thumbnailUrl }}
					style={{ width: imageSize, height: imageSize }}
					contentFit="cover"
					transition={200}
					cachePolicy="memory-disk"
					placeholder={
						tinyThumbnailUrl
							? { uri: tinyThumbnailUrl } // Progressive: Show tiny thumbnail first
							: { blurhash: blurhash || 'L5H2EC=PM+yV0g-mq.wG9c010J}I' } // Fallback to BlurHash
					}
					placeholderContentFit="cover"
				/>
			) : (
				<View
					style={{
						width: imageSize,
						height: imageSize,
						justifyContent: 'center',
						alignItems: 'center',
						backgroundColor: theme.colors.input,
					}}
				>
					<Text variant="body" color="tertiary" align="center" style={{ paddingHorizontal: 8 }}>
						{prompt.substring(0, 50)}...
					</Text>
				</View>
			)}

			{/* Explore Mode Grid: Creator and Like Info - hide in grid5 */}
			{!isGalleryMode && viewMode !== 'grid5' && (
				<View
					style={{
						position: 'absolute',
						left: 0,
						right: 0,
						bottom: 0,
						backgroundColor: 'rgba(0, 0, 0, 0.7)',
						padding: viewMode === 'grid3' ? 4 : 8,
					}}
				>
					<View
						style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}
					>
						<View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
							<Text
								variant="bodySmall"
								color="inverse"
								style={{
									marginLeft: viewMode === 'grid3' ? 2 : 4,
									fontSize: viewMode === 'grid3' ? 10 : 12,
								}}
								numberOfLines={1}
							>
								{creatorUsername || 'Anonym'}
							</Text>
						</View>

						<Button
							icon={userHasLiked ? 'heart' : 'heart-outline'}
							iconSize={viewMode === 'grid3' ? 14 : 18}
							iconColor={userHasLiked ? '#ef4444' : '#9CA3AF'}
							variant="ghost"
							onPress={(e) => {
								e?.stopPropagation();
								onToggleLike?.();
							}}
							className="p-0"
						>
							<Text
								style={{
									color: '#D1D5DB',
									fontSize: viewMode === 'grid3' ? 10 : 12,
									marginLeft: viewMode === 'grid3' ? 2 : 4,
								}}
							>
								{likesCount || 0}
							</Text>
						</Button>
					</View>
				</View>
			)}

			{/* Favorite Badge - Gallery Mode Only - Top Right */}
			{isGalleryMode && isFavorite && (
				<View
					style={{
						position: 'absolute',
						top: 8,
						right: 8,
						backgroundColor: 'rgba(0, 0, 0, 0.6)',
						borderRadius: 999,
						padding: viewMode === 'grid5' ? 4 : 6,
					}}
				>
					<Ionicons name="heart" size={viewMode === 'grid5' ? 12 : 16} color="white" />
				</View>
			)}

			{/* Tags Preview - only in grid mode, hide in grid5 to save space */}
			{viewMode !== 'grid5' && tags && tags.length > 0 && (
				<View
					style={{
						position: 'absolute',
						top: 8,
						left: 8,
						right: 8,
						flexDirection: 'row',
						flexWrap: 'wrap',
					}}
				>
					{tags.slice(0, viewMode === 'grid3' ? 1 : 2).map((tag) => (
						<View
							key={tag.id}
							style={{
								paddingHorizontal: 8,
								paddingVertical: 2,
								borderRadius: 12,
								marginRight: 4,
								marginBottom: 4,
								backgroundColor: `${tag.color}40`,
							}}
						>
							<Text style={{ fontSize: viewMode === 'grid3' ? 10 : 12, color: tag.color }}>
								#{tag.name}
							</Text>
						</View>
					))}
					{tags.length > (viewMode === 'grid3' ? 1 : 2) && (
						<View
							style={{
								paddingHorizontal: 8,
								paddingVertical: 2,
								borderRadius: 12,
								backgroundColor: '#1F2937',
							}}
						>
							<Text style={{ fontSize: viewMode === 'grid3' ? 10 : 12, color: '#9CA3AF' }}>
								+{tags.length - (viewMode === 'grid3' ? 1 : 2)}
							</Text>
						</View>
					)}
				</View>
			)}
		</Pressable>
	);

	// Wrap all cards with context menu (both gallery and explore mode)
	return (
		<ContextMenu
			actions={contextMenuActions}
			onPress={handleContextMenu}
			previewBackgroundColor="transparent"
		>
			{CardContent}
		</ContextMenu>
	);
}
