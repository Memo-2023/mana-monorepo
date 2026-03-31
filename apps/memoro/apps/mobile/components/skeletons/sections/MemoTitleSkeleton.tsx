import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '~/features/theme/ThemeProvider';
import {
	getSkeletonColor,
	skeletonBase,
	skeletonText,
	skeletonSpacing,
} from '../utils/skeletonStyles';
import { SkeletonAnimation } from '../utils/SkeletonAnimation';

export const MemoTitleSkeleton: React.FC = () => {
	const { colors, isDark } = useTheme();
	const skeletonColor = getSkeletonColor(isDark, colors);

	return (
		<View style={styles.container}>
			{/* Metadata - small line */}
			<SkeletonAnimation delay={0}>
				<View
					style={[
						styles.metadataLine,
						skeletonBase,
						skeletonText(12),
						{ backgroundColor: skeletonColor },
					]}
				/>
			</SkeletonAnimation>

			{/* Title - 3 lines */}
			<SkeletonAnimation delay={100}>
				<View
					style={[
						styles.titleLine1,
						skeletonBase,
						skeletonText(24),
						{ backgroundColor: skeletonColor },
					]}
				/>
			</SkeletonAnimation>
			<SkeletonAnimation delay={150}>
				<View
					style={[
						styles.titleLine2,
						skeletonBase,
						skeletonText(24),
						{ backgroundColor: skeletonColor },
					]}
				/>
			</SkeletonAnimation>
			<SkeletonAnimation delay={200}>
				<View
					style={[
						styles.titleLine3,
						skeletonBase,
						skeletonText(24),
						{ backgroundColor: skeletonColor },
					]}
				/>
			</SkeletonAnimation>

			{/* Intro - 8 lines */}
			<SkeletonAnimation delay={250}>
				<View
					style={[
						styles.introLine1,
						skeletonBase,
						skeletonText(16),
						{ backgroundColor: skeletonColor },
					]}
				/>
			</SkeletonAnimation>
			<SkeletonAnimation delay={300}>
				<View
					style={[
						styles.introLine2,
						skeletonBase,
						skeletonText(16),
						{ backgroundColor: skeletonColor },
					]}
				/>
			</SkeletonAnimation>
			<SkeletonAnimation delay={350}>
				<View
					style={[
						styles.introLine3,
						skeletonBase,
						skeletonText(16),
						{ backgroundColor: skeletonColor },
					]}
				/>
			</SkeletonAnimation>
			<SkeletonAnimation delay={400}>
				<View
					style={[
						styles.introLine4,
						skeletonBase,
						skeletonText(16),
						{ backgroundColor: skeletonColor },
					]}
				/>
			</SkeletonAnimation>
			<SkeletonAnimation delay={450}>
				<View
					style={[
						styles.introLine5,
						skeletonBase,
						skeletonText(16),
						{ backgroundColor: skeletonColor },
					]}
				/>
			</SkeletonAnimation>
			<SkeletonAnimation delay={500}>
				<View
					style={[
						styles.introLine6,
						skeletonBase,
						skeletonText(16),
						{ backgroundColor: skeletonColor },
					]}
				/>
			</SkeletonAnimation>
			<SkeletonAnimation delay={550}>
				<View
					style={[
						styles.introLine7,
						skeletonBase,
						skeletonText(16),
						{ backgroundColor: skeletonColor },
					]}
				/>
			</SkeletonAnimation>
			<SkeletonAnimation delay={600}>
				<View
					style={[
						styles.introLine8,
						skeletonBase,
						skeletonText(16),
						{ backgroundColor: skeletonColor },
					]}
				/>
			</SkeletonAnimation>
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		paddingHorizontal: 20,
		overflow: 'hidden',
	},
	// Metadata line
	metadataLine: {
		width: '50%',
		marginBottom: skeletonSpacing.xl * 2, // Increased spacing to headline
	},
	// Title lines
	titleLine1: {
		width: '90%',
		marginBottom: skeletonSpacing.sm, // Increased from xs (4) to sm (8)
	},
	titleLine2: {
		width: '85%',
		marginBottom: skeletonSpacing.sm, // Increased from xs (4) to sm (8)
	},
	titleLine3: {
		width: '60%',
		marginBottom: skeletonSpacing.xl * 1.5, // Increased gap between title and intro
	},
	// Intro lines
	introLine1: {
		width: '100%',
		marginBottom: skeletonSpacing.sm, // Increased from xs (4) to sm (8)
	},
	introLine2: {
		width: '95%',
		marginBottom: skeletonSpacing.sm, // Increased from xs (4) to sm (8)
	},
	introLine3: {
		width: '100%',
		marginBottom: skeletonSpacing.sm, // Increased from xs (4) to sm (8)
	},
	introLine4: {
		width: '90%',
		marginBottom: skeletonSpacing.sm, // Increased from xs (4) to sm (8)
	},
	introLine5: {
		width: '98%',
		marginBottom: skeletonSpacing.sm, // Increased from xs (4) to sm (8)
	},
	introLine6: {
		width: '85%',
		marginBottom: skeletonSpacing.sm, // Increased from xs (4) to sm (8)
	},
	introLine7: {
		width: '92%',
		marginBottom: skeletonSpacing.sm, // Increased from xs (4) to sm (8)
	},
	introLine8: {
		width: '70%',
	},
});
