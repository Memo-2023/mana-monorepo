import { Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SymbolView, SFSymbol } from 'expo-symbols';

export type IconProps = {
	name: string;
	size?: number;
	color?: string;
	weight?: 'regular' | 'medium' | 'semibold' | 'bold';
	style?: any;
};

const iconMap: Record<string, string> = {
	'chevron-back': 'chevron.left',
	'chevron-forward': 'chevron.right',
	'chevron-up': 'chevron.up',
	'chevron-down': 'chevron.down',
	'arrow-back': 'arrow.left',
	'arrow-forward': 'arrow.right',
	close: 'xmark',
	menu: 'line.3.horizontal',
	add: 'plus',
	remove: 'minus',
	checkmark: 'checkmark',
	'close-circle': 'xmark.circle.fill',
	search: 'magnifyingglass',
	filter: 'line.3.horizontal.decrease.circle',
	settings: 'gearshape',
	trash: 'trash',
	pencil: 'pencil',
	create: 'square.and.pencil',
	save: 'square.and.arrow.down',
	share: 'square.and.arrow.up',
	refresh: 'arrow.clockwise',
	image: 'photo',
	images: 'photo.stack',
	camera: 'camera',
	heart: 'heart.fill',
	'heart-outline': 'heart',
	star: 'star.fill',
	'star-outline': 'star',
	bookmark: 'bookmark.fill',
	'bookmark-outline': 'bookmark',
	send: 'paperplane.fill',
	mail: 'envelope',
	notifications: 'bell',
	'notifications-outline': 'bell',
	'ellipsis-vertical': 'ellipsis',
	'ellipsis-horizontal': 'ellipsis',
	grid: 'square.grid.2x2',
	list: 'list.bullet',
	eye: 'eye',
	'eye-off': 'eye.slash',
	'information-circle': 'info.circle',
	warning: 'exclamationmark.triangle',
	'alert-circle': 'exclamationmark.circle',
	'checkmark-circle': 'checkmark.circle',
	person: 'person.fill',
	'person-outline': 'person',
	'person-circle': 'person.circle.fill',
	'person-circle-outline': 'person.circle',
	people: 'person.2.fill',
	location: 'location.fill',
	home: 'house.fill',
	'home-outline': 'house',
	time: 'clock',
	calendar: 'calendar',
	today: 'calendar.badge.clock',
	document: 'doc.fill',
	'document-outline': 'doc',
	folder: 'folder.fill',
	'folder-outline': 'folder',
	download: 'arrow.down.circle',
	'cloud-download': 'cloud.fill',
	'cloud-offline': 'cloud.slash',
	'lock-closed': 'lock.fill',
	'lock-open': 'lock.open.fill',
	key: 'key.fill',
	shield: 'shield.fill',
	flame: 'flame.fill',
	sparkles: 'sparkles',
	layers: 'square.stack.3d.up.fill',
	'layers-outline': 'square.stack.3d.up',
	tag: 'tag.fill',
	pricetag: 'tag.fill',
	paintbrush: 'paintbrush.fill',
	'color-palette': 'paintpalette.fill',
};

export function Icon({ name, size = 24, color = '#000', weight = 'regular', style }: IconProps) {
	if (Platform.OS === 'ios') {
		const sfSymbolName = iconMap[name] || name;
		const sfWeight: 'regular' | 'medium' | 'semibold' | 'bold' = weight;

		return (
			<SymbolView
				name={sfSymbolName as SFSymbol}
				size={size}
				tintColor={color}
				weight={sfWeight}
				style={style}
				resizeMode="scaleAspectFit"
			/>
		);
	}

	return <Ionicons name={name as any} size={size} color={color} style={style} />;
}
