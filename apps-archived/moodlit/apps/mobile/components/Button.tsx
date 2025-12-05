import { forwardRef } from 'react';
import { Text, Pressable, PressableProps, View } from 'react-native';

type ButtonProps = {
	title: string;
} & PressableProps;

export const Button = forwardRef<View, ButtonProps>(({ title, ...pressableProps }, ref) => {
	return (
		<Pressable
			ref={ref}
			{...pressableProps}
			className={`${styles.button} ${pressableProps.className}`}
		>
			<Text className={styles.buttonText}>{title}</Text>
		</Pressable>
	);
});

Button.displayName = 'Button';

const styles = {
	button: 'items-center bg-indigo-500 rounded-[28px] shadow-md p-4',
	buttonText: 'text-white text-lg font-semibold text-center',
};
