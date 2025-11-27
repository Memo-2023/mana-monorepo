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

interface MemoryCardSkeletonProps {
	showMultiple?: boolean;
}

export const MemoryCardSkeleton: React.FC<MemoryCardSkeletonProps> = ({ showMultiple = false }) => {
	const { colors, isDark } = useTheme();
	const skeletonColor = getSkeletonColor(isDark, colors);

	const renderCard = () => (
		<SkeletonAnimation>
			<View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
				<View
					style={[
						styles.headerLine,
						skeletonBase,
						skeletonText(20),
						{ backgroundColor: skeletonColor },
					]}
				/>
				<View style={styles.content}>
					<View
						style={[
							styles.textLine,
							skeletonBase,
							skeletonText(16),
							{ backgroundColor: skeletonColor },
						]}
					/>
					<View
						style={[
							styles.textLine,
							skeletonBase,
							skeletonText(16),
							{ backgroundColor: skeletonColor, width: '90%' },
						]}
					/>
					<View
						style={[
							styles.textLine,
							skeletonBase,
							skeletonText(16),
							{ backgroundColor: skeletonColor, width: '75%' },
						]}
					/>
				</View>
			</View>
		</SkeletonAnimation>
	);

	return (
		<View style={styles.container}>
			{renderCard()}
			{showMultiple && (
				<>
					<View style={styles.spacing} />
					{renderCard()}
				</>
			)}
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		paddingHorizontal: 20, // Same as memo page
		marginBottom: 20, // Same as memoriesContainer
	},
	card: {
		borderRadius: 12,
		borderWidth: 1,
		padding: 16,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 1 },
		shadowOpacity: 0.05,
		shadowRadius: 2,
		elevation: 2,
	},
	headerLine: {
		width: '60%',
		marginBottom: skeletonSpacing.md,
	},
	content: {
		gap: skeletonSpacing.xs,
	},
	textLine: {
		width: '100%',
	},
	spacing: {
		height: skeletonSpacing.md,
	},
});
