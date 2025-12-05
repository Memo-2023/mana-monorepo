import React from 'react';
import { View } from 'react-native';
import { useTheme } from '~/utils/theme/theme';
import { Skeleton } from '~/components/ui/Skeleton';

interface SpaceFilterPillSkeletonProps {
	count?: number;
}

/**
 * Skeleton-Komponente für Space-Filter-Pills während des Ladens
 */
export const SpaceFilterPillSkeleton: React.FC<SpaceFilterPillSkeletonProps> = ({ count = 3 }) => {
	const { isDark } = useTheme();

	return (
		<>
			{Array.from({ length: count }).map((_, index) => (
				<View
					key={`space-pill-skeleton-${index}`}
					style={{
						height: 28,
						borderRadius: 14,
						marginRight: 8,
						flexDirection: 'row',
						alignItems: 'center',
						paddingHorizontal: 12,
						backgroundColor: isDark ? '#1f2937' : '#f3f4f6',
						borderWidth: 1,
						borderColor: isDark ? '#374151' : '#e5e7eb',
						overflow: 'hidden',
					}}
				>
					<Skeleton
						width={60 + (index % 3) * 20} // Verschiedene Breiten für natürlicheres Aussehen
						height={14}
						style={{ marginRight: 8 }}
					/>

					{/* Chevron-Icon Skeleton */}
					<View
						style={{
							width: 16,
							height: 16,
							borderRadius: 8,
							marginLeft: 4,
							overflow: 'hidden',
						}}
					>
						<Skeleton width={16} height={16} />
					</View>
				</View>
			))}
		</>
	);
};
