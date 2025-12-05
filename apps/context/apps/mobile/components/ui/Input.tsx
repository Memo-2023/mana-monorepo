import { TextInput, TextInputProps, View } from 'react-native';
import { forwardRef } from 'react';
import { Text } from './Text';

type InputProps = {
	label?: string;
	error?: string;
	helper?: string;
} & TextInputProps;

export const Input = forwardRef<TextInput, InputProps>(
	({ label, error, helper, className, ...props }, ref) => {
		return (
			<View className="mb-4">
				{label && (
					<Text variant="label" className="mb-1">
						{label}
					</Text>
				)}
				<TextInput
					ref={ref}
					className={`bg-white dark:bg-gray-800 border rounded-lg p-3 text-gray-900 dark:text-white ${
						error ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
					} ${className || ''}`}
					placeholderTextColor="#9CA3AF"
					{...props}
				/>
				{error && <Text className="text-red-500 text-xs mt-1">{error}</Text>}
				{helper && !error && <Text className="text-gray-500 text-xs mt-1">{helper}</Text>}
			</View>
		);
	}
);
