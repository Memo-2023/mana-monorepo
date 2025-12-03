import React from 'react';
import { View, Text, Image, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import { type Slide } from '../../types/models';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useTheme } from '../ThemeProvider';

interface SlideViewProps {
	slide: Slide;
	showNotes?: boolean;
	isFullscreen?: boolean;
	onToggleFullscreen?: () => void;
	onNavigate?: (direction: 'prev' | 'next') => void;
	isFirstSlide?: boolean;
	isLastSlide?: boolean;
}

export const SlideView: React.FC<SlideViewProps> = ({
	slide,
	showNotes = false,
	isFullscreen = false,
	onToggleFullscreen,
	onNavigate,
	isFirstSlide = false,
	isLastSlide = false,
}) => {
	const { theme } = useTheme();

	return (
		<View
			style={[
				styles.container,
				isFullscreen && styles.fullscreenContainer,
				{
					backgroundColor: isFullscreen
						? theme.colors.backgroundPage
						: theme.colors.backgroundPrimary,
				},
			]}
		>
			{slide.imageUrl && (
				<View
					style={[
						styles.imageContainer,
						isFullscreen && styles.fullscreenImageContainer,
						{ backgroundColor: theme.colors.backgroundPage },
					]}
				>
					{/* Navigation Areas */}
					{!isFirstSlide && (
						<TouchableOpacity style={styles.navigationArea} onPress={() => onNavigate?.('prev')} />
					)}
					{!isLastSlide && (
						<TouchableOpacity
							style={[styles.navigationArea, styles.navigationAreaRight]}
							onPress={() => onNavigate?.('next')}
						/>
					)}

					{/* Image */}
					<Image
						source={{ uri: slide.imageUrl }}
						style={styles.image}
						resizeMode={isFullscreen ? 'contain' : 'cover'}
					/>

					{/* Navigation Indicators */}
					{isFullscreen && (
						<>
							{!isFirstSlide && (
								<View style={[styles.navigationIndicator, styles.navigationIndicatorLeft]}>
									<MaterialIcons
										name="chevron-left"
										size={36}
										color={`${theme.colors.textPrimary}80`}
									/>
								</View>
							)}
							{!isLastSlide && (
								<View style={[styles.navigationIndicator, styles.navigationIndicatorRight]}>
									<MaterialIcons
										name="chevron-right"
										size={36}
										color={`${theme.colors.textPrimary}80`}
									/>
								</View>
							)}
						</>
					)}
				</View>
			)}

			{!isFullscreen && (
				<View style={styles.content}>
					<Text style={[styles.contentTitle, { color: theme.colors.textPrimary }]}>
						{slide.title}
					</Text>

					{slide.bulletPoints && slide.bulletPoints.length > 0 && (
						<View style={styles.bulletPoints}>
							{slide.bulletPoints.map((point, index) => (
								<View key={index} style={styles.bulletPoint}>
									<Text style={[styles.bullet, { color: theme.colors.textPrimary }]}>•</Text>
									<Text style={[styles.bulletText, { color: theme.colors.textPrimary }]}>
										{point}
									</Text>
								</View>
							))}
						</View>
					)}

					{slide.fullText && (
						<Text style={[styles.fullText, { color: theme.colors.textPrimary }]}>
							{slide.fullText}
						</Text>
					)}

					{showNotes && slide.notes && (
						<View
							style={[styles.notesContainer, { backgroundColor: theme.colors.backgroundSecondary }]}
						>
							<Text style={[styles.notesTitle, { color: theme.colors.textSecondary }]}>Notes:</Text>
							<Text style={[styles.notes, { color: theme.colors.textPrimary }]}>{slide.notes}</Text>
						</View>
					)}
				</View>
			)}
		</View>
	);
};

const { width, height } = Dimensions.get('window');
const ASPECT_RATIO = 16 / 9;
const SLIDE_WIDTH = width;
const SLIDE_HEIGHT = SLIDE_WIDTH / ASPECT_RATIO;

const styles = StyleSheet.create({
	container: {
		width: SLIDE_WIDTH,
		height: SLIDE_HEIGHT,
		borderRadius: 8,
		overflow: 'hidden',
	},
	fullscreenContainer: {
		width: '100%',
		height: '100%',
		borderRadius: 0,
	},
	imageContainer: {
		width: '100%',
		height: undefined,
		aspectRatio: 16 / 9,
		overflow: 'hidden',
		position: 'relative',
	},
	fullscreenImageContainer: {
		width: '100%',
		height: '100%',
		aspectRatio: undefined,
	},
	image: {
		width: '100%',
		height: '100%',
		position: 'absolute',
	},
	navigationArea: {
		position: 'absolute',
		top: 0,
		left: 0,
		width: '50%',
		height: '100%',
		zIndex: 2,
	},
	navigationAreaRight: {
		left: '50%',
	},
	navigationIndicator: {
		position: 'absolute',
		top: '50%',
		transform: [{ translateY: -18 }],
		opacity: 0.5,
		zIndex: 1,
	},
	navigationIndicatorLeft: {
		left: 16,
	},
	navigationIndicatorRight: {
		right: 16,
	},
	content: {
		padding: 16,
		flex: 1,
	},
	contentTitle: {
		fontSize: 24,
		fontWeight: 'bold',
		marginBottom: 16,
	},
	bulletPoints: {
		marginBottom: 16,
	},
	bulletPoint: {
		flexDirection: 'row',
		marginBottom: 8,
		alignItems: 'flex-start',
	},
	bullet: {
		fontSize: 16,
		marginRight: 8,
	},
	bulletText: {
		fontSize: 16,
		flex: 1,
	},
	fullText: {
		fontSize: 16,
		marginBottom: 16,
	},
	notesContainer: {
		marginTop: 16,
		padding: 16,
		borderRadius: 8,
	},
	notesTitle: {
		fontSize: 14,
		fontWeight: 'bold',
		marginBottom: 8,
	},
	notes: {
		fontSize: 14,
		lineHeight: 20,
	},
});
