import React from 'react';
import { View, ViewStyle, DimensionValue } from 'react-native';
import { useTheme } from '~/utils/theme/theme';

interface SkeletonProps {
	width?: DimensionValue;
	height?: DimensionValue;
	borderRadius?: number;
	style?: ViewStyle;
	animated?: boolean;
}

/**
 * Skeleton-Komponente für Ladezustände
 * Zeigt einen pulsierenden Platzhalter an, während Inhalte geladen werden
 */
export const Skeleton: React.FC<SkeletonProps> = ({
	width = '100%',
	height = 16,
	borderRadius = 4,
	style,
	animated = true,
}) => {
	const { isDark } = useTheme();
	const backgroundColor = isDark ? '#374151' : '#e5e7eb';

	// Animation-Styling
	const [opacity, setOpacity] = React.useState(0.7);

	// Einfache Pulsier-Animation
	React.useEffect(() => {
		if (!animated) return;

		let interval: NodeJS.Timeout;
		let increasing = false;

		interval = setInterval(() => {
			setOpacity((prevOpacity) => {
				if (prevOpacity >= 0.9) {
					increasing = false;
				} else if (prevOpacity <= 0.5) {
					increasing = true;
				}
				return increasing ? prevOpacity + 0.02 : prevOpacity - 0.02;
			});
		}, 100);

		return () => clearInterval(interval);
	}, [animated]);

	return (
		<View
			style={[
				{
					width,
					height,
					borderRadius,
					backgroundColor,
					opacity,
				},
				style,
			]}
		/>
	);
};

/**
 * Skeleton-Text-Komponente für Text-Ladezustände
 * Zeigt mehrere Zeilen von Skeleton-Elementen an
 */
export const SkeletonText: React.FC<{
	lines?: number;
	lineHeight?: number;
	spacing?: number;
	width?: DimensionValue[];
	style?: ViewStyle;
	animated?: boolean;
}> = ({ lines = 3, lineHeight = 16, spacing = 8, width = ['100%'], style, animated = true }) => {
	return (
		<View style={style}>
			{Array.from({ length: lines }).map((_, index) => (
				<Skeleton
					key={index}
					height={lineHeight}
					width={width[index % width.length]}
					style={{ marginBottom: index < lines - 1 ? spacing : 0 }}
					animated={animated}
				/>
			))}
		</View>
	);
};
