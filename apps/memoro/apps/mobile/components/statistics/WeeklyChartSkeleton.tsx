import React from 'react';
import { View } from 'react-native';
import { useTheme } from '~/features/theme/ThemeProvider';
import colors from '~/tailwind.config.js';

/**
 * Skeleton loader for WeeklyChart component
 */
const WeeklyChartSkeleton: React.FC = () => {
	const { isDark, themeVariant } = useTheme();

	const contentBackgroundColor = isDark
		? (colors as any).theme?.extend?.colors?.dark?.[themeVariant]?.contentBackground
		: (colors as any).theme?.extend?.colors?.[themeVariant]?.contentBackground;
	const borderColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
	const skeletonColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';

	// Create skeleton bars with different heights for 12 weeks
	const barHeights = [40, 60, 35, 80, 55, 45, 70, 30, 65, 50, 75, 40];

	return (
		<View
			style={{
				backgroundColor: contentBackgroundColor,
				borderRadius: 16,
				borderWidth: 1.5,
				borderColor: borderColor,
				padding: 16,
				marginBottom: 12,
			}}
		>
			{/* Chart title skeleton */}
			<View
				style={{
					height: 18,
					width: '40%',
					backgroundColor: skeletonColor,
					borderRadius: 4,
					marginBottom: 20,
				}}
			/>

			{/* Chart container */}
			<View
				style={{
					flexDirection: 'row',
					justifyContent: 'space-between',
					alignItems: 'flex-end',
					height: 120,
					marginBottom: 16,
				}}
			>
				{barHeights.map((height, index) => (
					<View
						key={index}
						style={{
							flex: 1,
							alignItems: 'center',
							marginHorizontal: 1,
						}}
					>
						{/* Bar skeleton */}
						<View
							style={{
								width: '90%',
								height: height,
								backgroundColor: skeletonColor,
								borderRadius: 2,
							}}
						/>
					</View>
				))}
			</View>

			{/* Legend skeleton */}
			<View
				style={{
					flexDirection: 'row',
					justifyContent: 'center',
					marginTop: 12,
				}}
			>
				<View
					style={{
						flexDirection: 'row',
						alignItems: 'center',
						marginRight: 20,
					}}
				>
					<View
						style={{
							width: 12,
							height: 12,
							backgroundColor: skeletonColor,
							borderRadius: 6,
							marginRight: 8,
						}}
					/>
					<View
						style={{
							height: 12,
							width: 40,
							backgroundColor: skeletonColor,
							borderRadius: 4,
						}}
					/>
				</View>

				<View
					style={{
						flexDirection: 'row',
						alignItems: 'center',
					}}
				>
					<View
						style={{
							width: 12,
							height: 12,
							backgroundColor: skeletonColor,
							borderRadius: 6,
							marginRight: 8,
						}}
					/>
					<View
						style={{
							height: 12,
							width: 50,
							backgroundColor: skeletonColor,
							borderRadius: 4,
						}}
					/>
				</View>
			</View>
		</View>
	);
};

export default WeeklyChartSkeleton;
