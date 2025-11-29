import React from 'react';
import { Modal, View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '../Button';

interface LocationPermissionModalProps {
	visible: boolean;
	onAllow: () => void;
	onDeny: () => void;
}

export const LocationPermissionModal: React.FC<LocationPermissionModalProps> = ({
	visible,
	onAllow,
	onDeny,
}) => {
	return (
		<Modal visible={visible} animationType="slide" presentationStyle="pageSheet" transparent={true}>
			<View className="flex-1 justify-end bg-black/50">
				<View className="rounded-t-3xl bg-white p-6 pb-8">
					{/* Icon */}
					<View className="mb-4 items-center">
						<View className="h-20 w-20 items-center justify-center rounded-full bg-blue-100">
							<Ionicons name="location" size={40} color="#3b82f6" />
						</View>
					</View>

					{/* Title */}
					<Text className="mb-3 text-center text-2xl font-bold text-gray-900">
						Standort speichern?
					</Text>

					{/* Description */}
					<Text className="mb-6 text-center text-base text-gray-600">
						Nutriphi kann den Standort deiner Mahlzeiten speichern, um dir personalisierte Einblicke
						zu geben:
					</Text>

					{/* Benefits */}
					<View className="mb-6 space-y-3">
						<View className="flex-row items-center">
							<Ionicons name="restaurant-outline" size={20} color="#6b7280" />
							<Text className="ml-3 flex-1 text-sm text-gray-700">
								Automatische Restaurant-Erkennung
							</Text>
						</View>
						<View className="flex-row items-center">
							<Ionicons name="stats-chart-outline" size={20} color="#6b7280" />
							<Text className="ml-3 flex-1 text-sm text-gray-700">
								Analyse wo du am gesündesten isst
							</Text>
						</View>
						<View className="flex-row items-center">
							<Ionicons name="map-outline" size={20} color="#6b7280" />
							<Text className="ml-3 flex-1 text-sm text-gray-700">
								Ernährungstracking auf Reisen
							</Text>
						</View>
					</View>

					{/* Privacy Note */}
					<View className="mb-6 rounded-lg bg-gray-50 p-3">
						<Text className="text-xs text-gray-600">
							<Text className="font-semibold">🔒 Deine Privatsphäre ist uns wichtig:</Text>
							{'\n'}
							Standortdaten werden nur lokal auf deinem Gerät gespeichert und können jederzeit in
							den Einstellungen deaktiviert werden.
						</Text>
					</View>

					{/* Buttons */}
					<View className="space-y-3">
						<Button title="Standort erlauben" onPress={onAllow} className="w-full bg-blue-600" />
						<TouchableOpacity onPress={onDeny} className="py-3">
							<Text className="text-center text-base text-gray-600">Nicht jetzt</Text>
						</TouchableOpacity>
					</View>

					{/* Settings hint */}
					<Text className="mt-4 text-center text-xs text-gray-500">
						Du kannst diese Einstellung jederzeit in den App-Einstellungen ändern.
					</Text>
				</View>
			</View>
		</Modal>
	);
};
