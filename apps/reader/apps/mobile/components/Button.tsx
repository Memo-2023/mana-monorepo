import React from 'react';
import { Pressable, PressableProps, ActivityIndicator, View } from 'react-native';
import { Icon, IconName } from './Icon';
import { Text } from './Text';

export type ButtonVariant =
	| 'primary'
	| 'secondary'
	| 'outline'
	| 'ghost'
	| 'link'
	| 'destructive'
	| 'success'
	| 'warning';

export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

interface ButtonProps extends Omit<PressableProps, 'children'> {
	variant?: ButtonVariant;
	size?: ButtonSize;
	icon?: IconName;
	iconPosition?: 'left' | 'right';
	loading?: boolean;
	disabled?: boolean;
	fullWidth?: boolean;
	className?: string;
	children?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
	variant = 'primary',
	size = 'md',
	icon,
	iconPosition = 'left',
	loading = false,
	disabled = false,
	fullWidth = false,
	className,
	children,
	...props
}) => {
	const isDisabled = disabled || loading;

	// Get variant styles
	const getVariantClasses = () => {
		switch (variant) {
			case 'primary':
				return 'bg-blue-600 active:bg-blue-700';
			case 'secondary':
				return 'bg-gray-600 active:bg-gray-700';
			case 'outline':
				return 'border border-gray-300 bg-white active:bg-gray-50';
			case 'ghost':
				return 'bg-transparent active:bg-gray-100';
			case 'link':
				return 'bg-transparent';
			case 'destructive':
				return 'bg-red-600 active:bg-red-700';
			case 'success':
				return 'bg-green-600 active:bg-green-700';
			case 'warning':
				return 'bg-yellow-600 active:bg-yellow-700';
			default:
				return 'bg-blue-600 active:bg-blue-700';
		}
	};

	// Get size styles
	const getSizeClasses = () => {
		switch (size) {
			case 'xs':
				return 'px-2 py-1';
			case 'sm':
				return 'px-3 py-2';
			case 'md':
				return 'px-4 py-3';
			case 'lg':
				return 'px-6 py-4';
			case 'xl':
				return 'px-8 py-5';
			default:
				return 'px-4 py-3';
		}
	};

	// Get text color
	const getTextColor = () => {
		if (isDisabled) return 'muted';
		switch (variant) {
			case 'primary':
			case 'secondary':
			case 'destructive':
			case 'success':
			case 'warning':
				return 'white';
			case 'outline':
			case 'ghost':
				return 'gray';
			case 'link':
				return 'primary';
			default:
				return 'white';
		}
	};

	// Get icon color
	const getIconColor = () => {
		if (isDisabled) return '#9CA3AF';
		switch (variant) {
			case 'primary':
			case 'secondary':
			case 'destructive':
			case 'success':
			case 'warning':
				return '#FFFFFF';
			case 'outline':
			case 'ghost':
				return '#6B7280';
			case 'link':
				return '#2563EB';
			default:
				return '#FFFFFF';
		}
	};

	// Get icon size
	const getIconSize = () => {
		switch (size) {
			case 'xs':
				return 14;
			case 'sm':
				return 16;
			case 'md':
				return 18;
			case 'lg':
				return 20;
			case 'xl':
				return 24;
			default:
				return 18;
		}
	};

	// Get text variant
	const getTextVariant = () => {
		switch (size) {
			case 'xs':
			case 'sm':
				return 'buttonSmall';
			default:
				return 'button';
		}
	};

	const renderContent = () => {
		if (loading) {
			return <ActivityIndicator size="small" color={getIconColor()} />;
		}

		const iconElement = icon ? (
			<Icon name={icon} size={getIconSize()} color={getIconColor()} />
		) : null;

		const textElement = children ? (
			<Text variant={getTextVariant()} color={getTextColor()} align="center">
				{children}
			</Text>
		) : null;

		if (!icon && !children) {
			return null;
		}

		if (icon && !children) {
			return iconElement;
		}

		if (!icon && children) {
			return textElement;
		}

		return (
			<View className="flex-row items-center gap-2">
				{iconPosition === 'left' && iconElement}
				{textElement}
				{iconPosition === 'right' && iconElement}
			</View>
		);
	};

	const buttonClasses = [
		'rounded-lg items-center justify-center',
		getSizeClasses(),
		getVariantClasses(),
		fullWidth ? 'w-full' : '',
		isDisabled ? 'opacity-50' : '',
		className,
	]
		.filter(Boolean)
		.join(' ');

	return (
		<Pressable className={buttonClasses} disabled={isDisabled} {...props}>
			{renderContent()}
		</Pressable>
	);
};
