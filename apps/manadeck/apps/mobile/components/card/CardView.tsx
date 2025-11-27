import React, { useState } from 'react';
import { View, Pressable, ScrollView } from 'react-native';
import { Icon } from '../ui/Icon';
import { Text } from '../ui/Text';
import {
	Card,
	TextContent,
	FlashcardContent,
	QuizContent,
	MixedContent,
} from '../../store/cardStore';
import { Button } from '../ui/Button';
import { useThemeColors } from '~/utils/themeUtils';

interface CardViewProps {
	card: Card;
	mode: 'view' | 'study' | 'edit' | 'preview';
	onFlip?: () => void;
	onAnswerSelect?: (answerIndex: number) => void;
	onEdit?: () => void;
	showActions?: boolean;
	isFlipped?: boolean;
	selectedAnswer?: number;
	showFeedback?: boolean;
}

export const CardView: React.FC<CardViewProps> = ({
	card,
	mode,
	onFlip,
	onAnswerSelect,
	onEdit,
	showActions = false,
	isFlipped = false,
	selectedAnswer,
	showFeedback = false,
}) => {
	const [localFlipped, setLocalFlipped] = useState(false);
	const [showHint, setShowHint] = useState(false);
	const actuallyFlipped = isFlipped !== undefined ? isFlipped : localFlipped;
	const colors = useThemeColors();

	const handleFlip = () => {
		if (onFlip) {
			onFlip();
		} else {
			setLocalFlipped(!localFlipped);
		}
	};

	const renderTextCard = (content: TextContent) => (
		<View style={{ padding: 16 }}>
			{card.title && (
				<Text
					style={{ marginBottom: 12, fontSize: 20, fontWeight: 'bold', color: colors.foreground }}
				>
					{card.title}
				</Text>
			)}
			<Text style={{ fontSize: 16, lineHeight: 24, color: colors.foreground }}>{content.text}</Text>
		</View>
	);

	const renderFlashcard = (content: FlashcardContent) => (
		<View style={{ height: '100%', flexDirection: 'column' }}>
			{/* Main Content Area */}
			<View style={{ flex: 1, padding: 24, justifyContent: 'center' }}>
				{!actuallyFlipped ? (
					// Front side
					<View style={{ justifyContent: 'center', alignItems: 'center' }}>
						<Text
							style={{
								fontSize: 28,
								fontWeight: '600',
								textAlign: 'center',
								lineHeight: 36,
								color: colors.foreground,
							}}
						>
							{content.front}
						</Text>

						{/* Hint Content - only if shown */}
						{content.hint && mode === 'study' && showHint && (
							<View
								style={{
									marginTop: 20,
									width: '100%',
									borderRadius: 12,
									backgroundColor: colors.accent,
									padding: 16,
								}}
							>
								<Text style={{ fontSize: 15, lineHeight: 22, color: colors.accentForeground }}>
									{content.hint}
								</Text>
							</View>
						)}
					</View>
				) : (
					// Back side
					<View style={{ justifyContent: 'center', alignItems: 'center' }}>
						<Text
							style={{
								fontSize: 28,
								fontWeight: '600',
								textAlign: 'center',
								lineHeight: 36,
								color: colors.foreground,
							}}
						>
							{content.back}
						</Text>
					</View>
				)}
			</View>

			{/* Fixed Hint Bar at Bottom - only on front side */}
			{!actuallyFlipped && content.hint && mode === 'study' && (
				<View
					style={{
						borderTopWidth: 1,
						borderTopColor: colors.border,
						backgroundColor: colors.card,
					}}
				>
					<Pressable
						onPress={() => setShowHint(!showHint)}
						style={({ pressed }) => ({
							paddingVertical: 18,
							paddingHorizontal: 24,
							backgroundColor: showHint ? `${colors.accent}20` : 'transparent',
							opacity: pressed ? 0.7 : 1,
						})}
					>
						<View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
							<Icon
								name={showHint ? 'bulb' : 'bulb-outline'}
								library="Ionicons"
								size={20}
								color={showHint ? colors.primary : colors.mutedForeground}
							/>
							<Text
								style={{
									fontSize: 15,
									fontWeight: '500',
									color: showHint ? colors.primary : colors.mutedForeground,
									marginLeft: 6,
								}}
							>
								{showHint ? 'Hinweis ausblenden' : 'Hinweis anzeigen'}
							</Text>
						</View>
					</Pressable>
				</View>
			)}
		</View>
	);

	const renderQuizCard = (content: QuizContent) => (
		<View style={{ padding: 16 }}>
			<Text
				style={{ marginBottom: 16, fontSize: 20, fontWeight: 'bold', color: colors.foreground }}
			>
				{content.question}
			</Text>

			<View style={{ gap: 12 }}>
				{content.options.map((option, index) => {
					const isSelected = selectedAnswer === index;
					const isCorrect = index === content.correct_answer;
					const showCorrect = showFeedback && isCorrect;
					const showIncorrect = showFeedback && isSelected && !isCorrect;

					const getBorderColor = () => {
						if (showCorrect) return 'rgb(34, 197, 94)'; // green-500
						if (showIncorrect) return colors.destructive;
						if (isSelected && !showFeedback) return colors.primary;
						return colors.border;
					};

					const getBackgroundColor = () => {
						if (showCorrect) return 'rgba(34, 197, 94, 0.1)';
						if (showIncorrect) return `${colors.destructive}15`;
						if (isSelected && !showFeedback) return `${colors.primary}15`;
						return colors.surface;
					};

					return (
						<Pressable
							key={index}
							onPress={() => onAnswerSelect?.(index)}
							disabled={showFeedback || mode !== 'study'}
							style={({ pressed }) => ({
								flexDirection: 'row',
								alignItems: 'center',
								borderRadius: 8,
								borderWidth: 2,
								padding: 12,
								borderColor: getBorderColor(),
								backgroundColor: getBackgroundColor(),
								opacity: pressed && !showFeedback && mode === 'study' ? 0.7 : 1,
							})}
						>
							<View
								style={{
									marginRight: 12,
									height: 24,
									width: 24,
									alignItems: 'center',
									justifyContent: 'center',
									borderRadius: 12,
									borderWidth: 2,
									borderColor: getBorderColor(),
									backgroundColor: isSelected || showCorrect ? getBorderColor() : 'transparent',
								}}
							>
								{(isSelected || showCorrect) && (
									<Icon
										name={showCorrect ? 'checkmark' : showIncorrect ? 'close' : 'checkmark'}
										library="Ionicons"
										size={16}
										color={colors.background}
									/>
								)}
							</View>
							<Text
								style={{
									flex: 1,
									fontSize: 16,
									color: showCorrect
										? 'rgb(34, 197, 94)'
										: showIncorrect
											? colors.destructive
											: isSelected && !showFeedback
												? colors.primary
												: colors.foreground,
								}}
							>
								{option}
							</Text>
						</Pressable>
					);
				})}
			</View>

			{showFeedback && content.explanation && (
				<View
					style={{
						marginTop: 16,
						borderRadius: 8,
						backgroundColor: `${colors.primary}15`,
						padding: 12,
					}}
				>
					<Text style={{ marginBottom: 4, fontSize: 14, fontWeight: '500', color: colors.primary }}>
						Erklärung:
					</Text>
					<Text style={{ fontSize: 14, color: colors.primary }}>{content.explanation}</Text>
				</View>
			)}
		</View>
	);

	const renderMixedCard = (content: MixedContent) => (
		<View style={{ padding: 16 }}>
			{card.title && (
				<Text
					style={{ marginBottom: 16, fontSize: 20, fontWeight: 'bold', color: colors.foreground }}
				>
					{card.title}
				</Text>
			)}
			<ScrollView style={{ maxHeight: 384 }}>
				{content.blocks.map((block, index) => (
					<View key={index} style={{ marginBottom: 16 }}>
						{block.type === 'text' && (
							<Text style={{ fontSize: 16, lineHeight: 24, color: colors.foreground }}>
								{block.data.text}
							</Text>
						)}
						{block.type === 'image' && (
							<View
								style={{
									height: 128,
									alignItems: 'center',
									justifyContent: 'center',
									borderRadius: 8,
									backgroundColor: colors.muted,
								}}
							>
								<Icon
									name="image-outline"
									library="Ionicons"
									size={32}
									color={colors.mutedForeground}
								/>
								<Text style={{ marginTop: 4, fontSize: 14, color: colors.mutedForeground }}>
									Bild: {block.data.caption || 'Ohne Titel'}
								</Text>
							</View>
						)}
						{block.type === 'quiz' && (
							<View
								style={{
									borderRadius: 8,
									borderWidth: 1,
									borderColor: colors.border,
									padding: 12,
								}}
							>
								<Text
									style={{
										marginBottom: 8,
										fontSize: 14,
										fontWeight: '500',
										color: colors.mutedForeground,
									}}
								>
									Quiz-Block
								</Text>
								{renderQuizCard({ ...block.data } as QuizContent)}
							</View>
						)}
						{block.type === 'flashcard' && (
							<View
								style={{
									borderRadius: 8,
									borderWidth: 1,
									borderColor: colors.border,
									padding: 12,
								}}
							>
								<Text
									style={{
										marginBottom: 8,
										fontSize: 14,
										fontWeight: '500',
										color: colors.mutedForeground,
									}}
								>
									Flashcard-Block
								</Text>
								{renderFlashcard({ ...block.data } as FlashcardContent)}
							</View>
						)}
					</View>
				))}
			</ScrollView>
		</View>
	);

	const renderCardContent = () => {
		switch (card.card_type) {
			case 'text':
				return renderTextCard(card.content as TextContent);
			case 'flashcard':
				return renderFlashcard(card.content as FlashcardContent);
			case 'quiz':
				return renderQuizCard(card.content as QuizContent);
			case 'mixed':
				return renderMixedCard(card.content as MixedContent);
			default:
				return (
					<View style={{ padding: 16 }}>
						<Text style={{ color: colors.mutedForeground }}>Unbekannter Kartentyp</Text>
					</View>
				);
		}
	};

	return (
		<View
			style={{
				height: '100%',
				width: '100%',
				borderRadius: 12,
				borderWidth: 1,
				borderColor: colors.border,
				backgroundColor: colors.card,
				shadowColor: '#000',
				shadowOffset: { width: 0, height: 1 },
				shadowOpacity: 0.05,
				shadowRadius: 2,
			}}
		>
			{/* Card Header */}
			{showActions && (
				<View
					style={{
						flexDirection: 'row',
						alignItems: 'center',
						justifyContent: 'space-between',
						borderBottomWidth: 1,
						borderBottomColor: colors.border,
						padding: 12,
					}}
				>
					<View style={{ flexDirection: 'row', alignItems: 'center' }}>
						<View
							style={{
								marginRight: 8,
								height: 8,
								width: 8,
								borderRadius: 4,
								backgroundColor: colors.primary,
							}}
						/>
						<Text
							style={{
								fontSize: 14,
								fontWeight: '500',
								textTransform: 'capitalize',
								color: colors.mutedForeground,
							}}
						>
							{card.card_type}
						</Text>
					</View>
					<View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
						{card.is_favorite && (
							<Icon name="heart" library="Ionicons" size={16} color={colors.destructive} />
						)}
						{onEdit && (
							<Pressable onPress={onEdit} style={({ pressed }) => pressed && { opacity: 0.7 }}>
								<Icon
									name="create-outline"
									library="Ionicons"
									size={20}
									color={colors.mutedForeground}
								/>
							</Pressable>
						)}
					</View>
				</View>
			)}

			{/* Card Content */}
			{renderCardContent()}

			{/* Card Footer */}
			{mode === 'view' && (
				<View style={{ paddingHorizontal: 16, paddingBottom: 12 }}>
					<View
						style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
					>
						<Text style={{ fontSize: 12, color: colors.mutedForeground }}>
							Position {card.position}
						</Text>
						<Text style={{ fontSize: 12, color: colors.mutedForeground }}>
							Version {card.version}
						</Text>
					</View>
				</View>
			)}
		</View>
	);
};
