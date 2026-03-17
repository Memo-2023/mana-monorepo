import { useState, useCallback } from 'react';
import { View, Text, TextInput, FlatList, Pressable, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, MagnifyingGlass, Lock, Users } from 'phosphor-react-native';
import { Image } from 'expo-image';
import { useMatrixStore } from '~/src/matrix/store';

interface PublicRoom {
	room_id: string;
	name?: string;
	topic?: string;
	avatar_url?: string;
	num_joined_members: number;
	world_readable: boolean;
	guest_can_join: boolean;
	join_rule?: string;
}

export default function SearchScreen() {
	const router = useRouter();
	const { client, credentials, selectRoom, acceptInvite } = useMatrixStore();

	const [query, setQuery] = useState('');
	const [results, setResults] = useState<PublicRoom[]>([]);
	const [loading, setLoading] = useState(false);
	const [joiningId, setJoiningId] = useState<string | null>(null);
	const [nextBatch, setNextBatch] = useState<string | undefined>();
	const [hasMore, setHasMore] = useState(false);

	const search = useCallback(
		async (q: string, since?: string) => {
			if (!client || !credentials) return;
			setLoading(true);
			try {
				const response = await (client as any).publicRooms({
					limit: 20,
					filter: { generic_search_term: q },
					since,
					server: new URL(credentials.homeserver).hostname,
				});
				const rooms: PublicRoom[] = response.chunk ?? [];
				setResults((prev) => (since ? [...prev, ...rooms] : rooms));
				setNextBatch(response.next_batch);
				setHasMore(!!response.next_batch);
			} catch (err) {
				Alert.alert('Search failed', err instanceof Error ? err.message : 'Unknown error');
			} finally {
				setLoading(false);
			}
		},
		[client, credentials]
	);

	const handleSearch = (text: string) => {
		setQuery(text);
		setNextBatch(undefined);
		if (text.length >= 2 || text.length === 0) {
			search(text);
		}
	};

	const handleLoadMore = () => {
		if (hasMore && nextBatch && !loading) {
			search(query, nextBatch);
		}
	};

	const handleJoin = async (room: PublicRoom) => {
		if (!client) return;
		setJoiningId(room.room_id);
		try {
			await client.joinRoom(room.room_id);
			selectRoom(room.room_id);
			router.replace(`/room/${room.room_id}`);
		} catch (err) {
			Alert.alert('Could not join', err instanceof Error ? err.message : 'Unknown error');
		} finally {
			setJoiningId(null);
		}
	};

	const renderRoom = ({ item }: { item: PublicRoom }) => {
		const name = item.name ?? item.room_id;
		const initial = name[0]?.toUpperCase() ?? '#';
		const isJoining = joiningId === item.room_id;

		return (
			<View className="flex-row items-start gap-3 px-4 py-3 border-b border-border">
				{/* Avatar */}
				<View className="w-11 h-11 rounded-xl bg-surface border border-border overflow-hidden items-center justify-center shrink-0">
					{item.avatar_url ? (
						<Image
							source={{ uri: item.avatar_url }}
							style={{ width: 44, height: 44 }}
							contentFit="cover"
						/>
					) : (
						<Text className="text-foreground text-lg font-semibold">{initial}</Text>
					)}
				</View>

				{/* Info */}
				<View className="flex-1">
					<View className="flex-row items-center gap-1.5 flex-wrap">
						<Text className="text-foreground text-sm font-semibold" numberOfLines={1}>
							{name}
						</Text>
						{item.join_rule === 'public' ? null : <Lock size={11} color="#6b7280" />}
					</View>
					{item.topic && (
						<Text className="text-muted-foreground text-xs mt-0.5" numberOfLines={2}>
							{item.topic}
						</Text>
					)}
					<View className="flex-row items-center gap-1 mt-1">
						<Users size={11} color="#6b7280" />
						<Text className="text-muted-foreground text-xs">{item.num_joined_members}</Text>
					</View>
				</View>

				{/* Join button */}
				<Pressable
					onPress={() => handleJoin(item)}
					disabled={isJoining}
					className="bg-primary rounded-lg px-3 py-1.5 shrink-0 active:opacity-60"
				>
					{isJoining ? (
						<ActivityIndicator size={14} color="#fff" />
					) : (
						<Text className="text-white text-xs font-semibold">Join</Text>
					)}
				</Pressable>
			</View>
		);
	};

	return (
		<SafeAreaView className="flex-1 bg-background" edges={['top', 'bottom']}>
			{/* Header */}
			<View className="flex-row items-center gap-3 px-4 py-3 border-b border-border">
				<Pressable onPress={() => router.back()} className="p-1 active:opacity-50">
					<ArrowLeft size={22} color="#7c6bff" />
				</Pressable>
				<Text className="text-foreground text-lg font-semibold">Explore rooms</Text>
			</View>

			{/* Search bar */}
			<View className="flex-row items-center gap-2 px-4 py-3 border-b border-border">
				<MagnifyingGlass size={18} color="#6b7280" />
				<TextInput
					className="flex-1 text-foreground text-base"
					value={query}
					onChangeText={handleSearch}
					placeholder="Search public rooms..."
					placeholderTextColor="#6b7280"
					autoFocus
					autoCapitalize="none"
					autoCorrect={false}
				/>
				{loading && <ActivityIndicator size="small" color="#7c6bff" />}
			</View>

			<FlatList
				data={results}
				keyExtractor={(item) => item.room_id}
				renderItem={renderRoom}
				onEndReached={handleLoadMore}
				onEndReachedThreshold={0.2}
				ListEmptyComponent={
					!loading ? (
						<View className="items-center justify-center py-20">
							<Text className="text-muted-foreground text-base">
								{query.length > 0 ? 'No rooms found' : 'Search for public rooms'}
							</Text>
						</View>
					) : null
				}
				ListFooterComponent={
					hasMore && !loading ? (
						<Pressable onPress={handleLoadMore} className="py-4 items-center">
							<Text className="text-primary text-sm">Load more</Text>
						</Pressable>
					) : null
				}
			/>
		</SafeAreaView>
	);
}
