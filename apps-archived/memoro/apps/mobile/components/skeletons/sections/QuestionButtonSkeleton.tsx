import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '~/features/theme/ThemeProvider';
import { getSkeletonColor, skeletonBase, skeletonBox } from '../utils/skeletonStyles';
import { SkeletonAnimation } from '../utils/SkeletonAnimation';

export const QuestionButtonSkeleton: React.FC = () => {
	const { colors, isDark } = useTheme();
	const skeletonColor = getSkeletonColor(isDark, colors);

	return (
		<SkeletonAnimation style={styles.container}>
			<View
				style={[
					skeletonBase,
					skeletonBox('100%', 48),
					styles.button,
					{ backgroundColor: skeletonColor },
				]}
			/>
		</SkeletonAnimation>
	);
};

const styles = StyleSheet.create({
	container: {
		paddingHorizontal: 20, // Same as questionButtonContainer
		marginBottom: 12, // Same as questionButtonContainer
	},
	button: {
		borderRadius: 24,
	},
});
