import React, { useEffect, useState } from 'react';
import { View, Text, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SaveState } from '~/types/document';
import { useTheme } from '~/utils/theme';

interface SaveStateIndicatorProps {
	saveState: SaveState;
	lastSavedAt: Date | null;
	hasUnsavedChanges: boolean;
	error: string | null;
}

export const SaveStateIndicator: React.FC<SaveStateIndicatorProps> = ({
	saveState,
	lastSavedAt,
	hasUnsavedChanges,
	error,
}) => {
	const { mode } = useTheme();
	const isDark = mode === 'dark';

	// Animation values
	const fadeAnim = useState(new Animated.Value(0))[0];
	const scaleAnim = useState(new Animated.Value(0.8))[0];

	// Animate in when save state changes
	useEffect(() => {
		if (saveState !== 'idle') {
			Animated.parallel([
				Animated.timing(fadeAnim, {
					toValue: 1,
					duration: 200,
					useNativeDriver: true,
				}),
				Animated.spring(scaleAnim, {
					toValue: 1,
					friction: 8,
					tension: 40,
					useNativeDriver: true,
				}),
			]).start();

			// Auto-hide after showing saved state
			if (saveState === 'saved') {
				setTimeout(() => {
					Animated.timing(fadeAnim, {
						toValue: 0,
						duration: 200,
						useNativeDriver: true,
					}).start();
				}, 2000);
			}
		}
	}, [saveState, fadeAnim, scaleAnim]);

	const getContent = () => {
		switch (saveState) {
			case 'saving':
				return {
					icon: 'cloud-upload-outline' as const,
					text: 'Speichert...',
					color: isDark ? '#60a5fa' : '#3b82f6',
				};
			case 'saved':
				return {
					icon: 'checkmark-circle' as const,
					text: 'Gespeichert',
					color: isDark ? '#34d399' : '#10b981',
				};
			case 'error':
				return {
					icon: 'alert-circle' as const,
					text: error || 'Fehler beim Speichern',
					color: isDark ? '#f87171' : '#ef4444',
				};
			default:
				if (hasUnsavedChanges) {
					return {
						icon: 'pencil' as const,
						text: 'Nicht gespeichert',
						color: isDark ? '#fbbf24' : '#f59e0b',
					};
				}
				return null;
		}
	};

	const content = getContent();

	if (!content && saveState === 'idle') {
		return null;
	}

	return (
		<Animated.View
			style={{
				opacity: fadeAnim,
				transform: [{ scale: scaleAnim }],
				position: 'absolute',
				top: 10,
				right: 10,
				flexDirection: 'row',
				alignItems: 'center',
				backgroundColor: isDark ? 'rgba(31, 41, 55, 0.95)' : 'rgba(255, 255, 255, 0.95)',
				paddingHorizontal: 12,
				paddingVertical: 6,
				borderRadius: 20,
				shadowColor: '#000',
				shadowOffset: { width: 0, height: 2 },
				shadowOpacity: 0.1,
				shadowRadius: 4,
				elevation: 3,
				borderWidth: 1,
				borderColor: isDark ? 'rgba(55, 65, 81, 0.5)' : 'rgba(229, 231, 235, 0.5)',
				zIndex: 1000,
			}}
		>
			{content && (
				<>
					<Ionicons
						name={content.icon}
						size={16}
						color={content.color}
						style={{ marginRight: 6 }}
					/>
					<Text
						style={{
							fontSize: 12,
							fontWeight: '500',
							color: content.color,
						}}
					>
						{content.text}
					</Text>
				</>
			)}
		</Animated.View>
	);
};

// Minimale Version für die Header-Leiste
export const SaveStateIndicatorMinimal: React.FC<SaveStateIndicatorProps> = ({
	saveState,
	hasUnsavedChanges,
}) => {
	const { mode } = useTheme();
	const isDark = mode === 'dark';

	if (saveState === 'saving') {
		return (
			<View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 12 }}>
				<Ionicons
					name="cloud-upload-outline"
					size={16}
					color={isDark ? '#60a5fa' : '#3b82f6'}
					style={{ marginRight: 4 }}
				/>
				<Text style={{ fontSize: 12, color: isDark ? '#9ca3af' : '#6b7280' }}>Speichert...</Text>
			</View>
		);
	}

	if (hasUnsavedChanges) {
		return (
			<View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 12 }}>
				<View
					style={{
						width: 6,
						height: 6,
						borderRadius: 3,
						backgroundColor: isDark ? '#fbbf24' : '#f59e0b',
						marginRight: 6,
					}}
				/>
				<Text style={{ fontSize: 12, color: isDark ? '#9ca3af' : '#6b7280' }}>
					Nicht gespeichert
				</Text>
			</View>
		);
	}

	return null;
};
