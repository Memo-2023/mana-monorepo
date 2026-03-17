import { Modal, View, Pressable, StatusBar, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import { X, DownloadSimple } from 'phosphor-react-native';
import { File, Paths } from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import { useState } from 'react';

interface Props {
	uri: string | null;
	onClose: () => void;
}

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

export default function ImageViewer({ uri, onClose }: Props) {
	const [saving, setSaving] = useState(false);

	const handleSave = async () => {
		if (!uri || saving) return;
		setSaving(true);
		try {
			const { status } = await MediaLibrary.requestPermissionsAsync();
			if (status !== 'granted') return;

			const filename = `manalink_${Date.now()}.jpg`;
			const downloaded = await File.downloadFileAsync(uri, Paths.cache);
			await MediaLibrary.saveToLibraryAsync(downloaded.uri);
		} finally {
			setSaving(false);
		}
	};

	return (
		<Modal visible={!!uri} transparent animationType="fade" onRequestClose={onClose}>
			<StatusBar hidden />
			<View className="flex-1 bg-black">
				{/* Controls */}
				<View className="absolute top-0 left-0 right-0 z-10 flex-row justify-between p-4 pt-12">
					<Pressable
						onPress={onClose}
						className="w-10 h-10 rounded-full bg-black/50 items-center justify-center active:opacity-60"
					>
						<X size={20} color="#fff" />
					</Pressable>
					<Pressable
						onPress={handleSave}
						disabled={saving}
						className="w-10 h-10 rounded-full bg-black/50 items-center justify-center active:opacity-60"
					>
						<DownloadSimple size={20} color="#fff" />
					</Pressable>
				</View>

				{/* Image */}
				{uri && (
					<Pressable onPress={onClose} className="flex-1 items-center justify-center">
						<Image
							source={{ uri }}
							style={{ width: SCREEN_W, height: SCREEN_H }}
							contentFit="contain"
						/>
					</Pressable>
				)}
			</View>
		</Modal>
	);
}
