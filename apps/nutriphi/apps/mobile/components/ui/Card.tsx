import React from 'react';
import { View, ViewProps } from 'react-native';

interface CardProps extends ViewProps {
	variant?: 'default' | 'elevated' | 'outline';
	children: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({
	variant = 'default',
	children,
	className,
	...props
}) => {
	const baseStyles = 'rounded-xl p-4 bg-white';

	const variantStyles = {
		default: 'border border-gray-100',
		elevated: 'shadow-lg shadow-gray-200',
		outline: 'border-2 border-gray-200',
	};

	const combinedClassName = `${baseStyles} ${variantStyles[variant]} ${className || ''}`;

	return (
		<View className={combinedClassName} {...props}>
			{children}
		</View>
	);
};
