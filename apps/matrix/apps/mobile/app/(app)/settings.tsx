import { useState } from 'react';
import {
	View,
	Text,
	Pressable,
	Alert,
	ScrollView,
	TextInput,
	ActivityIndicator,
	Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { PencilSimple, X } from 'phosphor-react-native';
import { useMatrixStore } from '~/src/matrix/store';
import { uploadMedia, getMimetypeFromFilename } from '~/src/matrix/upload';

function ProfileAvatar({ displayName, avatarUrl }: { displayName: string; avatarUrl?: string }) {
	const initial = displayName[0]?.toUpperCase() ?? '?';
	return (
		<View className="w-20 h-20 rounded-full bg-surface border-2 border-border overflow-hidden items-center justify-center">
			{avatarUrl ? (
				<Image source={{ uri: avatarUrl }} style={{ width: 80, height: 80 }} contentFit="cover" />
			) : (
				<Text className="text-foreground text-3xl font-semibold">{initial}</Text>
			)}
		</View>
	);
}

export default function SettingsScreen() {
	const { client, syncState, credentials, logout } = useMatrixStore();

	const userId = client?.getUserId() ?? credentials?.userId ?? '';
	const homeserver = client?.baseUrl ?? credentials?.homeserver ?? '';

	const [editingName, setEditingName] = useState(false);
	const [newDisplayName, setNewDisplayName] = useState('');
	const [savingName, setSavingName] = useState(false);
	const [uploadingAvatar, setUploadingAvatar] = useState(false);

	// Get current profile from client
	const profileInfo = client ? (() => {
		try {
			const user = client.getUser(userId);
			return {
				displayName: user?.displayName ?? userId.split(':')[0].slice(1),
				avatarUrl: user?.avatarUrl ?? undefined,
			};
		} catch {
			return { displayName: userId.split(':')[0].slice(1), avatarUrl: undefined };
		}
	})() : { displayName: '', avatarUrl: undefined };

	const handleEditName = () => {
		setNewDisplayName(profileInfo.displayName);
		setEditingName(true);
	};

	const handleSaveName = async () => {
		if (!client || !newDisplayName.trim()) return;
		setSavingName(true);
		try {
			await client.setDisplayName(newDisplayName.trim());
			setEditingName(false);
		} catch (err) {
			Alert.alert('Error', err instanceof Error ? err.message : 'Could not update name');
		} finally {
			setSavingName(false);
		}
	};

	const handleChangeAvatar = async () => {
		const result = await ImagePicker.launchImageLibraryAsync({
			mediaTypes: ImagePicker.MediaTypeOptions.Images,
			quality: 0.8,
			allowsEditing: true,
			aspect: [1, 1],
		});
		if (result.canceled || !result.assets[0] || !client) return;
		const asset = result.assets[0];
		const filename = asset.fileName ?? `avatar_${Date.now()}.jpg`;
		const mimetype = asset.mimeType ?? getMimetypeFromFilename(filename);

		setUploadingAvatar(true);
		try {
			const uploaded = await uploadMedia(client, asset.uri, filename, mimetype);
			await client.setAvatarUrl(uploaded.mxcUrl);
		} catch (err) {
			Alert.alert('Error', err instanceof Error ? err.message : 'Could not update avatar');
		} finally {
			setUploadingAvatar(false);
		}
	};

	const handleLogout = () => {
		Alert.alert('Sign out', 'Are you sure you want to sign out?', [
			{ text: 'Cancel', style: 'cancel' },
			{ text: 'Sign out', style: 'destructive', onPress: logout },
		]);
	};

	return (
		<SafeAreaView className="flex-1 bg-background" edges={['top']}>
			<View className="px-4 py-3">
				<Text className="text-foreground text-2xl font-bold">Settings</Text>
			</View>

			<ScrollView className="flex-1" contentContainerClassName="p-4 gap-4">
				{/* Profile card */}
				<View className="bg-surface rounded-2xl border border-border p-4 items-center gap-3">
					{/* Avatar */}
					<Pressable
						onPress={handleChangeAvatar}
						disabled={uploadingAvatar}
						className="relative"
					>
						<ProfileAvatar
							displayName={profileInfo.displayName}
							avatarUrl={profileInfo.avatarUrl}
						/>
						<View className="absolute bottom-0 right-0 w-6 h-6 bg-primary rounded-full items-center justify-center border-2 border-background">
							{uploadingAvatar ? (
								<ActivityIndicator size={10} color="#fff" />
							) : (
								<PencilSimple size={12} color="#fff" weight="bold" />
							)}
						</View>
					</Pressable>

					{/* Display name */}
					<View className="items-center">
						<View className="flex-row items-center gap-2">
							<Text className="text-foreground text-lg font-semibold">
								{profileInfo.displayName}
							</Text>
							<Pressable onPress={handleEditName}>
								<PencilSimple size={16} color="#7c6bff" />
							</Pressable>
						</View>
						<Text className="text-muted-foreground text-sm mt-0.5" numberOfLines={1}>
							{userId}
						</Text>
					</View>
				</View>

				{/* Connection info */}
				<View className="bg-surface rounded-2xl overflow-hidden border border-border">
					<View className="px-4 py-3 border-b border-border">
						<Text className="text-muted-foreground text-xs uppercase tracking-wider">Connection</Text>
					</View>
					<View className="p-4 gap-3">
						<View>
							<Text className="text-muted-foreground text-xs">Homeserver</Text>
							<Text className="text-foreground text-sm mt-0.5" numberOfLines={1}>{homeserver || '—'}</Text>
						</View>
						<View className="flex-row items-center justify-between">
							<Text className="text-muted-foreground text-xs">Sync status</Text>
							<View className="flex-row items-center gap-1.5">
								<View className={`w-2 h-2 rounded-full ${syncState === 'SYNCING' || syncState === 'PREPARED' ? 'bg-green-500' : syncState === 'ERROR' ? 'bg-destructive' : 'bg-yellow-500'}`} />
								<Text className="text-foreground text-sm capitalize">{syncState.toLowerCase()}</Text>
							</View>
						</View>
					</View>
				</View>

				{/* About */}
				<View className="bg-surface rounded-2xl overflow-hidden border border-border">
					<View className="px-4 py-3 border-b border-border">
						<Text className="text-muted-foreground text-xs uppercase tracking-wider">About</Text>
					</View>
					<View className="p-4 gap-2">
						<View className="flex-row justify-between">
							<Text className="text-muted-foreground text-sm">App</Text>
							<Text className="text-foreground text-sm">Manalink</Text>
						</View>
						<View className="flex-row justify-between">
							<Text className="text-muted-foreground text-sm">Version</Text>
							<Text className="text-foreground text-sm">1.0.0</Text>
						</View>
						<View className="flex-row justify-between">
							<Text className="text-muted-foreground text-sm">Protocol</Text>
							<Text className="text-foreground text-sm">Matrix</Text>
						</View>
					</View>
				</View>

				{/* Sign out */}
				<Pressable
					onPress={handleLogout}
					className={({ pressed }) =>
						`bg-destructive/10 border border-destructive/30 rounded-2xl p-4 items-center ${pressed ? 'opacity-60' : ''}`
					}
				>
					<Text className="text-destructive font-semibold">Sign out</Text>
				</Pressable>
			</ScrollView>

			{/* Edit display name modal */}
			<Modal visible={editingName} transparent animationType="fade" onRequestClose={() => setEditingName(false)}>
				<View className="flex-1 bg-black/60 items-center justify-center p-6">
					<View className="bg-surface border border-border rounded-2xl p-5 w-full gap-4">
						<View className="flex-row items-center justify-between">
							<Text className="text-foreground text-base font-semibold">Display name</Text>
							<Pressable onPress={() => setEditingName(false)}>
								<X size={20} color="#6b7280" />
							</Pressable>
						</View>
						<TextInput
							className="bg-background border border-border rounded-xl px-4 py-3 text-foreground"
							value={newDisplayName}
							onChangeText={setNewDisplayName}
							placeholder="Your display name"
							placeholderTextColor="#6b7280"
							autoFocus
						/>
						<Pressable
							onPress={handleSaveName}
							disabled={savingName || !newDisplayName.trim()}
							className={({ pressed }) =>
								`bg-primary rounded-xl py-3 items-center ${pressed || savingName || !newDisplayName.trim() ? 'opacity-60' : ''}`
							}
						>
							{savingName ? (
								<ActivityIndicator color="#fff" />
							) : (
								<Text className="text-white font-semibold">Save</Text>
							)}
						</Pressable>
					</View>
				</View>
			</Modal>
		</SafeAreaView>
	);
}
