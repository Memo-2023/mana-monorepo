import React from 'react';
import { View, Pressable, Share, Platform, Alert } from 'react-native';
import Text from '~/components/Text';
import { LinearGradient } from 'expo-linear-gradient';
import { Icon } from '~/components/Icon';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import * as Clipboard from 'expo-clipboard';
import type { Author } from '@quote/shared';
import { useThemeStore, useIsDarkMode } from '~/store/settingsStore';
import { useTheme } from '~/hooks/useTheme';
import { AuthorAvatar } from '~/components/authors/AuthorAvatar';
import { useQuotesStore } from '~/store/quotesStore';
import FavoriteButton from '~/components/common/FavoriteButton';
import Animated, {
	useAnimatedStyle,
	useSharedValue,
	withSpring,
	FadeInRight,
	FadeInUp,
	interpolate,
	Extrapolate,
	SharedValue,
} from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';

export type AuthorCardVariant = 'simple' | 'enhanced' | 'vertical';

interface AuthorCardProps {
	author: Author;
	onPress?: (author: Author) => void;
	index?: number;
	variant?: AuthorCardVariant;
	isFavorite?: boolean;
	onToggleFavorite?: (authorId: string) => void;
	// For vertical variant
	scrollY?: SharedValue<number>;
	cardHeight?: number;
}

function AuthorCard({
	author,
	onPress,
	index = 0,
	variant = 'simple',
	isFavorite,
	onToggleFavorite,
	scrollY,
	cardHeight = 300,
}: AuthorCardProps) {
	const router = useRouter();
	const { t } = useTranslation();
	const { enableHaptics } = useThemeStore();
	const isDarkMode = useIsDarkMode();
	const { getCategoryGradient } = useTheme();
	const { toggleAuthorFavorite, isAuthorFavorite } = useQuotesStore();

	const scale = useSharedValue(1);

	// Use prop or store value for favorite status
	const favoriteStatus = isFavorite !== undefined ? isFavorite : isAuthorFavorite(author.id);
	const handleFavoriteToggle = onToggleFavorite || (() => toggleAuthorFavorite(author.id));

	const handlePressIn = () => {
		if (variant === 'enhanced') {
			scale.value = withSpring(0.98);
		}
	};

	const handlePressOut = () => {
		if (variant === 'enhanced') {
			scale.value = withSpring(1);
		}
	};

	const handlePress = () => {
		if (enableHaptics) {
			Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
		}

		if (onPress) {
			onPress(author);
		} else {
			router.push(`/author/${author.id}`);
		}
	};

	const handleFavoritePress = () => {
		handleFavoriteToggle(author.id);
	};

	const handleShare = async () => {
		try {
			await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

			const authorInfo = `${author.name}${author.lifeYears ? ` (${author.lifeYears})` : ''}\n${author.profession?.join(', ') || ''}\n\n${author.bio || ''}`;

			const result = await Share.share({
				message: authorInfo,
				title: author.name,
			});

			if (result.action === Share.sharedAction) {
				await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
			}
		} catch (error) {
			Alert.alert(t('common.shareError'), t('common.shareErrorMessage'));
		}
	};

	const handleCopyToClipboard = async () => {
		try {
			await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

			const authorInfo = `${author.name}${author.lifeYears ? ` (${author.lifeYears})` : ''}\n${author.profession?.join(', ') || ''}`;
			await Clipboard.setStringAsync(authorInfo);

			await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

			if (Platform.OS === 'ios') {
				Alert.alert(t('common.copied'), '', [{ text: 'OK' }], {
					userInterfaceStyle: 'dark',
				});
			}
		} catch (error) {
			Alert.alert(t('common.copyError'), t('common.copyErrorMessage'));
		}
	};

	const animatedStyle = useAnimatedStyle(() => ({
		transform: [{ scale: scale.value }],
	}));

	const verticalAnimatedStyle = useAnimatedStyle(() => {
		if (variant !== 'vertical' || !scrollY) {
			return {};
		}

		const cardPosition = index * cardHeight;
		const inputRange = [cardPosition - cardHeight, cardPosition, cardPosition + cardHeight];

		const opacity = interpolate(scrollY.value, inputRange, [0.3, 1, 0.3], Extrapolate.CLAMP);

		const cardScale = interpolate(scrollY.value, inputRange, [0.85, 1, 0.85], Extrapolate.CLAMP);

		return {
			opacity,
			transform: [{ scale: cardScale }],
		};
	});

	const getLifeYears = () => {
		if (!author.lifespan) return null;
		const birth = author.lifespan.birth?.substring(0, 4);
		const death = author.lifespan.death?.substring(0, 4);

		if (birth && death) {
			return `${birth} – ${death}`;
		}
		if (birth) {
			return variant === 'enhanced' ? `${t('authors.born')} ${birth}` : birth;
		}
		return null;
	};

	// Gradient basierend auf Featured-Status oder Profession
	const getGradientColors = () => {
		if (author.featured) {
			return ['#f59e0b', '#ef4444']; // Amber to Red for featured
		}
		// Use profession to determine gradient
		const profession = author.profession?.[0]?.toLowerCase() || '';
		if (profession.includes('philosoph')) {
			return ['#9333ea', '#6366f1']; // Purple to Indigo
		} else if (profession.includes('dichter') || profession.includes('poet')) {
			return ['#ec4899', '#f43f5e']; // Pink to Rose
		} else if (profession.includes('wissenschaft')) {
			return ['#3b82f6', '#06b6d4']; // Blue to Cyan
		} else if (profession.includes('schrift')) {
			return ['#10b981', '#14b8a6']; // Emerald to Teal
		}
		return ['#6366f1', '#8b5cf6']; // Default: Indigo to Violet
	};

	const renderSimpleCard = () => (
		<Animated.View
			entering={FadeInRight.delay(index * 50)
				.duration(600)
				.springify()}
			className="px-6 mb-4"
		>
			<Pressable onPress={handlePress}>
				<LinearGradient
					colors={isDarkMode ? ['#1e293b', '#334155'] : ['#334155', '#1e293b']}
					start={{ x: 0, y: 0 }}
					end={{ x: 1, y: 1 }}
					style={{
						borderRadius: 16,
						padding: 1,
					}}
				>
					<View className="bg-black/40 rounded-2xl backdrop-blur-xl">
						<View className="p-4">
							<View className="flex-row items-center">
								<AuthorAvatar
									name={author.name}
									imageUrl={author.image?.thumbnail || author.image?.full}
									size="medium"
								/>

								<View className="flex-1 ml-4">
									<View className="flex-row items-center justify-between">
										<View className="flex-1 mr-2">
											<Text variant="bodyLarge" weight="semibold" style={{ color: 'white' }}>
												{author.name}
											</Text>

											{author.lifespan && (
												<Text
													variant="caption"
													className="mt-0.5"
													style={{ color: 'rgba(255,255,255,0.6)' }}
												>
													{getLifeYears()}
												</Text>
											)}

											{author.profession && author.profession.length > 0 && (
												<Text
													variant="caption"
													className="mt-1"
													style={{ color: 'rgba(255,255,255,0.6)' }}
												>
													{author.profession[0]}
												</Text>
											)}
										</View>

										{/* Action Buttons */}
										<View className="flex-row items-center gap-3">
											{/* Copy Button */}
											<Pressable
												onPress={handleCopyToClipboard}
												hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
											>
												<Icon name="copy-outline" size={22} color="rgba(255,255,255,0.8)" />
											</Pressable>

											{/* Share Button */}
											<Pressable
												onPress={handleShare}
												hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
											>
												<Icon name="share-outline" size={22} color="rgba(255,255,255,0.8)" />
											</Pressable>

											{/* Favorite Button */}
											<FavoriteButton
												isFavorite={favoriteStatus}
												onToggle={handleFavoritePress}
												size={24}
											/>
										</View>
									</View>
								</View>
							</View>
						</View>
					</View>
				</LinearGradient>
			</Pressable>
		</Animated.View>
	);

	const renderEnhancedCard = () => (
		<Animated.View style={animatedStyle}>
			<Pressable onPress={handlePress} onPressIn={handlePressIn} onPressOut={handlePressOut}>
				<LinearGradient
					colors={getGradientColors()}
					start={{ x: 0, y: 0 }}
					end={{ x: 1, y: 1 }}
					style={{
						borderRadius: 24,
						padding: 1.5,
					}}
				>
					<View className="bg-black/40 rounded-3xl backdrop-blur-xl">
						<View className="p-5">
							{/* Main Content */}
							<View className="flex-row items-center">
								{/* Avatar */}
								<View className="mr-4">
									<AuthorAvatar
										name={author.name}
										imageUrl={author.image?.thumbnail}
										size="medium"
									/>
								</View>

								{/* Author Info */}
								<View className="flex-1">
									<Text variant="h4" weight="medium" className="mb-1" style={{ color: 'white' }}>
										{author.name}
									</Text>

									{/* Lebensjahre */}
									{getLifeYears() && (
										<Text variant="bodySmall" style={{ color: 'rgba(255,255,255,0.7)' }}>
											{getLifeYears()}
										</Text>
									)}
								</View>

								{/* Arrow */}
								<View className="ml-2">
									<Icon name="chevron-forward" size={25} color="rgba(255,255,255,0.5)" />
								</View>
							</View>

							{/* Bio wenn vorhanden */}
							{author.biography?.short && (
								<View className="border-t border-white/10 mt-4 pt-3">
									<Text
										variant="bodySmall"
										className="leading-relaxed"
										numberOfLines={2}
										style={{ color: 'rgba(255,255,255,0.7)' }}
									>
										{author.biography.short}
									</Text>
								</View>
							)}

							{/* Professions und Action Buttons */}
							<View className="flex-row items-end justify-between mt-3">
								{/* Professions links */}
								<View className="flex-1 flex-row flex-wrap">
									{author.profession && author.profession.length > 0 && (
										<>
											{author.profession.slice(0, 2).map((prof, idx) => (
												<View key={idx} className="bg-white/10 px-2.5 py-1 rounded-full mr-2 mb-2">
													<Text variant="caption" className="opacity-70" style={{ color: 'white' }}>
														{prof}
													</Text>
												</View>
											))}
											{author.profession.length > 2 && (
												<Text
													variant="caption"
													className="self-center"
													style={{ color: 'rgba(255,255,255,0.5)' }}
												>
													+{author.profession.length - 2}
												</Text>
											)}
										</>
									)}
								</View>

								{/* Action Buttons rechts */}
								<View className="flex-row items-center gap-3">
									{/* Copy Button */}
									<Pressable
										onPress={handleCopyToClipboard}
										hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
									>
										<Icon name="copy-outline" size={22} color="rgba(255,255,255,0.7)" />
									</Pressable>

									{/* Share Button */}
									<Pressable
										onPress={handleShare}
										hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
									>
										<Icon name="share-outline" size={22} color="rgba(255,255,255,0.7)" />
									</Pressable>

									{/* Favorite Button */}
									<FavoriteButton
										isFavorite={favoriteStatus}
										onToggle={handleFavoritePress}
										size={24}
									/>
								</View>
							</View>
						</View>
					</View>
				</LinearGradient>
			</Pressable>
		</Animated.View>
	);

	if (variant === 'vertical') {
		return (
			<View
				style={{
					height: cardHeight,
					justifyContent: 'center',
					alignItems: 'center',
					paddingHorizontal: 16,
				}}
			>
				<Animated.View style={[verticalAnimatedStyle, { width: '100%', maxWidth: 400 }]}>
					{renderEnhancedCard()}
				</Animated.View>
			</View>
		);
	}

	if (variant === 'enhanced') {
		return renderEnhancedCard();
	}

	return renderSimpleCard();
}

// Optimierung mit React.memo
export default React.memo(AuthorCard, (prevProps, nextProps) => {
	return (
		prevProps.author.id === nextProps.author.id &&
		prevProps.variant === nextProps.variant &&
		prevProps.isFavorite === nextProps.isFavorite
	);
});
