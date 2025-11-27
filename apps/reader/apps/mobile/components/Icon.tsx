import React from 'react';
import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export type IconName =
	| 'add'
	| 'delete'
	| 'edit'
	| 'save'
	| 'close'
	| 'back'
	| 'play'
	| 'pause'
	| 'stop'
	| 'refresh'
	| 'settings'
	| 'logout'
	| 'eye'
	| 'eye-off'
	| 'heart'
	| 'heart-outline'
	| 'tag'
	| 'filter'
	| 'search'
	| 'download'
	| 'share'
	| 'volume-high'
	| 'volume-low'
	| 'volume-mute'
	| 'fast-forward'
	| 'rewind'
	| 'skip-forward'
	| 'skip-backward'
	| 'checkmark'
	| 'close-circle'
	| 'alert-circle'
	| 'information-circle'
	| 'chevron-down'
	| 'chevron-up'
	| 'chevron-left'
	| 'chevron-right'
	| 'arrow-back'
	| 'arrow-forward'
	| 'home'
	| 'library'
	| 'person'
	| 'menu'
	| 'more-horizontal'
	| 'more-vertical'
	| 'replay-15'
	| 'forward-15'
	| 'play-circle'
	| 'pause-circle'
	| 'mic-circle';

interface IconProps {
	name: IconName;
	size?: number;
	color?: string;
	className?: string;
}

const iconMapping: Record<IconName, keyof typeof Ionicons.glyphMap> = {
	add: 'add',
	delete: 'trash',
	edit: 'pencil',
	save: 'save',
	close: 'close',
	back: 'arrow-back',
	play: 'play',
	pause: 'pause',
	stop: 'stop',
	refresh: 'refresh',
	settings: 'settings',
	logout: 'log-out',
	eye: 'eye',
	'eye-off': 'eye-off',
	heart: 'heart',
	'heart-outline': 'heart-outline',
	tag: 'pricetag',
	filter: 'filter',
	search: 'search',
	download: 'download',
	share: 'share',
	'volume-high': 'volume-high',
	'volume-low': 'volume-low',
	'volume-mute': 'volume-mute',
	'fast-forward': 'play-forward',
	rewind: 'play-back',
	'skip-forward': 'play-skip-forward',
	'skip-backward': 'play-skip-back',
	checkmark: 'checkmark',
	'close-circle': 'close-circle',
	'alert-circle': 'alert-circle',
	'information-circle': 'information-circle',
	'chevron-down': 'chevron-down',
	'chevron-up': 'chevron-up',
	'chevron-left': 'chevron-back',
	'chevron-right': 'chevron-forward',
	'arrow-back': 'arrow-back',
	'arrow-forward': 'arrow-forward',
	home: 'home',
	library: 'library',
	person: 'person',
	menu: 'menu',
	'more-horizontal': 'ellipsis-horizontal',
	'more-vertical': 'ellipsis-vertical',
	'replay-15': 'refresh-circle',
	'forward-15': 'add-circle',
	'play-circle': 'play-circle',
	'pause-circle': 'pause-circle',
	'mic-circle': 'mic-circle',
};

export const Icon: React.FC<IconProps> = ({ name, size = 24, color = '#000000', className }) => {
	const ionIconName = iconMapping[name];

	if (!ionIconName) {
		console.warn(`Icon "${name}" not found in iconMapping`);
		return null;
	}

	return (
		<View className={className}>
			<Ionicons name={ionIconName} size={size} color={color} />
		</View>
	);
};
