import React from 'react';
import { View } from 'react-native';
import { useTheme } from '~/utils/theme/theme';
import { Skeleton } from '~/components/ui/Skeleton';
import { useWindowDimensions } from 'react-native';

interface SpaceDetailSkeletonProps {
	documentCount?: number;
}

/**
 * Skeleton-Komponente für Space-Details während des Ladens
 */
export const SpaceDetailSkeleton: React.FC<SpaceDetailSkeletonProps> = ({ documentCount = 3 }) => {
	const { isDark } = useTheme();
	const { width } = useWindowDimensions();
	const isDesktop = width > 1024;

	return (
		<View
			style={{
				maxWidth: isDesktop ? 800 : '100%',
				width: '100%',
				marginHorizontal: 'auto',
				paddingHorizontal: 16,
			}}
		>
			{/* Space-Informationen Skeleton */}
			<View style={{ marginBottom: 24 }}>
				{/* Titel */}
				<Skeleton width={250} height={28} style={{ marginBottom: 8 }} />

				{/* Beschreibung */}
				<View style={{ marginBottom: 16 }}>
					<Skeleton width={'100%'} height={16} style={{ marginBottom: 4 }} />
					<Skeleton width={'80%'} height={16} style={{ marginBottom: 4 }} />
				</View>

				{/* Tags */}
				<View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
					<Skeleton width={60} height={24} borderRadius={9999} />
					<Skeleton width={80} height={24} borderRadius={9999} />
					<Skeleton width={70} height={24} borderRadius={9999} />
				</View>

				{/* Dokument-Anzahl und Bearbeiten-Button */}
				<View
					style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}
				>
					<Skeleton width={100} height={14} />
					<Skeleton width={32} height={32} borderRadius={16} />
				</View>
			</View>

			{/* Buttons */}
			<View
				style={{
					flexDirection: 'row',
					justifyContent: 'flex-start',
					alignItems: 'center',
					marginBottom: 16,
				}}
			>
				<Skeleton width={80} height={36} borderRadius={4} style={{ marginRight: 8 }} />
				<Skeleton width={140} height={36} borderRadius={4} />
			</View>

			{/* Dokumenttyp-Filter Skeleton */}
			<View style={{ flexDirection: 'row', marginBottom: 16 }}>
				<Skeleton width={80} height={28} borderRadius={14} style={{ marginRight: 8 }} />
				<Skeleton width={80} height={28} borderRadius={14} style={{ marginRight: 8 }} />
				<Skeleton width={80} height={28} borderRadius={14} />
			</View>

			{/* Dokument-Karten Skeleton */}
			{Array.from({ length: documentCount }).map((_, index) => (
				<View
					key={`document-skeleton-${index}`}
					style={{
						padding: 16,
						borderRadius: 8,
						marginBottom: 12,
						backgroundColor: isDark ? '#1f2937' : '#ffffff',
						borderWidth: 1,
						borderColor: isDark ? '#374151' : '#e5e7eb',
					}}
				>
					{/* Dokument-Typ Badge */}
					<Skeleton width={80} height={20} borderRadius={4} style={{ marginBottom: 8 }} />

					{/* Titel */}
					<Skeleton width={'80%'} height={20} style={{ marginBottom: 12 }} />

					{/* Inhalt */}
					<Skeleton width={'100%'} height={16} style={{ marginBottom: 4 }} />
					<Skeleton width={'90%'} height={16} style={{ marginBottom: 4 }} />
					<Skeleton width={'60%'} height={16} style={{ marginBottom: 12 }} />

					{/* Datum und Aktionen */}
					<View
						style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}
					>
						<Skeleton width={120} height={14} />
						<Skeleton width={32} height={32} borderRadius={16} />
					</View>
				</View>
			))}
		</View>
	);
};
