import React, { useEffect, useRef } from 'react';
import { View, ScrollView, Animated, StyleSheet, Dimensions } from 'react-native';
import { useTheme } from '~/features/theme/ThemeProvider';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH * 0.85;
const CARD_SPACING = 16;

interface StatisticsPageSkeletonProps {
	selectedView?: string;
}

/**
 * Skeleton loader for the Statistics page.
 * Matches the horizontal card carousel layout (4 cards).
 */
const StatisticsPageSkeleton: React.FC<StatisticsPageSkeletonProps> = () => {
	const { isDark, colors } = useTheme();
	const pulseAnim = useRef(new Animated.Value(0.4)).current;

	const skeletonColor = colors.skeleton;
	const glassBackground = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.7)';
	const borderColor = isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(255, 255, 255, 0.3)';

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

	const renderCardSkeleton = (rowCount: number, key: number) => (
		<View key={key} style={styles.cardWrapper}>
			<View style={[styles.card, { backgroundColor: glassBackground, borderColor }]}>
				{/* Card title */}
				<Animated.View
					style={[styles.cardTitle, { backgroundColor: skeletonColor, opacity: pulseAnim }]}
				/>

				{/* Stat rows */}
				{Array.from({ length: rowCount }).map((_, i) => (
					<View key={i} style={styles.statRow}>
						<Animated.View
							style={[styles.statIcon, { backgroundColor: skeletonColor, opacity: pulseAnim }]}
						/>
						<View style={styles.statText}>
							<Animated.View
								style={[styles.statLabel, { backgroundColor: skeletonColor, opacity: pulseAnim }]}
							/>
							<Animated.View
								style={[styles.statValue, { backgroundColor: skeletonColor, opacity: pulseAnim }]}
							/>
						</View>
					</View>
				))}
			</View>
		</View>
	);

	return (
		<ScrollView
			horizontal
			scrollEnabled={false}
			showsHorizontalScrollIndicator={false}
			contentContainerStyle={styles.cardsContainer}
		>
			{renderCardSkeleton(6, 0)}
			{renderCardSkeleton(5, 1)}
			{renderCardSkeleton(6, 2)}
			{renderCardSkeleton(4, 3)}
		</ScrollView>
	);
};

const styles = StyleSheet.create({
	cardsContainer: {
		paddingHorizontal: (SCREEN_WIDTH - CARD_WIDTH) / 2,
		paddingVertical: 20,
		paddingBottom: 40,
	},
	cardWrapper: {
		width: CARD_WIDTH,
		marginRight: CARD_SPACING,
		height: '100%',
	},
	card: {
		flex: 1,
		borderRadius: 24,
		borderWidth: 1,
		padding: 24,
	},
	cardTitle: {
		width: 140,
		height: 24,
		borderRadius: 8,
		marginBottom: 24,
	},
	statRow: {
		flexDirection: 'row',
		alignItems: 'center',
		marginBottom: 18,
	},
	statIcon: {
		width: 32,
		height: 32,
		borderRadius: 16,
	},
	statText: {
		flex: 1,
		marginLeft: 12,
	},
	statLabel: {
		width: '60%',
		height: 14,
		borderRadius: 6,
		marginBottom: 6,
	},
	statValue: {
		width: '35%',
		height: 18,
		borderRadius: 6,
	},
});

export default StatisticsPageSkeleton;
