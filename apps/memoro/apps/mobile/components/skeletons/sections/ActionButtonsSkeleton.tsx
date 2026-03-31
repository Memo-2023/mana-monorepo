import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '~/features/theme/ThemeProvider';
import { getSkeletonColor, skeletonBase, skeletonBox } from '../utils/skeletonStyles';
import { SkeletonAnimation } from '../utils/SkeletonAnimation';

/**
 * Skeleton for the horizontal action buttons row on the memo detail page.
 * Matches: Question, Photos, Create Memory, Translate buttons.
 */
export const ActionButtonsSkeleton: React.FC = () => {
	const { colors, isDark } = useTheme();
	const skeletonColor = getSkeletonColor(isDark, colors);

	return (
		<SkeletonAnimation style={styles.container}>
			<View style={styles.row}>
				{[120, 140, 130, 110].map((width, i) => (
					<View
						key={i}
						style={[
							skeletonBase,
							skeletonBox(width, 40),
							styles.button,
							{ backgroundColor: skeletonColor },
						]}
					/>
				))}
			</View>
		</SkeletonAnimation>
	);
};

const styles = StyleSheet.create({
	container: {},
	row: {
		flexDirection: 'row',
		paddingHorizontal: 20,
		gap: 12,
	},
	button: {
		borderRadius: 20,
	},
});
