import { Modal, View, Text, Pressable, ActivityIndicator, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { X, ChatCircle } from 'phosphor-react-native';
import { useEffect, useState } from 'react';
import { useMatrixStore } from '~/src/matrix/store';
import { resolveMxcThumbnail } from '~/src/matrix/media';
import { useRouter } from 'expo-router';

interface UserProfile {
	userId: string;
	displayName: string;
	avatarUrl?: string;
}

interface Props {
	userId: string | null;
	onClose: () => void;
}

export default function UserProfileModal({ userId, onClose }: Props) {
	const { client, credentials, rooms, selectRoom } = useMatrixStore();
	const router = useRouter();
	const [profile, setProfile] = useState<UserProfile | null>(null);
	const [loading, setLoading] = useState(false);

	useEffect(() => {
		if (!userId || !client || !credentials) return;
		setLoading(true);
		setProfile(null);

		client.getProfileInfo(userId)
			.then((info) => {
				const rawAvatar = info.avatar_url ?? null;
				setProfile({
					userId,
					displayName: info.displayname ?? userId.split(':')[0].slice(1),
					avatarUrl: rawAvatar
						? resolveMxcThumbnail(rawAvatar, credentials.homeserver, 160, 160) ?? undefined
						: undefined,
				});
			})
			.catch(() => {
				setProfile({
					userId,
					displayName: userId.split(':')[0].slice(1),
				});
			})
			.finally(() => setLoading(false));
	}, [userId]);

	// Find an existing DM room with this user
	const existingDM = userId
		? rooms.find((r) => r.isDirect && r.dmUserId === userId)
		: null;

	const handleStartDM = async () => {
		if (!client || !userId || !credentials) return;

		if (existingDM) {
			selectRoom(existingDM.id);
			router.push(`/room/${existingDM.id}`);
			onClose();
			return;
		}

		try {
			const room = await client.createRoom({
				is_direct: true,
				invite: [userId],
				preset: 'trusted_private_chat' as any,
			});
			selectRoom(room.room_id);
			router.push(`/room/${room.room_id}`);
			onClose();
		} catch {
			// ignore
		}
	};

	const initial = profile?.displayName[0]?.toUpperCase() ?? '?';

	return (
		<Modal
			visible={!!userId}
			transparent
			animationType="fade"
			onRequestClose={onClose}
		>
			<Pressable className="flex-1 bg-black/60" onPress={onClose}>
				<SafeAreaView className="flex-1 justify-end" edges={['bottom']}>
					<Pressable onPress={(e) => e.stopPropagation()}>
						<View className="bg-background rounded-t-3xl overflow-hidden border-t border-border">
							{/* Handle */}
							<View className="items-center pt-3 pb-1">
								<View className="w-10 h-1 bg-border rounded-full" />
							</View>

							{/* Close */}
							<View className="absolute top-3 right-4 z-10">
								<Pressable onPress={onClose} className={({ pressed }) => `p-1 ${pressed ? 'opacity-50' : ''}`}>
									<X size={20} color="#6b7280" />
								</Pressable>
							</View>

							<ScrollView contentContainerClassName="px-6 pt-4 pb-8 items-center gap-4">
								{loading ? (
									<ActivityIndicator color="#7c6bff" className="py-10" />
								) : profile ? (
									<>
										{/* Avatar */}
										<View className="w-24 h-24 rounded-full bg-surface border-2 border-border overflow-hidden items-center justify-center">
											{profile.avatarUrl ? (
												<Image source={{ uri: profile.avatarUrl }} style={{ width: 96, height: 96 }} contentFit="cover" />
											) : (
												<Text className="text-foreground text-4xl font-semibold">{initial}</Text>
											)}
										</View>

										{/* Name */}
										<View className="items-center gap-1">
											<Text className="text-foreground text-xl font-bold">{profile.displayName}</Text>
											<Text className="text-muted-foreground text-sm" selectable>{profile.userId}</Text>
										</View>

										{/* Actions */}
										{profile.userId !== credentials?.userId && (
											<Pressable
												onPress={handleStartDM}
												className={({ pressed }) =>
													`flex-row items-center gap-2 bg-primary rounded-2xl px-6 py-3 ${pressed ? 'opacity-70' : ''}`
												}
											>
												<ChatCircle size={18} color="#fff" weight="fill" />
												<Text className="text-white font-semibold">
													{existingDM ? 'Open conversation' : 'Send message'}
												</Text>
											</Pressable>
										)}
									</>
								) : null}
							</ScrollView>
						</View>
					</Pressable>
				</SafeAreaView>
			</Pressable>
		</Modal>
	);
}
