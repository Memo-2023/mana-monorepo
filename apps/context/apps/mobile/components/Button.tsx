import { forwardRef } from 'react';
import { Text, TouchableOpacity, TouchableOpacityProps, View } from 'react-native';

type ButtonProps = {
	title: string;
	textClassName?: string;
	children?: React.ReactNode;
} & TouchableOpacityProps;

export const Button = forwardRef<View, ButtonProps>(
	({ title, textClassName, children, ...touchableProps }, ref) => {
		return (
			<TouchableOpacity
				ref={ref}
				{...touchableProps}
				className={`${styles.button} ${touchableProps.className}`}
			>
				<View className="flex-row items-center justify-center">
					<Text className={`${styles.buttonText} ${textClassName || ''}`}>{title}</Text>
					{children}
				</View>
			</TouchableOpacity>
		);
	}
);

const styles = {
	button: 'items-center bg-indigo-500 rounded-[28px] shadow-md p-4',
	buttonText: 'text-white text-lg font-semibold text-center',
};
