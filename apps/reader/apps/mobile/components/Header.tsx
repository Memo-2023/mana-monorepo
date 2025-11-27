import React from 'react';
import { View, Pressable, Platform, StatusBar } from 'react-native';
import { router } from 'expo-router';
import { Icon } from './Icon';
import { Text } from './Text';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '~/hooks/useTheme';

interface HeaderProps {
	title?: string;
	showBackButton?: boolean;
	rightComponent?: React.ReactNode;
	onBackPress?: () => void;
	backgroundColor?: string;
	textColor?: string;
}

export const Header: React.FC<HeaderProps> = ({
	title,
	showBackButton = true,
	rightComponent,
	onBackPress,
	backgroundColor,
	textColor,
}) => {
	const insets = useSafeAreaInsets();
	const { isDark, colors } = useTheme();

	const handleBackPress = () => {
		if (onBackPress) {
			onBackPress();
		} else {
			router.back();
		}
	};

	// Use theme colors if not explicitly provided
	const headerBackgroundColor = backgroundColor || (isDark ? colors.tabBarBackground : '#ffffff');
	const headerTextColor = textColor || (isDark ? '#ffffff' : '#000000');
	const borderColor = isDark ? colors.tabBarBorder : '#e5e7eb';

	return (
		<View
			style={{
				backgroundColor: headerBackgroundColor,
				paddingTop: insets.top,
				paddingBottom: 12,
				paddingHorizontal: 16,
				borderBottomWidth: 1,
				borderBottomColor: borderColor,
			}}
		>
			<StatusBar
				barStyle={isDark ? 'light-content' : 'dark-content'}
				backgroundColor={headerBackgroundColor}
			/>

			<View className="min-h-[44px] flex-row items-center justify-between">
				{/* Left side - Back button */}
				<View className="flex-1 flex-row items-center">
					{showBackButton && (
						<Pressable
							onPress={handleBackPress}
							className="-ml-2 mr-3 rounded-full p-2"
							hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
						>
							<Icon name="arrow-back" size={24} color={headerTextColor} />
						</Pressable>
					)}
				</View>

				{/* Center - Title */}
				<View className="flex-2 items-center">
					{title && (
						<Text
							variant="h4"
							color={headerTextColor === '#000000' ? 'black' : 'white'}
							className="text-center font-semibold"
							numberOfLines={1}
							ellipsizeMode="tail"
						>
							{title}
						</Text>
					)}
				</View>

				{/* Right side - Custom component */}
				<View className="flex-1 flex-row items-center justify-end">{rightComponent}</View>
			</View>
		</View>
	);
};
