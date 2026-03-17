import { useState, useMemo } from 'react';
import { View, Text, FlatList, Pressable, ActivityIndicator, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Plus, MagnifyingGlass, Compass } from 'phosphor-react-native';
import { useMatrixStore } from '~/src/matrix/store';
import RoomListItem from '~/src/components/RoomListItem';
import SyncStatusBar from '~/src/components/SyncStatusBar';

export default function ChatsScreen() {
	const { rooms, syncState, isReady, selectRoom } = useMatrixStore();
	const router = useRouter();
	const [search, setSearch] = useState('');

	const groupRooms = useMemo(() => {
		const base = rooms.filter((r) => !r.isDirect && r.membership === 'join');
		if (!search.trim()) return base;
		const q = search.toLowerCase();
		return base.filter((r) => r.name.toLowerCase().includes(q));
	}, [rooms, search]);

	// Pending invites
	const invites = useMemo(
		() => rooms.filter((r) => r.membership === 'invite' && !r.isDirect),
		[rooms]
	);

	const handleRoomPress = (roomId: string) => {
		selectRoom(roomId);
		router.push(`/room/${roomId}`);
	};

	return (
		<SafeAreaView className="flex-1 bg-background" edges={['top']}>
			<SyncStatusBar syncState={syncState} />

			{/* Header */}
			<View className="flex-row items-center justify-between px-4 pt-3 pb-2">
				<Text className="text-foreground text-2xl font-bold">Chats</Text>
				<View className="flex-row gap-2">
					<Pressable
						onPress={() => router.push('/search')}
						className="w-9 h-9 bg-surface border border-border rounded-full items-center justify-center active:opacity-70"
					>
						<Compass size={18} color="#7c6bff" />
					</Pressable>
					<Pressable
						onPress={() => router.push('/room/new')}
						className="w-9 h-9 bg-primary rounded-full items-center justify-center active:opacity-70"
					>
						<Plus size={18} color="#fff" weight="bold" />
					</Pressable>
				</View>
			</View>

			{/* Search */}
			{(groupRooms.length > 0 || search.length > 0) && (
				<View className="flex-row items-center bg-surface border border-border rounded-xl mx-4 mb-3 px-3 gap-2">
					<MagnifyingGlass size={16} color="#6b7280" />
					<TextInput
						className="flex-1 py-2.5 text-foreground text-sm"
						value={search}
						onChangeText={setSearch}
						placeholder="Search rooms..."
						placeholderTextColor="#6b7280"
					/>
				</View>
			)}

			{/* Loading state */}
			{!isReady && syncState === 'STOPPED' ? (
				<View className="flex-1 items-center justify-center">
					<ActivityIndicator color="#7c6bff" />
					<Text className="text-muted-foreground text-sm mt-3">Connecting...</Text>
				</View>
			) : (
				<FlatList
					data={groupRooms}
					keyExtractor={(item) => item.id}
					renderItem={({ item }) => (
						<RoomListItem room={item} onPress={() => handleRoomPress(item.id)} />
					)}
					contentContainerStyle={{ paddingBottom: 16 }}
					ListHeaderComponent={
						invites.length > 0 ? (
							<View className="px-4 py-2 bg-primary/10 border-b border-border">
								<Text className="text-primary text-sm font-medium">
									{invites.length} pending invite{invites.length !== 1 ? 's' : ''}
								</Text>
							</View>
						) : null
					}
					ListEmptyComponent={
						<View className="items-center justify-center py-20">
							<Text className="text-muted-foreground text-base">
								{search ? 'No rooms found' : 'No group chats yet'}
							</Text>
							{!search && (
								<Text className="text-muted-foreground text-sm mt-1">
									Tap + to create or join a room
								</Text>
							)}
						</View>
					}
				/>
			)}
		</SafeAreaView>
	);
}
