import React from 'react';
import { ActivityIndicator, View, Text } from 'react-native';

interface LoadingSpinnerProps {
	size?: 'small' | 'large';
	color?: string;
	text?: string;
	overlay?: boolean;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
	size = 'large',
	color = '#6366f1',
	text,
	overlay = false,
}) => {
	const Container = overlay ? View : React.Fragment;
	const containerProps = overlay
		? {
				className: 'absolute inset-0 bg-black/20 flex-1 justify-center items-center z-50',
			}
		: {};

	return (
		<Container {...containerProps}>
			<View className="items-center space-y-2">
				<ActivityIndicator size={size} color={color} />
				{text && <Text className="text-sm text-gray-600">{text}</Text>}
			</View>
		</Container>
	);
};
