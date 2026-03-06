import { useState, useEffect } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Camera } from 'phosphor-react-native';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useMatrixStore } from '~/src/matrix/store';
import { uploadMedia } from '~/src/matrix/upload';
import { resolveMxcThumbnail } from '~/src/matrix/media';

export default function RoomSettingsScreen() {
	const { id } = useLocalSearchParams<{ id: string }>();
	const router = useRouter();
	const { client, credentials, rooms } = useMatrixStore();

	const room = rooms.find((r) => r.id === id);

	const [name, setName] = useState(room?.name ?? '');
	const [topic, setTopic] = useState(room?.topic ?? '');
	const [avatarUri, setAvatarUri] = useState<string | null>(room?.avatar ?? null);
	const [saving, setSaving] = useState(false);
	const [uploadingAvatar, setUploadingAvatar] = useState(false);
	const [newAvatarMxc, setNewAvatarMxc] = useState<string | null>(null);

	useEffect(() => {
		if (room) {
			setName(room.name);
			setTopic(room.topic ?? '');
			setAvatarUri(room.avatar ?? null);
		}
	}, [room?.id]);

	const handlePickAvatar = async () => {
		const result = await ImagePicker.launchImageLibraryAsync({
			mediaTypes: ImagePicker.MediaTypeOptions.Images,
			allowsEditing: true,
			aspect: [1, 1],
			quality: 0.85,
		});
		if (result.canceled || !result.assets[0] || !client) return;
		const asset = result.assets[0];
		setUploadingAvatar(true);
		try {
			const filename = `avatar_${Date.now()}.jpg`;
			const uploaded = await uploadMedia(client, asset.uri, filename, 'image/jpeg');
			setNewAvatarMxc(uploaded.mxcUrl);
			setAvatarUri(
				credentials ? (resolveMxcThumbnail(uploaded.mxcUrl, credentials.homeserver, 128, 128) ?? asset.uri) : asset.uri,
			);
		} catch (err) {
			Alert.alert('Upload failed', err instanceof Error ? err.message : 'Unknown error');
		} finally {
			setUploadingAvatar(false);
		}
	};

	const handleSave = async () => {
		if (!client || !id) return;
		setSaving(true);
		try {
			const trimmedName = name.trim();
			const trimmedTopic = topic.trim();

			if (trimmedName && trimmedName !== room?.name) {
				await client.setRoomName(id, trimmedName);
			}
			if (trimmedTopic !== (room?.topic ?? '')) {
				await (client as any).sendStateEvent(id, 'm.room.topic', { topic: trimmedTopic }, '');
			}
			if (newAvatarMxc) {
				await (client as any).sendStateEvent(id, 'm.room.avatar', { url: newAvatarMxc }, '');
			}
			router.back();
		} catch (err) {
			Alert.alert('Save failed', err instanceof Error ? err.message : 'Unknown error');
		} finally {
			setSaving(false);
		}
	};

	const hasChanges =
		name.trim() !== room?.name ||
		topic.trim() !== (room?.topic ?? '') ||
		newAvatarMxc !== null;

	return (
		<SafeAreaView className="flex-1 bg-background" edges={['top', 'bottom']}>
			{/* Header */}
			<View className="flex-row items-center gap-3 px-4 py-3 border-b border-border">
				<Pressable onPress={() => router.back()} className={({ pressed }) => `p-1 ${pressed ? 'opacity-50' : ''}`}>
					<ArrowLeft size={22} color="#7c6bff" />
				</Pressable>
				<Text className="flex-1 text-foreground font-semibold text-base">Room Settings</Text>
				<Pressable
					onPress={handleSave}
					disabled={!hasChanges || saving}
					className={({ pressed }) =>
						`px-4 py-1.5 rounded-full ${hasChanges && !saving ? 'bg-primary' : 'bg-surface border border-border'} ${pressed ? 'opacity-60' : ''}`
					}
				>
					{saving ? (
						<ActivityIndicator size={14} color="#fff" />
					) : (
						<Text className={`text-sm font-semibold ${hasChanges ? 'text-white' : 'text-muted-foreground'}`}>
							Save
						</Text>
					)}
				</Pressable>
			</View>

			<ScrollView contentContainerClassName="px-4 py-6 gap-8">
				{/* Avatar */}
				<View className="items-center gap-3">
					<Pressable onPress={handlePickAvatar} disabled={uploadingAvatar}>
						<View className="w-24 h-24 rounded-full bg-surface border border-border overflow-hidden items-center justify-center">
							{uploadingAvatar ? (
								<ActivityIndicator color="#7c6bff" />
							) : avatarUri ? (
								<Image source={{ uri: avatarUri }} style={{ width: 96, height: 96 }} contentFit="cover" />
							) : (
								<Text className="text-foreground text-3xl font-bold">
									{room?.name?.[0]?.toUpperCase() ?? '#'}
								</Text>
							)}
						</View>
						<View className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-primary items-center justify-center border-2 border-background">
							<Camera size={14} color="#fff" weight="fill" />
						</View>
					</Pressable>
					<Text className="text-muted-foreground text-xs">Tap to change room avatar</Text>
				</View>

				{/* Name */}
				<View className="gap-2">
					<Text className="text-foreground text-sm font-semibold">Room name</Text>
					<TextInput
						value={name}
						onChangeText={setName}
						placeholder="Room name"
						placeholderTextColor="#6b7280"
						className="bg-surface border border-border rounded-xl px-4 py-3 text-foreground"
						maxLength={255}
					/>
				</View>

				{/* Topic */}
				<View className="gap-2">
					<Text className="text-foreground text-sm font-semibold">Topic</Text>
					<TextInput
						value={topic}
						onChangeText={setTopic}
						placeholder="Describe this room…"
						placeholderTextColor="#6b7280"
						className="bg-surface border border-border rounded-xl px-4 py-3 text-foreground"
						multiline
						numberOfLines={3}
						textAlignVertical="top"
						style={{ minHeight: 80 }}
						maxLength={1000}
					/>
				</View>

				{/* Room ID info */}
				<View className="gap-2">
					<Text className="text-foreground text-sm font-semibold">Room ID</Text>
					<View className="bg-surface border border-border rounded-xl px-4 py-3">
						<Text className="text-muted-foreground text-sm font-mono" selectable>{id}</Text>
					</View>
				</View>
			</ScrollView>
		</SafeAreaView>
	);
}
