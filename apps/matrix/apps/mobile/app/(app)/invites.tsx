import { View, Text, FlatList, Pressable, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { useMatrixStore } from '~/src/matrix/store';
import type { SimpleRoom } from '~/src/matrix/types';

function InviteCard({
	room,
	onAccept,
	onDecline,
}: {
	room: SimpleRoom;
	onAccept: () => void;
	onDecline: () => void;
}) {
	return (
		<View className="mx-4 mb-3 bg-surface border border-border rounded-2xl overflow-hidden">
			<View className="flex-row items-center gap-3 p-4">
				{/* Avatar */}
				<View className="w-12 h-12 rounded-full bg-background border border-border overflow-hidden items-center justify-center">
					{room.avatar ? (
						<Image
							source={{ uri: room.avatar }}
							style={{ width: 48, height: 48 }}
							contentFit="cover"
						/>
					) : (
						<Text className="text-foreground text-lg font-semibold">
							{(room.name ?? '?')[0].toUpperCase()}
						</Text>
					)}
				</View>

				{/* Info */}
				<View className="flex-1">
					<Text className="text-foreground font-semibold text-base" numberOfLines={1}>
						{room.name}
					</Text>
					{room.topic && (
						<Text className="text-muted-foreground text-xs mt-0.5" numberOfLines={1}>
							{room.topic}
						</Text>
					)}
					{room.inviter && (
						<Text className="text-muted-foreground text-xs mt-0.5">Invited by {room.inviter}</Text>
					)}
					<View className="flex-row items-center gap-1 mt-1">
						<Text className="text-muted-foreground text-xs">
							{room.isDirect
								? 'Direct message'
								: `${room.memberCount} member${room.memberCount !== 1 ? 's' : ''}`}
						</Text>
						{room.isEncrypted && <Text className="text-green-500 text-xs">· 🔒 Encrypted</Text>}
					</View>
				</View>
			</View>

			{/* Actions */}
			<View className="flex-row border-t border-border">
				<Pressable
					onPress={onDecline}
					className="flex-1 py-3 items-center border-r border-border active:bg-surface"
				>
					<Text className="text-destructive font-medium text-sm">Decline</Text>
				</Pressable>
				<Pressable
					onPress={onAccept}
					className="flex-1 py-3 items-center bg-primary active:bg-primary/80"
				>
					<Text className="text-white font-semibold text-sm">Accept</Text>
				</Pressable>
			</View>
		</View>
	);
}

export default function InvitesScreen() {
	const { invites, acceptInvite, declineInvite, isReady } = useMatrixStore();

	const handleAccept = async (roomId: string) => {
		try {
			await acceptInvite(roomId);
		} catch (err) {
			Alert.alert('Error', err instanceof Error ? err.message : 'Could not join room');
		}
	};

	const handleDecline = (roomId: string, roomName: string) => {
		Alert.alert(`Decline invite`, `Decline invite to "${roomName}"?`, [
			{ text: 'Cancel', style: 'cancel' },
			{
				text: 'Decline',
				style: 'destructive',
				onPress: () => declineInvite(roomId).catch(() => {}),
			},
		]);
	};

	return (
		<SafeAreaView className="flex-1 bg-background" edges={['top']}>
			<View className="px-4 pt-3 pb-2 flex-row items-center justify-between">
				<Text className="text-foreground text-2xl font-bold">Invites</Text>
				{invites.length > 0 && (
					<View className="bg-primary rounded-full min-w-6 h-6 items-center justify-center px-1.5">
						<Text className="text-white text-xs font-bold">{invites.length}</Text>
					</View>
				)}
			</View>

			{!isReady ? (
				<View className="flex-1 items-center justify-center">
					<ActivityIndicator color="#7c6bff" />
				</View>
			) : (
				<FlatList
					data={invites}
					keyExtractor={(item) => item.id}
					renderItem={({ item }) => (
						<InviteCard
							room={item}
							onAccept={() => handleAccept(item.id)}
							onDecline={() => handleDecline(item.id, item.name)}
						/>
					)}
					contentContainerStyle={{ paddingTop: 8, paddingBottom: 24 }}
					ListEmptyComponent={
						<View className="items-center justify-center py-24">
							<Text className="text-4xl mb-3">✉️</Text>
							<Text className="text-foreground text-base font-medium">No pending invites</Text>
							<Text className="text-muted-foreground text-sm mt-1">
								Room invites will appear here
							</Text>
						</View>
					}
				/>
			)}
		</SafeAreaView>
	);
}
