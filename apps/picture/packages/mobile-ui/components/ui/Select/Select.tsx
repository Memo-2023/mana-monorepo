import React, { useState } from 'react';
import {
	View,
	ScrollView,
	Pressable,
	ActivityIndicator,
	ViewStyle,
	PressableProps,
} from 'react-native';
import { Text } from '../Text';
import { Icon } from '../Icon';

export type SelectOption = {
	id: string;
	label: string;
	subtitle?: string;
	icon?: string;
	description?: string;
};

export type SelectProps = {
	/** Options to display */
	options: SelectOption[];
	/** Currently selected option ID */
	selectedId: string | null;
	/** Callback when option is selected */
	onSelect: (option: SelectOption) => void;
	/** Show loading state */
	loading?: boolean;
	/** Error message */
	error?: string | null;
	/** Retry callback for error state */
	onRetry?: () => void;
	/** Disable selection */
	disabled?: boolean;
	/** Minimum width for each option */
	minWidth?: number;
	/** Title above options */
	title?: string;
	/** Background color for unselected options */
	backgroundColor?: string;
	/** Border color for unselected options */
	borderColor?: string;
	/** Background color for selected option */
	selectedBackgroundColor?: string;
	/** Border color for selected option */
	selectedBorderColor?: string;
	/** Text color for unselected options */
	textColor?: string;
	/** Text color for selected option */
	selectedTextColor?: string;
	/** Additional styles */
	style?: ViewStyle;
};

export function Select({
	options,
	selectedId,
	onSelect,
	loading = false,
	error = null,
	onRetry,
	disabled = false,
	minWidth = 160,
	title,
	backgroundColor = '#FFFFFF',
	borderColor = '#E5E7EB',
	selectedBackgroundColor = '#3B82F6',
	selectedBorderColor = '#3B82F6',
	textColor = '#111827',
	selectedTextColor = '#FFFFFF',
	style,
}: SelectProps) {
	const [showInfo, setShowInfo] = useState(false);

	// Loading state
	if (loading) {
		return (
			<View
				style={[
					{
						flexDirection: 'row',
						alignItems: 'center',
						justifyContent: 'center',
						padding: 20,
						backgroundColor,
						borderRadius: 12,
					},
					style,
				]}
			>
				<ActivityIndicator size="small" color={selectedBackgroundColor} />
				<Text variant="body" color="#6B7280" style={{ marginLeft: 12 }}>
					Loading...
				</Text>
			</View>
		);
	}

	// Error state
	if (error || options.length === 0) {
		return (
			<View
				style={[
					{
						padding: 20,
						backgroundColor,
						borderRadius: 12,
						alignItems: 'center',
					},
					style,
				]}
			>
				<Text variant="body" color="#9CA3AF" style={{ textAlign: 'center' }}>
					{error || 'No options available'}
				</Text>
				{onRetry && (
					<Pressable
						onPress={onRetry}
						style={{
							marginTop: 12,
							backgroundColor: selectedBackgroundColor,
							paddingVertical: 8,
							paddingHorizontal: 16,
							borderRadius: 8,
						}}
					>
						<Text variant="body" color={selectedTextColor}>
							Retry
						</Text>
					</Pressable>
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
		<View style={style}>
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
						<Text variant="body" weight="semibold" color={textColor}>
							{title}
						</Text>
					)}
					{hasDetails && (
						<Pressable
							onPress={() => setShowInfo(!showInfo)}
							style={{
								flexDirection: 'row',
								alignItems: 'center',
								padding: 4,
							}}
						>
							<Icon
								name={showInfo ? 'information-circle' : 'information-circle-outline'}
								size={24}
								color="#6B7280"
							/>
							<Text variant="body" color="#6B7280" style={{ marginLeft: 4 }}>
								{showInfo ? 'Hide Info' : 'Info'}
							</Text>
						</Pressable>
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
						<Pressable
							key={option.id}
							onPress={() => !disabled && onSelect(option)}
							disabled={disabled}
							style={({ pressed }) => ({
								backgroundColor: isSelected ? selectedBackgroundColor : backgroundColor,
								borderWidth: 2,
								borderColor: isSelected ? selectedBorderColor : borderColor,
								borderRadius: 12,
								padding: 16,
								marginHorizontal: 4,
								minWidth: minWidth,
								opacity: disabled ? 0.5 : pressed ? 0.7 : 1,
								alignItems: 'center',
							})}
						>
							{option.icon && <Text style={{ fontSize: 28, marginBottom: 8 }}>{option.icon}</Text>}

							<Text
								variant="body"
								weight="semibold"
								color={isSelected ? selectedTextColor : textColor}
								style={{ marginBottom: showInfo && option.subtitle ? 4 : 0 }}
								numberOfLines={1}
							>
								{option.label}
							</Text>

							{showInfo && option.subtitle && (
								<Text variant="caption" color={isSelected ? '#93C5FD' : '#9CA3AF'}>
									{option.subtitle}
								</Text>
							)}
						</Pressable>
					);
				})}
			</ScrollView>

			{showInfo && selectedOption?.description && (
				<View
					style={{
						marginTop: 16,
						padding: 16,
						backgroundColor,
						borderRadius: 12,
					}}
				>
					<Text variant="caption" color="#6B7280">
						{selectedOption.description}
					</Text>
				</View>
			)}
		</View>
	);
}
