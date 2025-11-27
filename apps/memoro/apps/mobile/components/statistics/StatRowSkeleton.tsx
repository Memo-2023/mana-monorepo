import React from 'react';
import { View } from 'react-native';
import { useTheme } from '~/features/theme/ThemeProvider';

interface StatRowSkeletonProps {
	showSubtitle?: boolean;
	isLast?: boolean;
}

/**
 * Skeleton loader for StatRow component
 * Matches exact StatRow structure and dimensions
 */
const StatRowSkeleton: React.FC<StatRowSkeletonProps> = ({
	showSubtitle = false,
	isLast = false,
}) => {
	const { isDark, themeVariant } = useTheme();

	const borderColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
	const skeletonColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';

	return (
		<View
			style={{
				flexDirection: 'row',
				alignItems: 'center',
				paddingVertical: 12, // matches StatRow paddingVertical
				paddingHorizontal: 16, // matches StatRow paddingHorizontal
				borderBottomWidth: isLast ? 0 : 1,
				borderBottomColor: borderColor,
			}}
		>
			{/* Icon skeleton - matches exact StatRow icon */}
			<View
				style={{
					width: 20,
					height: 20,
					backgroundColor: skeletonColor,
					borderRadius: 10,
				}}
			/>

			{/* Content skeleton - matches StatRow flex: 1, marginLeft: 12 */}
			<View style={{ flex: 1, marginLeft: 12 }}>
				<View
					style={{
						height: 17, // fontSize 14 * fontWeight '500' ≈ 17
						width: '65%',
						backgroundColor: skeletonColor,
						borderRadius: 4,
						marginBottom: showSubtitle ? 2 : 0, // matches marginTop: 2 in StatRow subtitle
					}}
				/>
				{showSubtitle && (
					<View
						style={{
							height: 14, // fontSize 12 ≈ 14
							width: '45%',
							backgroundColor: skeletonColor,
							borderRadius: 4,
						}}
					/>
				)}
			</View>

			{/* Value skeleton - matches StatRow value styling */}
			<View
				style={{
					height: 19, // fontSize 16 * fontWeight 'bold' ≈ 19
					width: '25%',
					backgroundColor: skeletonColor,
					borderRadius: 4,
				}}
			/>
		</View>
	);
};

export default StatRowSkeleton;
