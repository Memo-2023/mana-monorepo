import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import Button from '../atoms/Button';
import Text from '../atoms/Text';

interface DevSettingsSectionProps {
	showDebugBorders: boolean;
	onToggleDebugBorders: () => void;
	onOpenOnboarding: () => void;
	onOpenCreators: () => void;
	loadingContext: 'character' | 'story' | 'image' | 'saving' | 'loading';
	onLoadingContextChange: (context: 'character' | 'story' | 'image' | 'saving' | 'loading') => void;
	onShowLoadingScreen: () => void;
	isWideScreen?: boolean;
}

export default function DevSettingsSection({
	showDebugBorders,
	onToggleDebugBorders,
	onOpenOnboarding,
	onOpenCreators,
	loadingContext,
	onLoadingContextChange,
	onShowLoadingScreen,
	isWideScreen = false,
}: DevSettingsSectionProps) {
	const buttonStyle = {
		marginBottom: isWideScreen ? 12 : 8,
	};

	// Unified dev settings color - matching other settings elements
	const DEV_COLOR = '#333333';
	const DEV_COLOR_ACTIVE = '#555555';

	return (
		<View style={styles.container}>
			<Button
				title="Debug Borders"
				onPress={onToggleDebugBorders}
				color={showDebugBorders ? DEV_COLOR_ACTIVE : DEV_COLOR}
				variant="primary"
				size="lg"
				iconName="border-all"
				iconPosition="left"
				style={buttonStyle}
			/>
			<Button
				title="Einführung anzeigen"
				onPress={onOpenOnboarding}
				color={DEV_COLOR}
				variant="primary"
				size="lg"
				iconName="school"
				iconPosition="left"
				style={buttonStyle}
			/>
			<Button
				title="Unsere Künstler"
				onPress={onOpenCreators}
				color={DEV_COLOR}
				variant="primary"
				size="lg"
				iconName="brush"
				iconPosition="left"
				style={buttonStyle}
			/>
			<Button
				title="Creator Verwaltung"
				onPress={() => router.push('/creator-management')}
				color={DEV_COLOR}
				variant="primary"
				size="lg"
				iconName="settings"
				iconPosition="left"
				style={buttonStyle}
			/>
			<Button
				title="Bildgenerierung"
				onPress={() => router.push('/(tabs)/(settings)/image-model')}
				color={DEV_COLOR}
				variant="primary"
				size="lg"
				iconName="image"
				iconPosition="left"
				style={buttonStyle}
			/>
			<Button
				title="Time of Day Tester"
				onPress={() => router.push('/time-of-day-test')}
				color={DEV_COLOR}
				variant="primary"
				size="lg"
				iconName="sunny"
				iconPosition="left"
				style={buttonStyle}
			/>
			<View style={styles.loadingScreenControls}>
				<Text style={styles.controlLabel}>Loading Screen Test:</Text>
				<View style={styles.contextSelector}>
					{(['character', 'story', 'image', 'saving', 'loading'] as const).map((context) => (
						<TouchableOpacity
							key={context}
							style={[
								styles.contextButton,
								loadingContext === context && styles.activeContextButton,
							]}
							onPress={() => onLoadingContextChange(context)}
						>
							<Text
								style={[
									styles.contextButtonText,
									loadingContext === context && styles.activeContextButtonText,
								]}
							>
								{context}
							</Text>
						</TouchableOpacity>
					))}
				</View>
				<Button
					title="Loading Screen anzeigen"
					onPress={onShowLoadingScreen}
					color={DEV_COLOR}
					variant="primary"
					size="lg"
					iconName="timer"
					iconPosition="left"
					style={buttonStyle}
				/>
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		marginBottom: 16,
	},
	loadingScreenControls: {
		marginTop: 16,
		backgroundColor: '#2C2C2C',
		borderRadius: 12,
		padding: 16,
	},
	controlLabel: {
		color: '#FFFFFF',
		fontSize: 16,
		marginBottom: 8,
	},
	contextSelector: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		marginBottom: 16,
		gap: 8,
	},
	contextButton: {
		paddingHorizontal: 12,
		paddingVertical: 6,
		borderRadius: 16,
		backgroundColor: '#444444',
		marginRight: 8,
		marginBottom: 8,
	},
	activeContextButton: {
		backgroundColor: '#9C27B0',
	},
	contextButtonText: {
		color: '#CCCCCC',
		fontSize: 14,
	},
	activeContextButtonText: {
		color: '#FFFFFF',
		fontWeight: 'bold',
	},
});
