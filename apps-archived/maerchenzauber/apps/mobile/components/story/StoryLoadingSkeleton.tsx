import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Image as RNImage } from 'react-native';

export default function StoryLoadingSkeleton() {
	const shimmerAnim = useRef(new Animated.Value(0)).current;
	const fadeAnim = useRef(new Animated.Value(0)).current;

	useEffect(() => {
		// Initial fade in
		Animated.timing(fadeAnim, {
			toValue: 1,
			duration: 300,
			useNativeDriver: true,
		}).start();

		// Shimmer animation
		const shimmerAnimation = Animated.loop(
			Animated.sequence([
				Animated.timing(shimmerAnim, {
					toValue: 1,
					duration: 1000,
					useNativeDriver: true,
				}),
				Animated.timing(shimmerAnim, {
					toValue: 0,
					duration: 1000,
					useNativeDriver: true,
				}),
			])
		);
		shimmerAnimation.start();

		return () => shimmerAnimation.stop();
	}, []);

	const shimmerOpacity = shimmerAnim.interpolate({
		inputRange: [0, 1],
		outputRange: [0.3, 0.6],
	});

	return (
		<Animated.View style={[styles.container, { opacity: fadeAnim }]}>
			{/* Background Pattern - exactly like StartScreen */}
			<View style={styles.backgroundDecoration}>
				<RNImage
					source={require('../../assets/images/backgroundpattern-01.png')}
					style={styles.backgroundImage}
					resizeMode="cover"
				/>
			</View>

			{/* Content - centered like StartScreen */}
			<View style={styles.content}>
				{/* Subtitle Placeholder */}
				<View style={styles.subtitleContainer}>
					<Animated.View style={[styles.subtitleSkeleton, { opacity: shimmerOpacity }]} />
				</View>

				{/* Hint Placeholder */}
				<View style={styles.hintContainer}>
					<Animated.View style={[styles.hintSkeleton, { opacity: shimmerOpacity }]} />
				</View>
			</View>
		</Animated.View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		width: '100%',
		height: '100%',
		position: 'relative',
		backgroundColor: '#121212',
	},
	backgroundDecoration: {
		position: 'absolute',
		top: 0,
		left: 0,
		right: 0,
		bottom: 0,
		width: '100%',
		height: '100%',
		overflow: 'hidden',
	},
	backgroundImage: {
		width: '100%',
		height: '100%',
		opacity: 0.02,
	},
	content: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		width: '100%',
		paddingHorizontal: 24,
		zIndex: 1,
	},
	subtitleContainer: {
		width: '100%',
		maxWidth: 400,
		alignItems: 'center',
		marginBottom: 40,
	},
	subtitleSkeleton: {
		width: '60%',
		height: 24,
		borderRadius: 6,
		backgroundColor: 'rgba(255, 255, 255, 0.08)',
	},
	hintContainer: {
		position: 'absolute',
		bottom: 60,
		alignItems: 'center',
	},
	hintSkeleton: {
		width: 180,
		height: 20,
		borderRadius: 6,
		backgroundColor: 'rgba(255, 255, 255, 0.06)',
	},
});
