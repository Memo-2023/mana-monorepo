import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet } from 'react-native';
import { useTheme } from '~/features/theme/ThemeProvider';
import MemoPreviewSkeleton from '~/components/molecules/MemoPreviewSkeleton';
import MemoroLogo from '~/components/atoms/MemoroLogo';

interface HomePageSkeletonProps {
	recordingButtonSize: number;
	showBlueprints?: boolean;
	showLanguageButton?: boolean;
}

/**
 * Vollständiger Skeleton Loader für die Homepage
 * Zeigt Platzhalter für alle Elemente während des initialen Ladens
 */
export default function HomePageSkeleton({
	recordingButtonSize,
	showBlueprints = true,
	showLanguageButton = true,
}: HomePageSkeletonProps) {
	const { colors, isDark } = useTheme();
	const pulseAnim = useRef(new Animated.Value(0.4)).current;

	const skeletonColor = colors.skeleton;
	const backgroundColor = colors.contentBackground;

	// Pulsing animation
	useEffect(() => {
		const pulse = Animated.loop(
			Animated.sequence([
				Animated.timing(pulseAnim, {
					toValue: 1,
					duration: 1000,
					useNativeDriver: true,
				}),
				Animated.timing(pulseAnim, {
					toValue: 0.4,
					duration: 1000,
					useNativeDriver: true,
				}),
			])
		);

		pulse.start();

		return () => pulse.stop();
	}, [pulseAnim]);

	return (
		<View style={styles.container}>
			{/* MemoPreview Skeleton - oben */}
			<View style={styles.memoPreviewContainer}>
				<MemoPreviewSkeleton showMargins={false} />
			</View>

			{/* Recording Button Skeleton - zentriert */}
			<View
				style={[
					styles.recordingButtonContainer,
					{
						transform: [{ translateY: -(recordingButtonSize / 2 + 10) }],
					},
				]}
			>
				<Animated.View
					style={[
						styles.recordingButtonCircle,
						{
							width: recordingButtonSize,
							height: recordingButtonSize,
							borderRadius: recordingButtonSize / 2,
							backgroundColor: skeletonColor,
							opacity: pulseAnim,
							justifyContent: 'center',
							alignItems: 'center',
						},
					]}
				>
					{/* Memoro Logo inside button - 42% of button size */}
					<MemoroLogo size={recordingButtonSize * 0.42} color={skeletonColor} />
				</Animated.View>

				{/* Language Button Skeleton - links neben Recording Button */}
				{showLanguageButton && (
					<View style={styles.languageButtonSkeleton}>
						<Animated.View
							style={[
								styles.languageCircle,
								{
									backgroundColor: skeletonColor,
									opacity: pulseAnim,
								},
							]}
						/>
					</View>
				)}
			</View>

			{/* Blueprint Pills Skeleton - unten */}
			{showBlueprints && (
				<View style={styles.blueprintSelectorContainer}>
					<View style={styles.pillsContainer}>
						{[80, 100, 90, 110, 95].map((width, index) => (
							<Animated.View
								key={index}
								style={[
									styles.pillSkeleton,
									{
										width,
										backgroundColor: skeletonColor,
										opacity: pulseAnim,
									},
								]}
							/>
						))}
					</View>
				</View>
			)}
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		position: 'relative',
	},
	memoPreviewContainer: {
		position: 'absolute',
		top: 0,
		left: 0,
		right: 0,
		zIndex: 20,
		minHeight: 180,
	},
	recordingButtonContainer: {
		position: 'absolute',
		top: '50%',
		left: 0,
		right: 0,
		alignItems: 'center',
		justifyContent: 'center',
		zIndex: 30,
	},
	recordingButtonCircle: {
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.2,
		shadowRadius: 8,
		elevation: 5,
	},
	languageButtonSkeleton: {
		position: 'absolute',
		left: -64,
		top: '50%',
		transform: [{ translateY: -26 }],
	},
	languageCircle: {
		width: 52,
		height: 52,
		borderRadius: 26,
	},
	blueprintSelectorContainer: {
		position: 'absolute',
		bottom: 0,
		left: 0,
		right: 0,
		zIndex: 10,
		paddingVertical: 16,
		paddingHorizontal: 16,
		minHeight: 60,
	},
	pillsContainer: {
		flexDirection: 'row',
		gap: 8,
		flexWrap: 'nowrap',
		paddingHorizontal: 8,
	},
	pillSkeleton: {
		height: 36,
		borderRadius: 18,
	},
});
