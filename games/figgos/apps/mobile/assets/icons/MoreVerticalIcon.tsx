import React from 'react';
import Svg, { Circle } from 'react-native-svg';
import { ViewStyle } from 'react-native';

interface MoreVerticalIconProps {
	size?: number;
	color?: string;
	style?: ViewStyle;
}

export const MoreVerticalIcon: React.FC<MoreVerticalIconProps> = ({
	size = 24,
	color = '#000',
	style,
}) => {
	const circleRadius = size / 10;
	const centerX = size / 2;
	const spacing = size / 3;

	return (
		<Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={style}>
			{/* Oberer Kreis */}
			<Circle cx={centerX} cy={spacing} r={circleRadius} fill={color} />

			{/* Mittlerer Kreis */}
			<Circle cx={centerX} cy={spacing * 2} r={circleRadius} fill={color} />

			{/* Unterer Kreis */}
			<Circle cx={centerX} cy={spacing * 3} r={circleRadius} fill={color} />
		</Svg>
	);
};
