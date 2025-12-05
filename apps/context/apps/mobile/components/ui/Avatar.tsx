import { View, Image, ViewProps } from 'react-native';
import { Text } from './Text';

type AvatarProps = {
	name: string;
	imageUrl?: string;
	size?: 'sm' | 'md' | 'lg';
} & ViewProps;

export const Avatar = ({ name, imageUrl, size = 'md', className, ...props }: AvatarProps) => {
	const sizeStyles = {
		sm: 'w-8 h-8',
		md: 'w-10 h-10',
		lg: 'w-12 h-12',
	};

	const textSizeStyles = {
		sm: 'text-xs',
		md: 'text-sm',
		lg: 'text-base',
	};

	// Get initials from name
	const initials = name
		.split(' ')
		.map((part) => part[0])
		.join('')
		.substring(0, 2)
		.toUpperCase();

	return (
		<View
			className={`${sizeStyles[size]} rounded-full overflow-hidden ${className || ''}`}
			{...props}
		>
			{imageUrl ? (
				<Image source={{ uri: imageUrl }} className="w-full h-full" accessibilityLabel={name} />
			) : (
				<View className="w-full h-full bg-indigo-500 items-center justify-center">
					<Text className={`${textSizeStyles[size]} text-white font-medium`}>{initials}</Text>
				</View>
			)}
		</View>
	);
};
