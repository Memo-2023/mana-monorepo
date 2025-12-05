import { View, ViewProps } from 'react-native';
import { ReactNode } from 'react';
import { Text } from '../ui/Text';
import { Button } from '../Button';

type EmptyStateProps = {
	title: string;
	description?: string;
	icon?: ReactNode;
	actionLabel?: string;
	onAction?: () => void;
} & ViewProps;

export const EmptyState = ({
	title,
	description,
	icon,
	actionLabel,
	onAction,
	className,
	...props
}: EmptyStateProps) => {
	return (
		<View className={`items-center justify-center py-12 px-4 ${className || ''}`} {...props}>
			{icon && <View className="mb-4">{icon}</View>}
			<Text variant="h3" className="text-center mb-2">
				{title}
			</Text>
			{description && (
				<Text variant="body" className="text-center text-gray-500 mb-6 max-w-xs">
					{description}
				</Text>
			)}
			{actionLabel && onAction && <Button title={actionLabel} onPress={onAction} />}
		</View>
	);
};
