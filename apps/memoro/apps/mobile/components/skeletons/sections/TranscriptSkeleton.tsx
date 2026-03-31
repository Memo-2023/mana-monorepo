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

interface TranscriptSkeletonProps {
	lineCount?: number;
}

export const TranscriptSkeleton: React.FC<TranscriptSkeletonProps> = ({ lineCount = 8 }) => {
	const { colors, isDark } = useTheme();
	const skeletonColor = getSkeletonColor(isDark, colors);

	return (
		<SkeletonAnimation style={styles.container}>
			<View
				style={[
					styles.transcriptCard,
					{ backgroundColor: colors.surface, borderColor: colors.border },
				]}
			>
				<View
					style={[
						styles.headerLine,
						skeletonBase,
						skeletonText(20),
						{ backgroundColor: skeletonColor },
					]}
				/>
				<View style={styles.content}>
					{Array.from({ length: lineCount }).map((_, index) => (
						<View
							key={index}
							style={[
								styles.textLine,
								skeletonBase,
								skeletonText(14),
								{
									backgroundColor: skeletonColor,
									width: `${Math.random() * 30 + 70}%`, // Random width between 70-100%
								},
							]}
						/>
					))}
				</View>
			</View>
		</SkeletonAnimation>
	);
};

const styles = StyleSheet.create({
	container: {
		marginBottom: 20,
	},
	transcriptCard: {
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
		width: '40%',
		marginBottom: skeletonSpacing.md,
	},
	content: {
		gap: skeletonSpacing.xs,
	},
	textLine: {
		marginBottom: 2,
	},
});
