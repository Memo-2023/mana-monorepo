import { useState } from 'react';
import {
	View,
	Text,
	TextInput,
	Pressable,
	ScrollView,
	KeyboardAvoidingView,
	Platform,
	ActivityIndicator,
	Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, Users, ChatCircle } from 'phosphor-react-native';
import { useMatrixStore } from '~/src/matrix/store';

type Mode = 'room' | 'dm';

export default function NewRoomScreen() {
	const router = useRouter();
	const { client, selectRoom } = useMatrixStore();

	const [mode, setMode] = useState<Mode>('room');
	const [name, setName] = useState('');
	const [topic, setTopic] = useState('');
	const [dmTarget, setDmTarget] = useState('');
	const [isPrivate, setIsPrivate] = useState(true);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const handleCreate = async () => {
		if (!client) return;
		setError(null);
		setLoading(true);

		try {
			if (mode === 'dm') {
				let userId = dmTarget.trim();
				if (!userId) {
					setError('Enter a Matrix user ID');
					return;
				}
				// Ensure proper format
				if (!userId.startsWith('@')) userId = `@${userId}`;
				if (!userId.includes(':')) {
					const hs = new URL(client.baseUrl).hostname;
					userId = `${userId}:${hs}`;
				}

				const room = await client.createRoom({
					is_direct: true,
					invite: [userId],
					preset: 'trusted_private_chat' as any,
					initial_state: [
						{
							type: 'm.room.encryption',
							state_key: '',
							content: { algorithm: 'm.megolm' },
						},
					],
				});

				selectRoom(room.room_id);
				router.replace(`/room/${room.room_id}`);
			} else {
				if (!name.trim()) {
					setError('Enter a room name');
					return;
				}

				const room = await client.createRoom({
					name: name.trim(),
					topic: topic.trim() || undefined,
					preset: isPrivate ? ('private_chat' as any) : ('public_chat' as any),
					visibility: isPrivate ? ('private' as any) : ('public' as any),
				});

				selectRoom(room.room_id);
				router.replace(`/room/${room.room_id}`);
			}
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Failed to create room');
		} finally {
			setLoading(false);
		}
	};

	return (
		<SafeAreaView className="flex-1 bg-background" edges={['top', 'bottom']}>
			{/* Header */}
			<View className="flex-row items-center gap-3 px-4 py-3 border-b border-border">
				<Pressable
					onPress={() => router.back()}
					className={({ pressed }) => `p-1 ${pressed ? 'opacity-50' : ''}`}
				>
					<ArrowLeft size={22} color="#7c6bff" />
				</Pressable>
				<Text className="text-foreground text-lg font-semibold">New conversation</Text>
			</View>

			<KeyboardAvoidingView
				behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
				className="flex-1"
			>
				<ScrollView
					contentContainerClassName="p-4 gap-5"
					keyboardShouldPersistTaps="handled"
				>
					{/* Mode toggle */}
					<View className="flex-row bg-surface rounded-2xl p-1 border border-border">
						{(['dm', 'room'] as Mode[]).map((m) => (
							<Pressable
								key={m}
								onPress={() => {
									setMode(m);
									setError(null);
								}}
								className={`flex-1 flex-row items-center justify-center gap-2 py-2.5 rounded-xl ${mode === m ? 'bg-primary' : ''}`}
							>
								{m === 'dm' ? (
									<ChatCircle size={16} color={mode === m ? '#fff' : '#6b7280'} />
								) : (
									<Users size={16} color={mode === m ? '#fff' : '#6b7280'} />
								)}
								<Text
									className={`text-sm font-medium ${mode === m ? 'text-white' : 'text-muted-foreground'}`}
								>
									{m === 'dm' ? 'Direct message' : 'Group room'}
								</Text>
							</Pressable>
						))}
					</View>

					{/* DM form */}
					{mode === 'dm' && (
						<View className="gap-4">
							<View>
								<Text className="text-muted-foreground text-xs mb-1 uppercase tracking-wider">
									User ID
								</Text>
								<TextInput
									className="bg-surface border border-border rounded-xl px-4 py-3 text-foreground"
									value={dmTarget}
									onChangeText={setDmTarget}
									autoCapitalize="none"
									autoCorrect={false}
									placeholder="@user:matrix.org"
									placeholderTextColor="#6b7280"
								/>
							</View>
						</View>
					)}

					{/* Room form */}
					{mode === 'room' && (
						<View className="gap-4">
							<View>
								<Text className="text-muted-foreground text-xs mb-1 uppercase tracking-wider">
									Room name
								</Text>
								<TextInput
									className="bg-surface border border-border rounded-xl px-4 py-3 text-foreground"
									value={name}
									onChangeText={setName}
									placeholder="My room"
									placeholderTextColor="#6b7280"
								/>
							</View>
							<View>
								<Text className="text-muted-foreground text-xs mb-1 uppercase tracking-wider">
									Topic (optional)
								</Text>
								<TextInput
									className="bg-surface border border-border rounded-xl px-4 py-3 text-foreground"
									value={topic}
									onChangeText={setTopic}
									placeholder="What this room is about"
									placeholderTextColor="#6b7280"
								/>
							</View>
							<View className="flex-row items-center justify-between bg-surface border border-border rounded-xl px-4 py-3">
								<View>
									<Text className="text-foreground text-sm">Private room</Text>
									<Text className="text-muted-foreground text-xs mt-0.5">
										Only invited members can join
									</Text>
								</View>
								<Switch
									value={isPrivate}
									onValueChange={setIsPrivate}
									trackColor={{ true: '#7c6bff', false: '#2a2a2a' }}
								/>
							</View>
						</View>
					)}

					{/* Error */}
					{error && <Text className="text-destructive text-sm text-center">{error}</Text>}

					{/* Create button */}
					<Pressable
						onPress={handleCreate}
						disabled={loading}
						className={({ pressed }) =>
							`bg-primary rounded-xl py-4 items-center ${pressed || loading ? 'opacity-70' : ''}`
						}
					>
						{loading ? (
							<ActivityIndicator color="#fff" />
						) : (
							<Text className="text-white font-semibold text-base">
								{mode === 'dm' ? 'Start conversation' : 'Create room'}
							</Text>
						)}
					</Pressable>
				</ScrollView>
			</KeyboardAvoidingView>
		</SafeAreaView>
	);
}
