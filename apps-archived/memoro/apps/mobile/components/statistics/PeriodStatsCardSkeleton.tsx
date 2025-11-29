import React from 'react';
import { View } from 'react-native';
import { useTheme } from '~/features/theme/ThemeProvider';
import colors from '~/tailwind.config.js';

interface PeriodStatsCardSkeletonProps {
	marginBottom?: number;
	showTitle?: boolean;
}

/**
 * Skeleton loader for PeriodStatsCard component
 * Matches exact structure: Title (outside card) + Card with StatRows
 */
const PeriodStatsCardSkeleton: React.FC<PeriodStatsCardSkeletonProps> = ({
	marginBottom = 12,
	showTitle = true,
}) => {
	const { isDark, themeVariant } = useTheme();

	const contentBackgroundColor = isDark
		? (colors as any).theme?.extend?.colors?.dark?.[themeVariant]?.contentBackground
		: (colors as any).theme?.extend?.colors?.[themeVariant]?.contentBackground;
	const borderColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
	const skeletonColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';

	return (
		<>
			{/* Title skeleton - matches PeriodStatsCard title styling */}
			{showTitle && (
				<View
					style={{
						height: 19, // fontSize 16 * lineHeight ≈ 19
						width: '30%',
						backgroundColor: skeletonColor,
						borderRadius: 4,
						marginBottom: 8, // matches marginBottom: 8 in PeriodStatsCard
					}}
				/>
			)}

			{/* Card skeleton - matches exact PeriodStatsCard structure */}
			<View
				style={{
					backgroundColor: contentBackgroundColor,
					borderRadius: 16,
					borderWidth: 1.5,
					borderColor: borderColor,
					overflow: 'hidden',
					marginBottom: marginBottom,
				}}
			>
				{/* StatRow skeletons - matches exact StatRow structure */}
				{[0, 1, 2, 3].map((index) => (
					<View
						key={index}
						style={{
							flexDirection: 'row',
							alignItems: 'center',
							paddingVertical: 12, // matches StatRow paddingVertical
							paddingHorizontal: 16, // matches StatRow paddingHorizontal
							borderBottomWidth: 1,
							borderBottomColor: borderColor,
						}}
					>
						{/* Icon skeleton */}
						<View
							style={{
								width: 20,
								height: 20,
								backgroundColor: skeletonColor,
								borderRadius: 10,
							}}
						/>

						{/* Content area - matches StatRow flex: 1, marginLeft: 12 */}
						<View style={{ flex: 1, marginLeft: 12 }}>
							<View
								style={{
									height: 17, // fontSize 14 * fontWeight '500' ≈ 17
									width: '60%',
									backgroundColor: skeletonColor,
									borderRadius: 4,
								}}
							/>
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
				))}
			</View>
		</>
	);
};

export default PeriodStatsCardSkeleton;
