import React from 'react';
import { View, Pressable, ViewStyle, TextInput } from 'react-native';
import Text from './Text';
import { LinearGradient } from 'expo-linear-gradient';
import { Icon } from './Icon';
import * as Haptics from 'expo-haptics';
import Animated, {
	useAnimatedStyle,
	useSharedValue,
	withSpring,
	FadeInUp,
	FadeInDown,
	interpolate,
	Extrapolate,
	SharedValue,
} from 'react-native-reanimated';
import type { EnhancedQuote } from '@zitare/shared';
import { useTheme } from '~/hooks/useTheme';
import { useTranslation } from 'react-i18next';
import { useShare } from '~/hooks/useShare';
import QuickAddToList from './QuickAddToList';
import FavoriteButton from './common/FavoriteButton';

export type QuoteCardVariant = 'simple' | 'daily' | 'vertical' | 'author-detail' | 'edit';

interface QuoteCardProps {
	quote: EnhancedQuote;
	onToggleFavorite: (id: string) => void;
	onAuthorPress?: () => void;
	onEdit?: () => void;
	onDelete?: () => void;
	onPress?: () => void;
	variant?: QuoteCardVariant;
	// For vertical variant
	index?: number;
	scrollY?: SharedValue<number>;
	cardHeight?: number;
	// Show date instead of author (for author detail pages)
	showDate?: boolean;
	// For edit mode
	editMode?: boolean;
	onTextChange?: (text: string) => void;
	onAuthorChange?: (author: string) => void;
	onCategoryChange?: (categories: string) => void;
	onSave?: () => void;
	onCancel?: () => void;
}

function QuoteCard({
	quote,
	onToggleFavorite,
	onAuthorPress,
	onEdit,
	onDelete,
	onPress,
	variant = 'simple',
	index = 0,
	scrollY,
	cardHeight = 300,
	showDate = false,
	editMode = false,
	onTextChange,
	onAuthorChange,
	onCategoryChange,
	onSave,
	onCancel,
}: QuoteCardProps) {
	const { t } = useTranslation();
	const scale = useSharedValue(1);
	const { shareQuote, copyQuoteToClipboard } = useShare();

	// Safety check: return null if quote is invalid
	if (!quote || !quote.id || !quote.text) {
		console.warn('[QuoteCard] Attempted to render invalid quote:', quote);
		return null;
	}

	const handleFavorite = () => {
		if (!quote || !quote.id) {
			console.warn('[QuoteCard] Attempted to toggle favorite on invalid quote:', quote);
			return;
		}
		onToggleFavorite(quote.id);
	};

	const handlePress = () => {
		if (onPress) {
			Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
			scale.value = withSpring(0.95, {}, () => {
				scale.value = withSpring(1);
			});
			onPress();
		}
	};

	const handleShare = () => shareQuote(quote);
	const handleCopyToClipboard = () => copyQuoteToClipboard(quote);

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

		const scale = interpolate(scrollY.value, inputRange, [0.85, 1, 0.85], Extrapolate.CLAMP);

		return {
			opacity,
			transform: [{ scale }],
		};
	});

	const { getCategoryGradient, getDailyCardGradient } = useTheme();

	const getGradientColors = () => {
		if (variant === 'daily') {
			return getDailyCardGradient();
		}
		const category = quote.categories?.[0];
		return getCategoryGradient(category);
	};

	const getQuoteMetadata = () => {
		if (quote.year && quote.source) {
			return `${quote.source} (${quote.year})`;
		} else if (quote.year) {
			return quote.year.toString();
		} else if (quote.source) {
			return quote.source;
		}
		return null;
	};

	const isDaily = variant === 'daily';
	const isVertical = variant === 'vertical';

	const cardContent = (
		<LinearGradient
			colors={getGradientColors()}
			start={{ x: 0, y: 0 }}
			end={{ x: 1, y: 1 }}
			style={{
				borderRadius: isDaily ? 32 : 24,
				padding: 1,
			}}
		>
			<View
				className={`${isDaily ? 'bg-black/30 rounded-[31px]' : 'bg-black/40 rounded-3xl'} backdrop-blur-xl`}
			>
				<View className={isDaily ? 'p-5' : 'p-6'}>
					{/* Quote Text */}
					{editMode ? (
						<TextInput
							value={quote.text}
							onChangeText={onTextChange}
							placeholder={t('myQuotes.placeholder')}
							placeholderTextColor="rgba(255,255,255,0.4)"
							multiline
							style={{
								fontFamily: 'Georgia',
								fontSize: 22,
								lineHeight: 32,
								color: 'white',
								fontWeight: '300',
								letterSpacing: 0.3,
								minHeight: 80,
								textAlignVertical: 'top',
								paddingVertical: 0,
							}}
							className="mb-4"
							autoFocus
						/>
					) : (
						<Text
							style={{
								fontFamily: 'Georgia',
								fontSize: isDaily ? 24 : 22,
								lineHeight: isDaily ? 34 : 32,
								color: 'white',
								fontWeight: '300',
								letterSpacing: 0.3,
							}}
							className={isDaily ? 'mb-4' : 'mb-4'}
						>
							"{quote.text}"
						</Text>
					)}

					{/* Source Info wenn vorhanden */}
					{!isDaily && quote.source && (
						<Text variant="caption" className="mb-3" style={{ color: 'rgba(255,255,255,0.6)' }}>
							{t('quotes.from')}: {quote.source} {quote.year && `(${quote.year})`}
						</Text>
					)}

					{/* Author mit Divider */}
					<View className={`border-t border-white/10 ${isDaily ? 'pt-4' : 'pt-3'}`}>
						<Pressable onPress={onAuthorPress}>
							<View className="flex-row items-center justify-between">
								<View>
									{editMode ? (
										<>
											<TextInput
												value={quote.author?.name || ''}
												onChangeText={onAuthorChange}
												placeholder="Autor"
												placeholderTextColor="rgba(255,255,255,0.4)"
												style={{
													fontSize: 16,
													color: 'white',
													fontWeight: '500',
													paddingVertical: 2,
												}}
											/>
											<TextInput
												value={quote.categories?.join(', ') || ''}
												onChangeText={onCategoryChange}
												placeholder="Kategorien (kommagetrennt)"
												placeholderTextColor="rgba(255,255,255,0.3)"
												style={{
													fontSize: 12,
													color: 'rgba(255,255,255,0.6)',
													paddingVertical: 2,
													marginTop: 2,
												}}
											/>
										</>
									) : showDate ? (
										<></>
									) : (
										<>
											<Text variant="body" weight="medium" style={{ color: 'white' }}>
												{quote.author?.name || t('quotes.unknown')}
											</Text>
											{quote.author?.profession && (
												<Text
													variant="caption"
													className="mt-0.5"
													style={{ color: 'rgba(255,255,255,0.6)' }}
												>
													{quote.author.profession[0]}
												</Text>
											)}
										</>
									)}
								</View>

								{/* Action Buttons */}
								<View className="flex-row items-center gap-3">
									{editMode ? (
										<>
											{/* Cancel Button */}
											<Pressable
												onPress={onCancel}
												hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
											>
												<Icon name="close" size={22} color="rgba(255,255,255,0.8)" />
											</Pressable>

											{/* Save Button */}
											<Pressable
												onPress={onSave}
												hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
												disabled={!quote.text?.trim()}
											>
												<Icon
													name="checkmark"
													size={22}
													color={
														quote.text?.trim() ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.3)'
													}
												/>
											</Pressable>
										</>
									) : (
										<>
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

											{/* Edit Button (only if onEdit is provided) */}
											{!isDaily && onEdit && (
												<Pressable
													onPress={onEdit}
													hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
												>
													<Icon name="create-outline" size={22} color="rgba(255,255,255,0.7)" />
												</Pressable>
											)}

											{/* Delete Button (only if onDelete is provided) */}
											{!isDaily && onDelete && (
												<Pressable
													onPress={onDelete}
													hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
												>
													<Icon name="trash-outline" size={22} color="rgba(255,255,255,0.7)" />
												</Pressable>
											)}

											{/* Add to List Button */}
											<QuickAddToList
												quoteId={quote.id}
												iconSize={23}
												iconColor="rgba(255,255,255,0.75)"
											/>

											{/* Favorite Button */}
											<FavoriteButton
												isFavorite={quote.isFavorite}
												onToggle={handleFavorite}
												size={24}
												variant={isDaily ? 'daily' : 'default'}
											/>
										</>
									)}
								</View>
							</View>
						</Pressable>
					</View>
				</View>
			</View>
		</LinearGradient>
	);

	if (isVertical) {
		return (
			<View
				style={{
					height: cardHeight,
					justifyContent: 'center',
					alignItems: 'center',
					paddingHorizontal: 16,
				}}
			>
				<View style={{ width: '100%', maxWidth: 400, marginTop: -40 }}>
					<Animated.View style={verticalAnimatedStyle}>
						<Animated.View style={animatedStyle}>{cardContent}</Animated.View>
					</Animated.View>
				</View>
			</View>
		);
	}

	return (
		<Animated.View
			entering={isDaily ? FadeInDown.duration(600).springify() : FadeInUp.duration(600).springify()}
			className="mx-4"
		>
			<Animated.View style={animatedStyle}>
				{isDaily && onPress ? (
					<Pressable onPress={handlePress}>{cardContent}</Pressable>
				) : (
					cardContent
				)}
			</Animated.View>
		</Animated.View>
	);
}

// Optimierung mit React.memo
export default React.memo(QuoteCard, (prevProps, nextProps) => {
	// Nur re-rendern wenn sich relevante Props ändern
	return (
		prevProps.quote.id === nextProps.quote.id &&
		prevProps.quote.isFavorite === nextProps.quote.isFavorite &&
		prevProps.quote.text === nextProps.quote.text &&
		prevProps.variant === nextProps.variant
	);
});
