import React from 'react';
import { View, Pressable, ViewStyle, PressableProps } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from '../../ui/Text';
import { Icon } from '../../ui/Icon';

export type HeaderProps = {
	/** Header title */
	title?: string;
	/** Show back button on the left */
	showBackButton?: boolean;
	/** Back button press handler */
	onBackPress?: () => void;
	/** Custom left content (overrides back button) */
	leftContent?: React.ReactNode;
	/** Custom right content */
	rightContent?: React.ReactNode;
	/** Background color */
	backgroundColor?: string;
	/** Border color */
	borderColor?: string;
	/** Title color */
	titleColor?: string;
	/** Back button icon color */
	backIconColor?: string;
	/** Show border at bottom */
	showBorder?: boolean;
	/** Use safe area insets */
	useSafeArea?: boolean;
	/** Additional styles */
	style?: ViewStyle;
};

export function Header({
	title,
	showBackButton = false,
	onBackPress,
	leftContent,
	rightContent,
	backgroundColor = '#FFFFFF',
	borderColor = '#E5E7EB',
	titleColor = '#111827',
	backIconColor = '#3B82F6',
	showBorder = true,
	useSafeArea = true,
	style,
}: HeaderProps) {
	const insets = useSafeAreaInsets();

	return (
		<View
			style={[
				{
					backgroundColor,
					borderBottomWidth: showBorder ? 1 : 0,
					borderBottomColor: borderColor,
					paddingTop: useSafeArea ? insets.top : 0,
				},
				style,
			]}
		>
			<View
				style={{
					flexDirection: 'row',
					alignItems: 'center',
					justifyContent: 'space-between',
					paddingHorizontal: 16,
					paddingVertical: 12,
					minHeight: 56,
				}}
			>
				{/* Left side - Back button or custom content */}
				<View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
					{leftContent ? (
						leftContent
					) : showBackButton && onBackPress ? (
						<Pressable
							onPress={onBackPress}
							style={({ pressed }) => ({
								marginRight: 12,
								padding: 8,
								marginLeft: -8,
								opacity: pressed ? 0.7 : 1,
							})}
							hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
						>
							<Icon name="chevron-back" size={24} color={backIconColor} />
						</Pressable>
					) : null}

					{/* Title */}
					{title && (
						<Text variant="h4" weight="semibold" color={titleColor}>
							{title}
						</Text>
					)}
				</View>

				{/* Right side - Custom content */}
				{rightContent && (
					<View style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 12 }}>
						{rightContent}
					</View>
				)}
			</View>
		</View>
	);
}
