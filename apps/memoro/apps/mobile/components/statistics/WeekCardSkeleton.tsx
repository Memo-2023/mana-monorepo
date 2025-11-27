import React from 'react';
import { View } from 'react-native';
import { useTheme } from '~/features/theme/ThemeProvider';
import colors from '~/tailwind.config.js';

/**
 * Skeleton loader for WeekCard component
 */
const WeekCardSkeleton: React.FC = () => {
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
				padding: 16,
				marginBottom: 12,
			}}
		>
			{/* Header with week title and dates */}
			<View
				style={{
					flexDirection: 'row',
					justifyContent: 'space-between',
					alignItems: 'center',
					marginBottom: 16,
				}}
			>
				{/* Week title skeleton */}
				<View
					style={{
						height: 18,
						width: '35%',
						backgroundColor: skeletonColor,
						borderRadius: 4,
					}}
				/>

				{/* Date range skeleton */}
				<View
					style={{
						height: 14,
						width: '40%',
						backgroundColor: skeletonColor,
						borderRadius: 4,
					}}
				/>
			</View>

			{/* Stats grid */}
			<View
				style={{
					flexDirection: 'row',
					justifyContent: 'space-between',
				}}
			>
				{/* 4 stat columns */}
				{[1, 2, 3, 4].map((index) => (
					<View
						key={index}
						style={{
							flex: 1,
							alignItems: 'center',
							marginHorizontal: 4,
						}}
					>
						{/* Stat value skeleton */}
						<View
							style={{
								height: 20,
								width: '80%',
								backgroundColor: skeletonColor,
								borderRadius: 4,
								marginBottom: 4,
							}}
						/>

						{/* Stat label skeleton */}
						<View
							style={{
								height: 12,
								width: '90%',
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

export default WeekCardSkeleton;
