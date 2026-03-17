import { View, Text, Pressable } from 'react-native';
import { Image } from 'expo-image';
import type { SimpleRoom } from '~/src/matrix/types';

interface Props {
	room: SimpleRoom;
	onPress: () => void;
}

function formatTime(timestamp?: number): string {
	if (!timestamp) return '';
	const date = new Date(timestamp);
	const now = new Date();
	const diffDays = Math.floor((now.getTime() - date.getTime()) / 86400000);
	if (diffDays === 0) return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
	if (diffDays === 1) return 'Yesterday';
	if (diffDays < 7) return date.toLocaleDateString([], { weekday: 'short' });
	return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

function PresenceDot({ presence }: { presence?: string }) {
	if (!presence || presence === 'offline') return null;
	return (
		<View
			className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-background ${
				presence === 'online' ? 'bg-green-500' : 'bg-yellow-500'
			}`}
		/>
	);
}

export default function RoomListItem({ room, onPress }: Props) {
	const hasHighlight = room.highlightCount > 0;
	const hasUnread = room.unreadCount > 0;
	const displayName = room.name ?? room.id;
	const initial = displayName[0]?.toUpperCase() ?? '?';

	return (
		<Pressable
			onPress={onPress}
			className="flex-row items-center px-4 py-3 gap-3 active:bg-surface/60"
		>
			{/* Avatar */}
			<View className="relative">
				<View className="w-12 h-12 rounded-full bg-surface border border-border overflow-hidden items-center justify-center">
					{room.avatar ? (
						<Image
							source={{ uri: room.avatar }}
							style={{ width: 48, height: 48 }}
							contentFit="cover"
							transition={200}
						/>
					) : (
						<Text className="text-foreground text-lg font-semibold">{initial}</Text>
					)}
				</View>
				{room.isDirect && <PresenceDot presence={room.presence} />}
			</View>

			{/* Content */}
			<View className="flex-1 min-w-0">
				<View className="flex-row items-baseline justify-between">
					<Text
						className={`text-base flex-1 mr-2 ${hasUnread || hasHighlight ? 'text-foreground font-semibold' : 'text-foreground'}`}
						numberOfLines={1}
					>
						{displayName}
					</Text>
					<Text className="text-muted-foreground text-xs shrink-0">
						{formatTime(room.lastMessageTime)}
					</Text>
				</View>

				<View className="flex-row items-center justify-between mt-0.5">
					<Text
						className={`text-sm flex-1 mr-2 ${hasUnread ? 'text-foreground' : 'text-muted-foreground'}`}
						numberOfLines={1}
					>
						{room.lastMessage
							? (room.lastMessageSender && !room.isDirect
									? `${room.lastMessageSender.split(':')[0].slice(1)}: `
									: '') + room.lastMessage
							: room.isEncrypted
								? '🔒 Encrypted'
								: 'No messages'}
					</Text>

					{/* Badge */}
					{(hasUnread || hasHighlight) && (
						<View
							className={`min-w-5 h-5 rounded-full items-center justify-center px-1 ${
								hasHighlight ? 'bg-primary' : 'bg-muted'
							}`}
						>
							<Text className="text-white text-xs font-bold leading-none">
								{hasHighlight
									? room.highlightCount
									: room.unreadCount > 99
										? '99+'
										: room.unreadCount}
							</Text>
						</View>
					)}
				</View>
			</View>
		</Pressable>
	);
}
