import React from 'react';
import { FontAwesome, Ionicons, MaterialIcons, Feather } from '@expo/vector-icons';
import { StyleProp, ViewStyle } from 'react-native';

type IconLibrary = 'FontAwesome' | 'Ionicons' | 'MaterialIcons' | 'Feather';

interface IconProps {
	name: string;
	size?: number;
	color?: string;
	library?: IconLibrary;
	className?: string;
	style?: StyleProp<ViewStyle>;
}

export const Icon: React.FC<IconProps> = ({
	name,
	size = 24,
	color,
	library = 'FontAwesome',
	...props
}) => {
	const iconProps = {
		size,
		color,
		...props,
	};

	switch (library) {
		case 'Ionicons':
			return <Ionicons name={name as any} {...iconProps} />;
		case 'MaterialIcons':
			return <MaterialIcons name={name as any} {...iconProps} />;
		case 'Feather':
			return <Feather name={name as any} {...iconProps} />;
		case 'FontAwesome':
		default:
			return <FontAwesome name={name as any} {...iconProps} />;
	}
};
