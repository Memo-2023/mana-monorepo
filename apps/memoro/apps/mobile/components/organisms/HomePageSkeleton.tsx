import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet } from 'react-native';
import { useTheme } from '~/features/theme/ThemeProvider';
import { useHeader } from '~/features/menus/HeaderContext';
import MemoroLogo from '~/components/atoms/MemoroLogo';

interface HomePageSkeletonProps {
	recordingButtonSize: number;
	showLanguageButton?: boolean;
}

/**
 * Skeleton loader for the home page.
 * Shows: page title placeholder, centered recording button, optional satellite buttons.
 * Bottom bar elements (blueprints, advice, memo preview) are managed by BottomBarStack separately.
 */
export default function HomePageSkeleton({
	recordingButtonSize,
	showLanguageButton = true,
}: HomePageSkeletonProps) {
	const { colors, isDark } = useTheme();
	const { headerHeight } = useHeader();
	const pulseAnim = useRef(new Animated.Value(0.4)).current;

	const skeletonColor = colors.skeleton;

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
			{/* Page title placeholder — matches "Memoro" title + optional ManaCounter */}
			<View style={[styles.titleContainer, { marginTop: headerHeight - 20 }]}>
				<Animated.View
					style={[styles.titleSkeleton, { backgroundColor: skeletonColor, opacity: pulseAnim }]}
				/>
				{/* Mana counter placeholder */}
				<Animated.View
					style={[
						styles.manaCounterSkeleton,
						{ backgroundColor: skeletonColor, opacity: pulseAnim },
					]}
				/>
			</View>

			{/* Recording button — centered */}
			<View
				style={[
					styles.recordingButtonContainer,
					{ transform: [{ translateY: -(recordingButtonSize / 2 + 10) }] },
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
						},
					]}
				>
					<MemoroLogo size={recordingButtonSize * 0.42} color={skeletonColor} />
				</Animated.View>

				{/* Language satellite button — matches RecordingButton orbit: size/2 + 48/2 + 16 */}
				{showLanguageButton && (
					<View
						style={[
							styles.satelliteLeft,
							{ left: -(recordingButtonSize / 2 + 40 + 24), top: recordingButtonSize / 2 - 24 },
						]}
					>
						<Animated.View
							style={[
								styles.satelliteCircle,
								{ backgroundColor: skeletonColor, opacity: pulseAnim },
							]}
						/>
					</View>
				)}
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		position: 'relative',
	},
	titleContainer: {
		alignItems: 'center',
		paddingBottom: 0,
	},
	titleSkeleton: {
		width: 180,
		height: 40,
		borderRadius: 8,
	},
	manaCounterSkeleton: {
		width: 80,
		height: 24,
		borderRadius: 12,
		marginTop: 8,
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
		justifyContent: 'center',
		alignItems: 'center',
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.2,
		shadowRadius: 8,
		elevation: 5,
	},
	satelliteLeft: {
		position: 'absolute',
	},
	satelliteCircle: {
		width: 48,
		height: 48,
		borderRadius: 24,
	},
});
