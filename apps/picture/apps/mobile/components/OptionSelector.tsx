import React, { ReactNode, useState } from 'react';
import { View, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from './Text';
import { Button } from './Button';
import { useTheme } from '~/contexts/ThemeContext';

export type OptionItem = {
	id: string;
	label: string;
	subtitle?: string;
	icon?: string;
	description?: string;
};

type OptionSelectorProps = {
	options: OptionItem[];
	selectedId: string | null;
	onSelect: (option: OptionItem) => void;
	loading?: boolean;
	error?: string | null;
	onRetry?: () => void;
	disabled?: boolean;
	minWidth?: number;
	title?: string;
};

export function OptionSelector({
	options,
	selectedId,
	onSelect,
	loading = false,
	error = null,
	onRetry,
	disabled = false,
	minWidth = 160,
	title,
}: OptionSelectorProps) {
	const { theme } = useTheme();
	const [showInfo, setShowInfo] = useState(false);

	// Loading state
	if (loading) {
		return (
			<View
				style={{
					flexDirection: 'row',
					alignItems: 'center',
					justifyContent: 'center',
					padding: 20,
					backgroundColor: theme.colors.surface,
					borderRadius: 12,
				}}
			>
				<ActivityIndicator size="small" color={theme.colors.primary.default} />
				<Text variant="body" color="secondary" style={{ marginLeft: 12 }}>
					Lade...
				</Text>
			</View>
		);
	}

	// Error state
	if (error || options.length === 0) {
		return (
			<View
				style={{
					padding: 20,
					backgroundColor: theme.colors.surface,
					borderRadius: 12,
					alignItems: 'center',
				}}
			>
				<Text variant="body" color="tertiary" align="center">
					{error || 'Keine Optionen verfügbar'}
				</Text>
				{onRetry && (
					<Button
						title="Erneut laden"
						onPress={onRetry}
						size="sm"
						variant="secondary"
						style={{ marginTop: 12 }}
					/>
				)}
			</View>
		);
	}

	// Find selected option for description
	const selectedOption = options.find((opt) => opt.id === selectedId);

	// Check if any option has subtitle or description
	const hasDetails = options.some((opt) => opt.subtitle || opt.description);

	// Success state - show options
	return (
		<View>
			{/* Header with Title and Info Icon */}
			{(title || hasDetails) && (
				<View
					style={{
						flexDirection: 'row',
						justifyContent: 'space-between',
						alignItems: 'center',
						marginBottom: 12,
					}}
				>
					{title && (
						<Text variant="body" weight="semibold" color="primary">
							{title}
						</Text>
					)}
					{hasDetails && (
						<TouchableOpacity
							onPress={() => setShowInfo(!showInfo)}
							style={{
								flexDirection: 'row',
								alignItems: 'center',
								padding: 4,
							}}
						>
							<Ionicons
								name={showInfo ? 'information-circle' : 'information-circle-outline'}
								size={24}
								color={theme.colors.text.secondary}
							/>
							<Text variant="body" color="secondary" style={{ marginLeft: 4 }}>
								{showInfo ? 'Info ausblenden' : 'Info'}
							</Text>
						</TouchableOpacity>
					)}
				</View>
			)}

			<ScrollView
				horizontal
				showsHorizontalScrollIndicator={false}
				style={{ marginHorizontal: -4 }}
			>
				{options.map((option) => {
					const isSelected = selectedId === option.id;

					return (
						<TouchableOpacity
							key={option.id}
							onPress={() => !disabled && onSelect(option)}
							disabled={disabled}
							activeOpacity={0.7}
							style={{
								backgroundColor: isSelected ? theme.colors.primary.default : theme.colors.surface,
								borderWidth: 2,
								borderColor: isSelected ? theme.colors.primary.default : theme.colors.border,
								borderRadius: 12,
								padding: 16,
								marginHorizontal: 4,
								minWidth: minWidth,
								opacity: disabled ? 0.5 : 1,
								alignItems: 'center',
							}}
						>
							{option.icon && <Text style={{ fontSize: 28, marginBottom: 8 }}>{option.icon}</Text>}

							<Text
								variant="body"
								weight="semibold"
								style={{
									color: isSelected ? theme.colors.text.inverse : theme.colors.text.primary,
									marginBottom: showInfo && option.subtitle ? 4 : 0,
								}}
								numberOfLines={1}
							>
								{option.label}
							</Text>

							{showInfo && option.subtitle && (
								<Text
									variant="caption"
									style={{
										color: isSelected ? theme.colors.primary.light : theme.colors.text.tertiary,
									}}
								>
									{option.subtitle}
								</Text>
							)}
						</TouchableOpacity>
					);
				})}
			</ScrollView>

			{showInfo && selectedOption?.description && (
				<View
					style={{
						marginTop: 16,
						padding: 16,
						backgroundColor: theme.colors.surface,
						borderRadius: 12,
					}}
				>
					<Text variant="caption" color="secondary">
						{selectedOption.description}
					</Text>
				</View>
			)}
		</View>
	);
}
