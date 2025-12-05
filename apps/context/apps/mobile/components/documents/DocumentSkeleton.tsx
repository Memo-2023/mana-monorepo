import React from 'react';
import { View, useWindowDimensions, Dimensions } from 'react-native';
import { useTheme } from '~/utils/theme/theme';
import { Skeleton } from '~/components/ui/Skeleton';

interface DocumentSkeletonProps {
	isPreview?: boolean;
}

/**
 * Skeleton-Komponente für die Dokumentansicht während des Ladens - maximal vereinfacht
 */
export const DocumentSkeleton: React.FC<DocumentSkeletonProps> = ({ isPreview = true }) => {
	const { isDark } = useTheme();
	const { width } = useWindowDimensions();
	const isDesktop = width > 1024;

	return (
		<View
			style={{
				flex: 1,
				width: '100%',
				backgroundColor: isDark ? '#111827' : '#f9fafb',
			}}
		>
			{/* Header - minimal */}
			<View
				style={{
					width: '100%',
					height: 50,
					borderBottomWidth: 1,
					borderBottomColor: isDark ? '#374151' : '#e5e7eb',
				}}
			/>

			{/* Hauptinhalt */}
			<View
				style={{
					flex: 1,
					marginHorizontal: 'auto',
					maxWidth: isDesktop ? 800 : '100%',
					width: '100%',
				}}
			>
				<View
					style={{
						flex: 1,
						backgroundColor: isDark ? '#1f2937' : '#ffffff',
						borderWidth: 1,
						borderColor: isDark ? '#374151' : '#e5e7eb',
						borderRadius: 0,
						marginTop: 16,
					}}
				/>
			</View>
		</View>
	);
};
