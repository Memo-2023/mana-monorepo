import { forwardRef } from 'react';
import { Text, Pressable, View } from 'react-native';
import { useState } from 'react';
import { useTheme } from '~/utils/ThemeContext';

type ButtonProps = {
	title: string;
	onPress?: () => void;
	disabled?: boolean;
	className?: string;
	style?: any;
};

export const Button = forwardRef<View, ButtonProps>(
	({ title, onPress, disabled, className, style, ...props }, ref) => {
		const [isHovered, setIsHovered] = useState(false);
		const { theme } = useTheme();

		return (
			<Pressable
				ref={ref}
				onPress={onPress}
				disabled={disabled}
				onHoverIn={() => setIsHovered(true)}
				onHoverOut={() => setIsHovered(false)}
				className={`items-center rounded-[28px] shadow-md p-4 transition-colors ${isHovered ? 'opacity-90' : ''} ${disabled ? 'opacity-70' : ''} ${className || ''}`}
				style={[
					{
						backgroundColor: disabled
							? '#9ca3af'
							: isHovered
								? theme.colors.secondary
								: theme.colors.primary,
					},
					style,
				]}
				{...props}
			>
				<Text className="text-white text-lg font-semibold text-center">{title}</Text>
			</Pressable>
		);
	}
);

// Styles werden jetzt direkt im Component mit theme.colors verwendet
