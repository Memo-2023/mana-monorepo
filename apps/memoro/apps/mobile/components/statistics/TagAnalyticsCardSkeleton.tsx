import React from 'react';
import { View } from 'react-native';
import { useTheme } from '~/features/theme/ThemeProvider';
import colors from '~/tailwind.config.js';
import StatRowSkeleton from './StatRowSkeleton';

/**
 * Skeleton loader for TagAnalyticsCard component
 * Matches exact TagAnalyticsCard structure: 4 StatRows + "Meist genutzte Tags" section
 */
const TagAnalyticsCardSkeleton: React.FC = () => {
	const { isDark, themeVariant } = useTheme();

	const contentBackgroundColor = isDark
		? (colors as any).theme?.extend?.colors?.dark?.[themeVariant]?.contentBackground
		: (colors as any).theme?.extend?.colors?.[themeVariant]?.contentBackground;
	const borderColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
	const skeletonColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';

	return (
		<View
			style={{
				backgroundColor: contentBackgroundColor,
				borderRadius: 16,
				borderWidth: 1.5,
				borderColor: borderColor,
				overflow: 'hidden',
			}}
		>
			{/* Basic tag stats rows - matches exact TagAnalyticsCard StatRows */}
			<StatRowSkeleton />
			<StatRowSkeleton />
			<StatRowSkeleton />
			<StatRowSkeleton />

			{/* Most used tags section - matches exact TagAnalyticsCard mostUsedTags structure */}
			<View
				style={{
					paddingVertical: 12, // matches TagAnalyticsCard paddingVertical
					paddingHorizontal: 16, // matches TagAnalyticsCard paddingHorizontal
					borderBottomWidth: 1,
					borderBottomColor: borderColor,
				}}
			>
				{/* Section title skeleton - matches TagAnalyticsCard title styling */}
				<View
					style={{
						height: 17, // fontSize 14 * fontWeight '500' ≈ 17
						width: '50%',
						backgroundColor: skeletonColor,
						borderRadius: 4,
						marginBottom: 8, // matches marginBottom: 8 in TagAnalyticsCard
					}}
				/>

				{/* Tag items skeleton - matches exact TagAnalyticsCard tag items */}
				{[1, 2, 3].map((index) => (
					<View
						key={index}
						style={{
							flexDirection: 'row',
							alignItems: 'center',
							marginBottom: 4, // matches marginBottom: 4 in TagAnalyticsCard
						}}
					>
						{/* Tag color skeleton - matches exact TagAnalyticsCard color dot */}
						<View
							style={{
								width: 8, // matches width: 8 in TagAnalyticsCard
								height: 8, // matches height: 8 in TagAnalyticsCard
								backgroundColor: skeletonColor,
								borderRadius: 4, // matches borderRadius: 4 in TagAnalyticsCard
								marginRight: 8, // matches marginRight: 8 in TagAnalyticsCard
							}}
						/>

						{/* Tag name skeleton - matches TagAnalyticsCard tag name styling */}
						<View
							style={{
								height: 14, // fontSize 12 ≈ 14
								width: '50%',
								backgroundColor: skeletonColor,
								borderRadius: 4,
								flex: 1, // matches flex: 1 in TagAnalyticsCard
							}}
						/>

						{/* Tag count skeleton - matches TagAnalyticsCard tag count styling */}
						<View
							style={{
								height: 14, // fontSize 12 ≈ 14
								width: '15%',
								backgroundColor: skeletonColor,
								borderRadius: 4,
							}}
						/>
					</View>
				))}
			</View>
		</View>
	);
};

export default TagAnalyticsCardSkeleton;
