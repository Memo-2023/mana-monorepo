import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '~/features/theme/ThemeProvider';
import {
	getSkeletonColor,
	skeletonBase,
	skeletonCircle,
	skeletonBox,
	skeletonRow,
	skeletonSpacing,
} from '../utils/skeletonStyles';
import { SkeletonAnimation } from '../utils/SkeletonAnimation';

export const AudioPlayerSkeleton: React.FC = () => {
	const { colors, isDark } = useTheme();
	const skeletonColor = getSkeletonColor(isDark, colors);

	return (
		<SkeletonAnimation style={styles.container}>
			<View
				style={[styles.playerCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
			>
				<View style={[skeletonRow, styles.controls]}>
					<View style={[skeletonBase, skeletonCircle(48), { backgroundColor: skeletonColor }]} />
					<View style={styles.progressContainer}>
						<View
							style={[skeletonBase, skeletonBox('100%', 4), { backgroundColor: skeletonColor }]}
						/>
						<View style={[skeletonRow, styles.timeRow]}>
							<View
								style={[skeletonBase, skeletonBox(40, 12), { backgroundColor: skeletonColor }]}
							/>
							<View style={styles.spacer} />
							<View
								style={[skeletonBase, skeletonBox(40, 12), { backgroundColor: skeletonColor }]}
							/>
						</View>
					</View>
				</View>
			</View>
		</SkeletonAnimation>
	);
};

const styles = StyleSheet.create({
	container: {
		paddingHorizontal: 20, // Same as audioPlayerContainer
		marginBottom: 20, // Same as audioPlayerContainer
	},
	playerCard: {
		borderRadius: 12,
		borderWidth: 1,
		padding: 16,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 1 },
		shadowOpacity: 0.05,
		shadowRadius: 2,
		elevation: 2,
	},
	controls: {
		gap: skeletonSpacing.md,
	},
	progressContainer: {
		flex: 1,
		gap: skeletonSpacing.xs,
	},
	timeRow: {
		justifyContent: 'space-between',
	},
	spacer: {
		flex: 1,
	},
});
