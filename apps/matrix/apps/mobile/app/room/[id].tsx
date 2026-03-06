import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import {
	View,
	FlatList,
	Text,
	TextInput,
	Pressable,
	ActivityIndicator,
	Modal,
	ScrollView,
	Alert,
	ActionSheetIOS,
	Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Lock, DotsThreeVertical, X } from 'phosphor-react-native';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { useMatrixStore } from '~/src/matrix/store';
import MessageBubble from '~/src/components/MessageBubble';
import MessageInput from '~/src/components/MessageInput';
import TypingIndicator from '~/src/components/TypingIndicator';
import DateSeparator from '~/src/components/DateSeparator';
import ImageViewer from '~/src/components/ImageViewer';
import UserProfileModal from '~/src/components/UserProfileModal';
import VoiceRecorder from '~/src/components/VoiceRecorder';
import UnreadSeparator from '~/src/components/UnreadSeparator';
import { getMimetypeFromFilename } from '~/src/matrix/upload';
import type { SimpleMessage, SimpleRoom, RoomMember } from '~/src/matrix/types';

type ListItem =
	| { type: 'message'; data: SimpleMessage }
	| { type: 'date'; timestamp: number; key: string }
	| { type: 'unread'; key: string };

function isSameDay(a: number, b: number) {
	const da = new Date(a), db = new Date(b);
	return da.getFullYear() === db.getFullYear() &&
		da.getMonth() === db.getMonth() &&
		da.getDate() === db.getDate();
}

function buildListItems(messages: SimpleMessage[], firstUnreadEventId: string | null): ListItem[] {
	const items: ListItem[] = [];
	let unreadInserted = false;
	for (let i = 0; i < messages.length; i++) {
		const msg = messages[i];
		if (!messages[i - 1] || !isSameDay(messages[i - 1].timestamp, msg.timestamp)) {
			items.push({ type: 'date', timestamp: msg.timestamp, key: `date_${msg.timestamp}_${i}` });
		}
		if (!unreadInserted && firstUnreadEventId && msg.id === firstUnreadEventId) {
			items.push({ type: 'unread', key: 'unread_separator' });
			unreadInserted = true;
		}
		items.push({ type: 'message', data: msg });
	}
	return items;
}

function MemberRow({ member, onClose }: { member: RoomMember; onClose: () => void }) {
	const [showProfile, setShowProfile] = useState(false);
	return (
		<>
			<Pressable
				onPress={() => setShowProfile(true)}
				className={({ pressed }) => `flex-row items-center gap-3 px-4 py-3 ${pressed ? 'bg-surface/60' : ''}`}
			>
				<View className="w-10 h-10 rounded-full bg-surface border border-border overflow-hidden items-center justify-center">
					{member.avatarUrl ? (
						<Image source={{ uri: member.avatarUrl }} style={{ width: 40, height: 40 }} contentFit="cover" />
					) : (
						<Text className="text-foreground font-semibold">
							{member.displayName[0]?.toUpperCase() ?? '?'}
						</Text>
					)}
				</View>
				<View className="flex-1">
					<Text className="text-foreground text-sm font-medium">{member.displayName}</Text>
					<Text className="text-muted-foreground text-xs" numberOfLines={1}>{member.userId}</Text>
				</View>
				{member.powerLevel >= 100 && (
					<View className="bg-primary/20 rounded-full px-2 py-0.5">
						<Text className="text-primary text-xs">Admin</Text>
					</View>
				)}
				{member.powerLevel >= 50 && member.powerLevel < 100 && (
					<View className="bg-surface border border-border rounded-full px-2 py-0.5">
						<Text className="text-muted-foreground text-xs">Mod</Text>
					</View>
				)}
			</Pressable>
			<UserProfileModal
				userId={showProfile ? member.userId : null}
				onClose={() => { setShowProfile(false); onClose(); }}
			/>
		</>
	);
}

export default function RoomScreen() {
	const { id } = useLocalSearchParams<{ id: string }>();
	const router = useRouter();
	const listRef = useRef<FlatList<ListItem>>(null);

	const [loadingMore, setLoadingMore] = useState(false);
	const [uploading, setUploading] = useState(false);
	const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);
	const [replyTo, setReplyTo] = useState<SimpleMessage | null>(null);
	const [editingMessage, setEditingMessage] = useState<SimpleMessage | null>(null);
	const [showMembers, setShowMembers] = useState(false);
	const [viewingImage, setViewingImage] = useState<string | null>(null);
	const [profileUserId, setProfileUserId] = useState<string | null>(null);
	const [forwardingMessage, setForwardingMessage] = useState<SimpleMessage | null>(null);
	const [forwardSearch, setForwardSearch] = useState('');

	const {
		rooms, messages, firstUnreadEventId, typingUsers, roomMembers, client, credentials,
		selectRoom, loadRoomMembers, sendMessage, editMessage,
		sendReaction, redactMessage, sendTyping,
		sendImage, sendFile, sendVoice, forwardMessage, leaveRoom,
	} = useMatrixStore();

	const room = rooms.find((r) => r.id === id);
	const isAdmin = useMemo(() => {
		if (!client || !id) return false;
		const matrixRoom = client.getRoom(id);
		const userId = client.getUserId() ?? '';
		return (matrixRoom?.getMember(userId)?.powerLevel ?? 0) >= 100;
	}, [client, id]);

	useEffect(() => { if (id) selectRoom(id); }, [id]);

	const listItems = useMemo(() => buildListItems(messages, firstUnreadEventId), [messages, firstUnreadEventId]);

	// Scroll to first unread message on initial load
	useEffect(() => {
		if (!firstUnreadEventId || listItems.length === 0) return;
		const unreadIndex = listItems.findIndex((item) => item.type === 'unread');
		if (unreadIndex > 0) {
			setTimeout(() => {
				listRef.current?.scrollToIndex({ index: unreadIndex, animated: true, viewPosition: 0 });
			}, 300);
		}
	}, [firstUnreadEventId]);

	const handleLoadMore = async () => {
		if (!client || !id || loadingMore) return;
		const matrixRoom = client.getRoom(id);
		if (!matrixRoom) return;
		setLoadingMore(true);
		try { await client.scrollback(matrixRoom, 30); }
		finally { setLoadingMore(false); }
	};

	const handleRoomOptions = () => {
		const options = ['Cancel', 'Members', ...(isAdmin ? ['Room settings'] : []), 'Leave room'];
		const destructiveIndex = options.length - 1;

		if (Platform.OS === 'ios') {
			ActionSheetIOS.showActionSheetWithOptions(
				{ options, cancelButtonIndex: 0, destructiveButtonIndex: destructiveIndex },
				(index) => {
					if (index === 1) { loadRoomMembers(id!); setShowMembers(true); }
					if (isAdmin && index === 2) { router.push({ pathname: '/room/settings', params: { id } }); }
					if (index === options.length - 1) handleLeave();
				},
			);
		} else {
			Alert.alert(room?.name ?? 'Room', undefined, [
				{ text: 'Members', onPress: () => { loadRoomMembers(id!); setShowMembers(true); } },
				...(isAdmin ? [{ text: 'Room settings', onPress: () => router.push({ pathname: '/room/settings', params: { id } }) }] : []),
				{ text: 'Leave room', style: 'destructive' as const, onPress: handleLeave },
				{ text: 'Cancel', style: 'cancel' as const },
			]);
		}
	};

	const handleLeave = () => {
		Alert.alert('Leave room', `Leave "${room?.name ?? id}"?`, [
			{ text: 'Cancel', style: 'cancel' },
			{
				text: 'Leave',
				style: 'destructive',
				onPress: async () => {
					await leaveRoom(id!);
					router.replace('/(app)');
				},
			},
		]);
	};

	const handleAttach = () => {
		if (Platform.OS === 'ios') {
			ActionSheetIOS.showActionSheetWithOptions(
				{ options: ['Cancel', 'Photo Library', 'Camera', 'File'], cancelButtonIndex: 0 },
				(index) => {
					if (index === 1) pickImage('library');
					if (index === 2) pickImage('camera');
					if (index === 3) pickDocument();
				},
			);
		} else {
			Alert.alert('Attach', undefined, [
				{ text: 'Photo Library', onPress: () => pickImage('library') },
				{ text: 'Camera', onPress: () => pickImage('camera') },
				{ text: 'File', onPress: pickDocument },
				{ text: 'Cancel', style: 'cancel' },
			]);
		}
	};

	const pickImage = async (source: 'library' | 'camera') => {
		const fn = source === 'camera' ? ImagePicker.launchCameraAsync : ImagePicker.launchImageLibraryAsync;
		const result = await fn({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.85 });
		if (result.canceled || !result.assets[0]) return;
		const asset = result.assets[0];
		const filename = asset.fileName ?? `image_${Date.now()}.jpg`;
		setUploading(true);
		try {
			await sendImage(asset.uri, filename, asset.mimeType ?? getMimetypeFromFilename(filename), asset.width, asset.height);
		} catch (err) {
			Alert.alert('Upload failed', err instanceof Error ? err.message : 'Unknown error');
		} finally { setUploading(false); }
	};

	const pickDocument = async () => {
		const result = await DocumentPicker.getDocumentAsync({ copyToCacheDirectory: true });
		if (result.canceled || !result.assets[0]) return;
		const asset = result.assets[0];
		setUploading(true);
		try {
			await sendFile(asset.uri, asset.name, asset.mimeType ?? getMimetypeFromFilename(asset.name));
		} catch (err) {
			Alert.alert('Upload failed', err instanceof Error ? err.message : 'Unknown error');
		} finally { setUploading(false); }
	};

	const handleForward = useCallback((msg: SimpleMessage) => {
		setForwardingMessage(msg);
		setForwardSearch('');
	}, []);

	const handleForwardToRoom = useCallback(async (targetRoom: SimpleRoom) => {
		if (!forwardingMessage) return;
		try {
			await forwardMessage(forwardingMessage.id, targetRoom.id);
			setForwardingMessage(null);
		} catch (err) {
			Alert.alert('Forward failed', err instanceof Error ? err.message : 'Unknown error');
		}
	}, [forwardingMessage, forwardMessage]);

	const handleEdit = useCallback((msg: SimpleMessage) => {
		setReplyTo(null);
		setEditingMessage(msg);
	}, []);

	const handleSend = useCallback(async (body: string, replyToEventId?: string) => {
		await sendMessage(body, replyToEventId);
	}, [sendMessage]);

	const handleEditSave = useCallback(async (eventId: string, newBody: string) => {
		await editMessage(eventId, newBody);
	}, [editMessage]);

	const renderItem = ({ item, index }: { item: ListItem; index: number }) => {
		if (item.type === 'date') return <DateSeparator timestamp={item.timestamp} />;
		if (item.type === 'unread') return <UnreadSeparator />;
		const msgIndex = messages.indexOf(item.data);
		return (
			<MessageBubble
				message={item.data}
				prevMessage={messages[msgIndex - 1] ?? null}
				onReply={(msg) => { setEditingMessage(null); setReplyTo(msg); }}
				onEdit={handleEdit}
				onReact={sendReaction}
				onDelete={redactMessage}
				onForward={handleForward}
				onImagePress={setViewingImage}
				onAvatarPress={setProfileUserId}
			/>
		);
	};

	return (
		<SafeAreaView className="flex-1 bg-background" edges={['top', 'bottom']}>
			{/* Header */}
			<View className="flex-row items-center gap-3 px-4 py-3 border-b border-border">
				<Pressable onPress={() => router.back()} className={({ pressed }) => `p-1 ${pressed ? 'opacity-50' : ''}`}>
					<ArrowLeft size={22} color="#7c6bff" />
				</Pressable>
				<View className="flex-1">
					<View className="flex-row items-center gap-1.5">
						<Text className="text-foreground font-semibold text-base" numberOfLines={1}>
							{room?.name ?? id}
						</Text>
						{room?.isEncrypted && <Lock size={12} color="#22c55e" weight="fill" />}
					</View>
					{room?.topic ? (
						<Text className="text-muted-foreground text-xs" numberOfLines={1}>{room.topic}</Text>
					) : room?.memberCount != null ? (
						<Text className="text-muted-foreground text-xs">
							{room.memberCount} member{room.memberCount !== 1 ? 's' : ''}
						</Text>
					) : null}
				</View>
				<Pressable onPress={handleRoomOptions} className={({ pressed }) => `p-1 ${pressed ? 'opacity-50' : ''}`}>
					<DotsThreeVertical size={22} color="#6b7280" />
				</Pressable>
			</View>

			{(loadingMore || uploading) && (
				<View className="flex-row items-center justify-center gap-2 py-1.5 bg-primary/10">
					<ActivityIndicator size="small" color="#7c6bff" />
					<Text className="text-primary text-xs">{uploading ? 'Uploading...' : 'Loading...'}</Text>
				</View>
			)}

			<FlatList
				ref={listRef}
				data={listItems}
				keyExtractor={(item) => item.type === 'message' ? item.data.id : item.key}
				renderItem={renderItem}
				contentContainerClassName="px-0 py-2"
				onEndReached={handleLoadMore}
				onEndReachedThreshold={0.15}
				onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
				maintainVisibleContentPosition={{ minIndexForVisible: 0 }}
				keyboardDismissMode="interactive"
				ListEmptyComponent={
					<View className="items-center justify-center py-20">
						<Text className="text-muted-foreground text-sm">No messages yet</Text>
					</View>
				}
			/>

			{typingUsers.length > 0 && <TypingIndicator users={typingUsers} />}

			{showVoiceRecorder ? (
				<VoiceRecorder
					onSend={async (uri, durationMs) => {
						setUploading(true);
						try { await sendVoice(uri, durationMs); }
						catch (err) { Alert.alert('Upload failed', err instanceof Error ? err.message : 'Unknown error'); }
						finally { setUploading(false); setShowVoiceRecorder(false); }
					}}
					onCancel={() => setShowVoiceRecorder(false)}
				/>
			) : (
				<MessageInput
					onSend={handleSend}
					onEdit={handleEditSave}
					onTyping={sendTyping}
					onAttach={handleAttach}
					onVoiceRecord={() => setShowVoiceRecorder(true)}
					replyTo={replyTo}
					onCancelReply={() => setReplyTo(null)}
					editingMessage={editingMessage}
					onCancelEdit={() => setEditingMessage(null)}
				/>
			)}

			{/* Members modal */}
			<Modal visible={showMembers} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowMembers(false)}>
				<SafeAreaView className="flex-1 bg-background" edges={['top']}>
					<View className="flex-row items-center justify-between px-4 py-3 border-b border-border">
						<Text className="text-foreground text-lg font-semibold">
							Members{room?.memberCount != null ? ` (${room.memberCount})` : ''}
						</Text>
						<Pressable onPress={() => setShowMembers(false)} className={({ pressed }) => `p-1 ${pressed ? 'opacity-50' : ''}`}>
							<X size={22} color="#6b7280" />
						</Pressable>
					</View>
					<ScrollView contentContainerClassName="py-2">
						{roomMembers.length === 0 ? (
							<View className="items-center py-10"><ActivityIndicator color="#7c6bff" /></View>
						) : (
							roomMembers.map((member) => (
								<MemberRow key={member.userId} member={member} onClose={() => setShowMembers(false)} />
							))
						)}
					</ScrollView>
				</SafeAreaView>
			</Modal>

			<ImageViewer uri={viewingImage} onClose={() => setViewingImage(null)} />

			<UserProfileModal userId={profileUserId} onClose={() => setProfileUserId(null)} />

			{/* Forward message modal */}
			<Modal visible={!!forwardingMessage} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setForwardingMessage(null)}>
				<SafeAreaView className="flex-1 bg-background" edges={['top']}>
					<View className="flex-row items-center justify-between px-4 py-3 border-b border-border">
						<Text className="text-foreground text-lg font-semibold">Forward to...</Text>
						<Pressable onPress={() => setForwardingMessage(null)} className={({ pressed }) => `p-1 ${pressed ? 'opacity-50' : ''}`}>
							<X size={22} color="#6b7280" />
						</Pressable>
					</View>
					<View className="px-4 py-2">
						<TextInput
							className="bg-surface border border-border rounded-xl px-4 py-2.5 text-foreground text-sm"
							placeholder="Search rooms..."
							placeholderTextColor="#6b7280"
							value={forwardSearch}
							onChangeText={setForwardSearch}
							autoFocus
						/>
					</View>
					{forwardingMessage && (
						<View className="mx-4 mb-2 px-3 py-2 bg-surface border border-border rounded-xl">
							<Text className="text-muted-foreground text-xs mb-0.5">Message:</Text>
							<Text className="text-foreground text-sm" numberOfLines={2}>{forwardingMessage.body}</Text>
						</View>
					)}
					<ScrollView contentContainerClassName="py-1">
						{rooms
							.filter((r) => r.id !== id && r.name.toLowerCase().includes(forwardSearch.toLowerCase()))
							.map((r) => (
								<Pressable
									key={r.id}
									onPress={() => handleForwardToRoom(r)}
									className={({ pressed }) => `flex-row items-center gap-3 px-4 py-3 ${pressed ? 'bg-surface/60' : ''}`}
								>
									<View className="w-10 h-10 rounded-full bg-surface border border-border overflow-hidden items-center justify-center">
										{r.avatar ? (
											<Image source={{ uri: r.avatar }} style={{ width: 40, height: 40 }} contentFit="cover" />
										) : (
											<Text className="text-foreground font-semibold">
												{r.name[0]?.toUpperCase() ?? '?'}
											</Text>
										)}
									</View>
									<View className="flex-1">
										<Text className="text-foreground text-sm font-medium" numberOfLines={1}>{r.name}</Text>
										{r.isDirect && <Text className="text-muted-foreground text-xs">Direct message</Text>}
									</View>
								</Pressable>
							))}
					</ScrollView>
				</SafeAreaView>
			</Modal>
		</SafeAreaView>
	);
}
