import React from 'react';
import { View, Text, Image } from 'react-native';

interface AuthorAvatarProps {
	name: string;
	imageUrl?: string;
	size?: 'small' | 'medium' | 'large';
	className?: string;
}

export const AuthorAvatar: React.FC<AuthorAvatarProps> = ({
	name,
	imageUrl,
	size = 'medium',
	className = '',
}) => {
	const getInitials = (fullName: string): string => {
		const parts = fullName.split(' ');
		if (parts.length >= 2) {
			return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
		}
		return fullName.substring(0, 2).toUpperCase();
	};

	const sizeStyles = {
		small: { width: 48, height: 48, fontSize: 18 },
		medium: { width: 64, height: 64, fontSize: 20 },
		large: { width: 128, height: 128, fontSize: 36 },
	};

	const style = sizeStyles[size];

	return (
		<View
			className={`bg-gray-800 items-center justify-center rounded-full ${className}`}
			style={{ width: style.width, height: style.height }}
		>
			{imageUrl ? (
				<Image
					source={{ uri: imageUrl }}
					className="rounded-full"
					style={{ width: style.width, height: style.height }}
				/>
			) : (
				<Text className="text-white font-bold" style={{ fontSize: style.fontSize }}>
					{getInitials(name)}
				</Text>
			)}
		</View>
	);
};
