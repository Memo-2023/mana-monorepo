import React from 'react';
import { Modal, View, Text, TouchableOpacity, TouchableWithoutFeedback } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useIsDarkMode } from '~/store/settingsStore';

interface PremiumLimitDialogProps {
	visible: boolean;
	onClose: () => void;
	limitType: 'favorites' | 'search' | 'collections';
	remaining?: number;
	max?: number;
}

export function PremiumLimitDialog({
	visible,
	onClose,
	limitType,
	remaining = 0,
	max = 5,
}: PremiumLimitDialogProps) {
	const isDarkMode = useIsDarkMode();

	const getLimitInfo = () => {
		switch (limitType) {
			case 'favorites':
				return {
					icon: 'heart',
					title: 'Favoriten-Limit erreicht',
					description: `Du hast deine ${max} täglichen Favoriten aufgebraucht.`,
					benefit: 'Unbegrenzte Favoriten mit Premium',
				};
			case 'search':
				return {
					icon: 'search',
					title: 'Such-Limit erreicht',
					description: `Du hast deine ${max} täglichen Suchen aufgebraucht.`,
					benefit: 'Unbegrenzte Suchen mit Premium',
				};
			case 'collections':
				return {
					icon: 'folder',
					title: 'Listen-Limit erreicht',
					description: `Du kannst nur ${max} Liste pro Woche erstellen.`,
					benefit: 'Unbegrenzte Listen mit Premium',
				};
		}
	};

	const info = getLimitInfo();

	const handleUpgrade = () => {
		onClose();
		router.push('/paywall');
	};

	return (
		<Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
			<TouchableWithoutFeedback onPress={onClose}>
				<View className="flex-1 bg-black/50 justify-center items-center px-6">
					<TouchableWithoutFeedback>
						<View
							style={{
								backgroundColor: isDarkMode ? '#1a1a1a' : '#ffffff',
								borderRadius: 24,
								padding: 24,
								width: '100%',
								maxWidth: 400,
							}}
						>
							{/* Icon */}
							<View className="items-center mb-4">
								<LinearGradient
									colors={['#8B5CF6', '#6366F1']}
									style={{
										width: 64,
										height: 64,
										borderRadius: 32,
										alignItems: 'center',
										justifyContent: 'center',
									}}
								>
									<Ionicons name={info.icon as any} size={28} color="white" />
								</LinearGradient>
							</View>

							{/* Title */}
							<Text
								style={{
									fontSize: 24,
									fontWeight: 'bold',
									textAlign: 'center',
									marginBottom: 8,
									color: isDarkMode ? '#ffffff' : '#000000',
								}}
							>
								{info.title}
							</Text>

							{/* Description */}
							<Text
								style={{
									fontSize: 16,
									textAlign: 'center',
									marginBottom: 16,
									color: isDarkMode ? '#9ca3af' : '#4b5563',
								}}
							>
								{info.description}
							</Text>

							{/* Progress Bar */}
							{remaining > 0 && (
								<View className="mb-4">
									<View
										style={{
											height: 8,
											backgroundColor: isDarkMode ? '#374151' : '#e5e7eb',
											borderRadius: 999,
											overflow: 'hidden',
										}}
									>
										<LinearGradient
											colors={['#6366F1', '#8B5CF6']}
											start={{ x: 0, y: 0 }}
											end={{ x: 1, y: 0 }}
											style={{
												height: '100%',
												width: `${((max - remaining) / max) * 100}%`,
											}}
										/>
									</View>
									<Text
										style={{
											fontSize: 12,
											textAlign: 'center',
											marginTop: 4,
											color: isDarkMode ? '#6b7280' : '#9ca3af',
										}}
									>
										{remaining} von {max} verbleibend
									</Text>
								</View>
							)}

							{/* Benefit */}
							<View
								style={{
									backgroundColor: isDarkMode ? 'rgba(99, 102, 241, 0.15)' : '#eef2ff',
									borderRadius: 12,
									padding: 12,
									marginBottom: 24,
								}}
							>
								<Text
									style={{
										color: isDarkMode ? '#a5b4fc' : '#4f46e5',
										textAlign: 'center',
										fontWeight: '500',
									}}
								>
									✨ {info.benefit}
								</Text>
							</View>

							{/* Buttons */}
							<TouchableOpacity
								onPress={handleUpgrade}
								style={{
									backgroundColor: '#6366F1',
									borderRadius: 16,
									paddingVertical: 16,
									marginBottom: 12,
								}}
							>
								<Text className="text-white text-center font-semibold text-base">
									Jetzt Premium werden
								</Text>
							</TouchableOpacity>

							<TouchableOpacity onPress={onClose} style={{ paddingVertical: 8 }}>
								<Text
									style={{
										textAlign: 'center',
										color: isDarkMode ? '#9ca3af' : '#6b7280',
									}}
								>
									Später
								</Text>
							</TouchableOpacity>
						</View>
					</TouchableWithoutFeedback>
				</View>
			</TouchableWithoutFeedback>
		</Modal>
	);
}
