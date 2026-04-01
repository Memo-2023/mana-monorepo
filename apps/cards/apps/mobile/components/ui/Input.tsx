import React, { useState } from 'react';
import { TextInput, View, Text, Pressable, TextInputProps } from 'react-native';
import { Icon } from './Icon';

export interface InputProps extends TextInputProps {
	label?: string;
	error?: string;
	leftIcon?: string;
	rightIcon?: string;
	onLeftIconPress?: () => void;
	onRightIconPress?: () => void;
	containerClassName?: string;
	inputClassName?: string;
	type?: 'text' | 'email' | 'password';
}

export const Input = React.forwardRef<TextInput, InputProps>(
	(
		{
			label,
			error,
			leftIcon,
			rightIcon,
			onLeftIconPress,
			onRightIconPress,
			containerClassName = '',
			inputClassName = '',
			type = 'text',
			secureTextEntry,
			...props
		},
		ref
	) => {
		const [showPassword, setShowPassword] = useState(false);
		const isPassword = type === 'password';

		const getKeyboardType = () => {
			if (type === 'email') return 'email-address';
			return props.keyboardType || 'default';
		};

		const getAutoCapitalize = () => {
			if (type === 'email') return 'none';
			return props.autoCapitalize || 'sentences';
		};

		return (
			<View className={`mb-4 ${containerClassName}`}>
				{label && <Text className="mb-1.5 text-sm font-medium text-gray-700">{label}</Text>}

				<View
					className={`
            flex-row items-center
            rounded-lg border px-3 py-2
            ${error ? 'border-red-500' : 'border-gray-300'}
            ${props.editable === false ? 'bg-gray-100' : 'bg-white'}
          `}
				>
					{leftIcon && (
						<Pressable
							onPress={onLeftIconPress}
							disabled={!onLeftIconPress}
							style={[{ marginRight: 8 }, ({ pressed }) => pressed && { opacity: 0.7 }]}
						>
							<Icon name={leftIcon} size={20} color="#6B7280" library="Ionicons" />
						</Pressable>
					)}

					<TextInput
						ref={ref}
						className={`flex-1 text-base text-gray-900 ${inputClassName}`}
						placeholderTextColor="#9CA3AF"
						keyboardType={getKeyboardType()}
						autoCapitalize={getAutoCapitalize()}
						secureTextEntry={isPassword && !showPassword}
						{...props}
					/>

					{isPassword && (
						<Pressable
							onPress={() => setShowPassword(!showPassword)}
							className="p-1"
							style={({ pressed }) => pressed && { opacity: 0.7 }}
						>
							<Icon
								name={showPassword ? 'eye-outline' : 'eye-off-outline'}
								size={20}
								color="#6B7280"
								library="Ionicons"
							/>
						</Pressable>
					)}

					{rightIcon && !isPassword && (
						<Pressable
							onPress={onRightIconPress}
							disabled={!onRightIconPress}
							className="p-1"
							style={({ pressed }) => pressed && { opacity: 0.7 }}
						>
							<Icon name={rightIcon} size={20} color="#6B7280" library="Ionicons" />
						</Pressable>
					)}
				</View>

				{error && <Text className="mt-1 text-sm text-red-500">{error}</Text>}
			</View>
		);
	}
);

Input.displayName = 'Input';
