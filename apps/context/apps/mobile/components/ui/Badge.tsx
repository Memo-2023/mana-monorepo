import { View, ViewProps } from 'react-native';
import { Text } from './Text';

type BadgeVariant = 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info';

type BadgeProps = {
	label: string;
	variant?: BadgeVariant;
} & ViewProps;

export const Badge = ({ label, variant = 'default', className, ...props }: BadgeProps) => {
	const variantStyles = {
		default: 'bg-gray-100 dark:bg-gray-700',
		primary: 'bg-indigo-100 dark:bg-indigo-900',
		success: 'bg-green-100 dark:bg-green-900',
		warning: 'bg-yellow-100 dark:bg-yellow-900',
		danger: 'bg-red-100 dark:bg-red-900',
		info: 'bg-blue-100 dark:bg-blue-900',
	};

	const textStyles = {
		default: 'text-gray-800 dark:text-gray-200',
		primary: 'text-indigo-800 dark:text-indigo-200',
		success: 'text-green-800 dark:text-green-200',
		warning: 'text-yellow-800 dark:text-yellow-200',
		danger: 'text-red-800 dark:text-red-200',
		info: 'text-blue-800 dark:text-blue-200',
	};

	return (
		<View
			className={`px-2 py-1 rounded-full ${variantStyles[variant]} ${className || ''}`}
			{...props}
		>
			<Text className={`text-xs font-medium ${textStyles[variant]}`}>{label}</Text>
		</View>
	);
};
