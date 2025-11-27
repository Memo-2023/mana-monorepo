import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '~/contexts/ThemeContext';

interface ImageCountSelectorProps {
	value: number;
	onChange: (count: number) => void;
	max?: number;
	min?: number;
	disabled?: boolean;
	style?: 'pills' | 'counter' | 'compact';
	label?: string;
}

export function ImageCountSelector({
	value,
	onChange,
	max = 5,
	min = 1,
	disabled = false,
	style = 'pills',
	label = 'Varianten',
}: ImageCountSelectorProps) {
	const { theme } = useTheme();
	const counts = Array.from({ length: max - min + 1 }, (_, i) => min + i);

	if (style === 'pills') {
		return (
			<View>
				{label && (
					<View className="mb-2 flex-row items-center">
						<Ionicons name="layers-outline" size={16} color={theme.colors.text.tertiary} />
						<Text
							style={{
								fontSize: 14,
								fontWeight: '500',
								color: theme.colors.text.secondary,
								marginLeft: 4,
							}}
						>
							{label}
						</Text>
						{value > 1 && (
							<View
								style={{
									marginLeft: 8,
									paddingHorizontal: 8,
									paddingVertical: 2,
									backgroundColor: `${theme.colors.primary.default}30`,
									borderRadius: 9999,
								}}
							>
								<Text style={{ fontSize: 12, color: theme.colors.primary.default }}>
									{value} Bilder
								</Text>
							</View>
						)}
					</View>
				)}
				<View className="flex-row space-x-2">
					{counts.map((count) => (
						<Pressable
							key={count}
							onPress={() => !disabled && onChange(count)}
							disabled={disabled}
							style={{
								width: 48,
								height: 48,
								borderRadius: 8,
								borderWidth: 1,
								alignItems: 'center',
								justifyContent: 'center',
								backgroundColor:
									value === count ? theme.colors.primary.default : theme.colors.surface,
								borderColor: value === count ? theme.colors.primary.default : theme.colors.border,
								opacity: disabled ? 0.5 : 1,
							}}
						>
							<Text
								style={{
									fontSize: 16,
									fontWeight: '500',
									color: value === count ? '#FFFFFF' : theme.colors.text.secondary,
								}}
							>
								{count}
							</Text>
						</Pressable>
					))}
				</View>
				{value > 1 && (
					<Text style={{ fontSize: 12, color: theme.colors.text.tertiary, marginTop: 8 }}>
						Jedes Bild wird mit einem anderen Seed generiert
					</Text>
				)}
			</View>
		);
	}

	if (style === 'counter') {
		return (
			<View>
				{label && (
					<Text
						style={{
							fontSize: 14,
							fontWeight: '500',
							color: theme.colors.text.secondary,
							marginBottom: 8,
						}}
					>
						{label}
					</Text>
				)}
				<View
					style={{
						flexDirection: 'row',
						alignItems: 'center',
						backgroundColor: theme.colors.surface,
						borderRadius: 8,
						padding: 8,
					}}
				>
					<Pressable
						onPress={() => !disabled && value > min && onChange(value - 1)}
						disabled={disabled || value <= min}
						style={{ padding: 8, opacity: disabled || value <= min ? 0.3 : 1 }}
					>
						<Ionicons name="remove-circle" size={24} color={theme.colors.primary.default} />
					</Pressable>

					<View className="flex-1 items-center">
						<Text style={{ fontSize: 18, fontWeight: 'bold', color: theme.colors.text.primary }}>
							{value}
						</Text>
						<Text style={{ fontSize: 12, color: theme.colors.text.tertiary }}>
							{value === 1 ? 'Bild' : 'Bilder'}
						</Text>
					</View>

					<Pressable
						onPress={() => !disabled && value < max && onChange(value + 1)}
						disabled={disabled || value >= max}
						style={{ padding: 8, opacity: disabled || value >= max ? 0.3 : 1 }}
					>
						<Ionicons name="add-circle" size={24} color={theme.colors.primary.default} />
					</Pressable>
				</View>
			</View>
		);
	}

	// Compact style for QuickGenerateBar - full width with 3 equal parts
	return (
		<View
			style={{
				flexDirection: 'row',
				alignItems: 'center',
				backgroundColor: theme.colors.input,
				borderWidth: 1,
				borderColor: theme.colors.border,
				borderRadius: 8,
				overflow: 'hidden',
			}}
		>
			<Pressable
				onPress={() => !disabled && value > min && onChange(value - 1)}
				disabled={disabled || value <= min}
				style={{
					flex: 1,
					alignItems: 'center',
					justifyContent: 'center',
					paddingVertical: 12,
					opacity: disabled || value <= min ? 0.3 : 1,
					backgroundColor: theme.colors.input,
				}}
			>
				<Ionicons name="remove" size={24} color={theme.colors.primary.default} />
			</Pressable>

			<View
				style={{
					flex: 1,
					alignItems: 'center',
					justifyContent: 'center',
					paddingVertical: 12,
					borderLeftWidth: 1,
					borderRightWidth: 1,
					borderColor: theme.colors.border,
				}}
			>
				<Text
					style={{
						fontSize: 20,
						fontWeight: '600',
						color: theme.colors.text.primary,
					}}
				>
					{value}
				</Text>
			</View>

			<Pressable
				onPress={() => !disabled && value < max && onChange(value + 1)}
				disabled={disabled || value >= max}
				style={{
					flex: 1,
					alignItems: 'center',
					justifyContent: 'center',
					paddingVertical: 12,
					opacity: disabled || value >= max ? 0.3 : 1,
					backgroundColor: theme.colors.input,
				}}
			>
				<Ionicons name="add" size={24} color={theme.colors.primary.default} />
			</Pressable>
		</View>
	);
}
