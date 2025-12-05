import { View, TouchableOpacity, ViewProps } from 'react-native';
import { ReactNode } from 'react';
import { Text } from './Text';

type CardProps = {
	title?: string;
	children: ReactNode;
	onPress?: () => void;
	footer?: ReactNode;
} & ViewProps;

export const Card = ({ title, children, onPress, footer, className, ...props }: CardProps) => {
	const CardContainer = onPress ? TouchableOpacity : View;

	return (
		<CardContainer
			onPress={onPress}
			className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden ${className || ''}`}
			{...props}
		>
			{title && (
				<View className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
					<Text variant="h4">{title}</Text>
				</View>
			)}
			<View className="p-4">{children}</View>
			{footer && (
				<View className="px-4 py-3 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
					{footer}
				</View>
			)}
		</CardContainer>
	);
};
