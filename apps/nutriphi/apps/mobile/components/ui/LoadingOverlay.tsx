import React from 'react';
import { View, Text, Modal, ActivityIndicator } from 'react-native';

interface LoadingOverlayProps {
	visible: boolean;
	message?: string;
	backgroundColor?: string;
}

export default function LoadingOverlay({
	visible,
	message = 'Wird geladen...',
	backgroundColor = 'rgba(0, 0, 0, 0.7)',
}: LoadingOverlayProps) {
	if (!visible) return null;

	return (
		<Modal transparent visible={visible} animationType="fade">
			<View className="flex-1 items-center justify-center" style={{ backgroundColor }}>
				<View className="rounded-2xl bg-white p-8 shadow-lg dark:bg-gray-800">
					<View className="items-center space-y-4">
						<ActivityIndicator size="large" className="text-indigo-500" />
						<Text className="text-center text-lg font-medium text-gray-900 dark:text-white">
							{message}
						</Text>
					</View>
				</View>
			</View>
		</Modal>
	);
}
