import { SymbolView, SymbolViewProps, SymbolWeight } from 'expo-symbols';
import React from 'react';

type IconName =
	| 'settings'
	| 'settings-sliders'
	| 'close'
	| 'sun'
	| 'star'
	| 'star-fill'
	| 'arrow-clockwise'
	| 'chevron-left'
	| 'phone-portrait'
	| 'flashlight'
	| 'play-circle'
	| 'plus-circle'
	| 'square-stack'
	| 'list-bullet'
	| 'pencil'
	| 'trash';

interface IconProps {
	name: IconName;
	size?: number;
	color?: string;
	weight?: SymbolWeight;
}

const iconMap: Record<IconName, string> = {
	settings: 'gearshape',
	'settings-sliders': 'slider.horizontal.3',
	close: 'xmark',
	sun: 'sun.max.fill',
	star: 'star',
	'star-fill': 'star.fill',
	'arrow-clockwise': 'arrow.clockwise',
	'chevron-left': 'chevron.left',
	'phone-portrait': 'iphone',
	flashlight: 'flashlight.on.fill',
	'play-circle': 'play.circle',
	'plus-circle': 'plus.circle.fill',
	'square-stack': 'square.stack.fill',
	'list-bullet': 'list.bullet',
	pencil: 'pencil',
	trash: 'trash',
};

export const Icon = ({ name, size = 24, color = '#FFFFFF', weight = 'regular' }: IconProps) => {
	return (
		<SymbolView
			name={iconMap[name]}
			size={size}
			type="hierarchical"
			tintColor={color}
			weight={weight}
		/>
	);
};
