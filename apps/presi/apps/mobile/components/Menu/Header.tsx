import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet, useWindowDimensions } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../ThemeProvider';
import { useRouter } from 'expo-router';

interface HeaderProps {
	title: string;
	showAddDeck?: boolean;
	showPresent?: boolean;
	onPresentPress?: () => void;
	disabled?: boolean;
	slideCount?: number;
	rightContent?: React.ReactNode;
	position?: 'top' | 'bottom';
}

export const Header: React.FC<HeaderProps> = ({
	title,
	showAddDeck = false,
	showPresent = false,
	onPresentPress,
	disabled = false,
	slideCount,
	rightContent,
	position = 'top',
}) => {
	const router = useRouter();
	const { theme } = useTheme();
	const { width } = useWindowDimensions();
	const isMobile = width < 768;
	const shouldBeBottom = isMobile && position === 'bottom';

	const defaultRightContent = (
		<View style={styles.rightContent}>
			{!showPresent && (
				<View style={[styles.iconWrapper, { borderColor: theme.colors.borderPrimary }]}>
					<TouchableOpacity onPress={() => router.push('/profile')} style={styles.iconButton}>
						<MaterialIcons name="account-circle" size={24} color={theme.colors.primary} />
					</TouchableOpacity>
				</View>
			)}
			{showPresent && (
				<View
					style={[
						styles.iconWrapper,
						{ borderColor: disabled ? theme.colors.borderPrimary : theme.colors.primary },
					]}
				>
					<TouchableOpacity onPress={onPresentPress} style={styles.iconButton} disabled={disabled}>
						<MaterialIcons
							name="slideshow"
							size={24}
							color={disabled ? theme.colors.textTertiary : theme.colors.primary}
						/>
					</TouchableOpacity>
				</View>
			)}
			<View style={[styles.iconWrapper, { borderColor: theme.colors.borderPrimary }]}>
				<TouchableOpacity onPress={() => router.push('/settings')} style={styles.iconButton}>
					<MaterialIcons name="settings" size={24} color={theme.colors.primary} />
				</TouchableOpacity>
			</View>
			{showAddDeck && (
				<View style={[styles.iconWrapper, { borderColor: theme.colors.primary }]}>
					<TouchableOpacity
						onPress={() => {
							const event = new CustomEvent('openCreateDeckModal');
							window.dispatchEvent(event);
						}}
						style={styles.iconButton}
					>
						<MaterialIcons name="add" size={24} color={theme.colors.primary} />
					</TouchableOpacity>
				</View>
			)}
		</View>
	);

	return (
		<View
			style={[
				styles.header,
				{
					backgroundColor: theme.colors.backgroundPrimary,
					borderBottomColor: shouldBeBottom ? 'transparent' : theme.colors.borderPrimary,
					borderTopColor: shouldBeBottom ? theme.colors.borderPrimary : 'transparent',
					borderTopWidth: shouldBeBottom ? 1 : 0,
					borderBottomWidth: shouldBeBottom ? 0 : 1,
				},
			]}
		>
			<View style={styles.titleContainer}>
				<View style={styles.titleContent}>
					<Text style={[styles.title, { color: theme.colors.textPrimary }]}>{title}</Text>
					{typeof slideCount === 'number' && (
						<Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
							{slideCount} Slides
						</Text>
					)}
				</View>
			</View>
			<View style={styles.rightContainer}>{rightContent || defaultRightContent}</View>
		</View>
	);
};

const styles = StyleSheet.create({
	header: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		height: 56,
		gap: 16,
	},
	titleContainer: {
		flex: 1,
		maxWidth: '50%',
	},
	titleContent: {
		padding: 8,
		width: '100%',
	},
	rightContainer: {
		flex: 1,
		maxWidth: '50%',
	},
	title: {
		fontSize: 20,
		fontWeight: 'bold',
	},
	subtitle: {
		fontSize: 14,
		marginTop: 2,
	},
	rightContent: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		width: '100%',
		gap: 8,
		padding: 8,
	},
	iconWrapper: {
		flex: 1,
		borderWidth: 1,
		borderRadius: 8,
		padding: 4,
	},
	iconButton: {
		padding: 4,
		alignItems: 'center',
		justifyContent: 'center',
		width: '100%',
	},
});
