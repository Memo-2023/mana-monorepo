import { View, Text, Pressable, ActionSheetIOS, Platform, Alert, Clipboard } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, interpolate, Extrapolation } from 'react-native-reanimated';
import { Image } from 'expo-image';
import { ArrowBendUpLeft } from 'phosphor-react-native';
import type { SimpleMessage } from '~/src/matrix/types';
import MessageText from './MessageText';
import VoiceMessage from './VoiceMessage';

interface Props {
	message: SimpleMessage;
	prevMessage: SimpleMessage | null;
	onReply?: (message: SimpleMessage) => void;
	onEdit?: (message: SimpleMessage) => void;
	onReact?: (eventId: string, emoji: string) => void;
	onDelete?: (eventId: string) => void;
	onImagePress?: (uri: string) => void;
	onAvatarPress?: (userId: string) => void;
}

function formatTime(ts: number) {
	return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function AvatarCircle({ name, url, onPress, size = 28 }: { name: string; url?: string; onPress?: () => void; size?: number }) {
	const inner = (
		<View
			style={{ width: size, height: size, borderRadius: size / 2 }}
			className="bg-surface border border-border overflow-hidden items-center justify-center"
		>
			{url ? (
				<Image source={{ uri: url }} style={{ width: size, height: size }} contentFit="cover" />
			) : (
				<Text style={{ fontSize: size * 0.42 }} className="text-foreground font-semibold">
					{name[0]?.toUpperCase() ?? '?'}
				</Text>
			)}
		</View>
	);
	if (!onPress) return inner;
	return (
		<Pressable onPress={onPress} className={({ pressed }) => `${pressed ? 'opacity-60' : ''}`}>
			{inner}
		</Pressable>
	);
}

const QUICK_REACTIONS = ['👍', '❤️', '😂', '😮', '😢'];

function SwipeReplyAction({ progress }: { progress: Animated.SharedValue<number> }) {
	const style = useAnimatedStyle(() => ({
		opacity: interpolate(progress.value, [0, 0.5, 1], [0, 0.6, 1], Extrapolation.CLAMP),
		transform: [{ scale: interpolate(progress.value, [0, 1], [0.5, 1], Extrapolation.CLAMP) }],
	}));
	return (
		<View className="justify-center items-center w-16">
			<Animated.View style={style} className="w-9 h-9 rounded-full bg-primary/20 items-center justify-center">
				<ArrowBendUpLeft size={18} color="#7c6bff" />
			</Animated.View>
		</View>
	);
}

export default function MessageBubble({ message, prevMessage, onReply, onEdit, onReact, onDelete, onImagePress, onAvatarPress }: Props) {
	const isOwn = message.isOwn;
	const isGrouped =
		!message.redacted &&
		prevMessage !== null &&
		prevMessage.sender === message.sender &&
		message.timestamp - prevMessage.timestamp < 300_000;
	const showAvatar = !isOwn && !isGrouped;
	const showSenderName = !isOwn && !isGrouped;

	const handleLongPress = () => {
		const extraOptions = isOwn && !message.redacted ? ['Edit', 'Delete'] : [];
		const options = ['Cancel', 'Reply', ...QUICK_REACTIONS, 'Copy text', ...extraOptions];
		const destructiveIndex = isOwn && !message.redacted ? options.length - 1 : undefined;

		if (Platform.OS === 'ios') {
			ActionSheetIOS.showActionSheetWithOptions(
				{ options, cancelButtonIndex: 0, destructiveButtonIndex: destructiveIndex },
				(index) => {
					if (index === 0) return;
					if (index === 1) { onReply?.(message); return; }
					const ri = index - 2;
					if (ri < QUICK_REACTIONS.length) { onReact?.(message.id, QUICK_REACTIONS[ri]); return; }
					const ai = index - 2 - QUICK_REACTIONS.length;
					if (ai === 0) { Clipboard.setString(message.body); return; }
					if (ai === 1 && isOwn) { onEdit?.(message); return; }
					if (ai === 2 && isOwn) { onDelete?.(message.id); }
				},
			);
		} else {
			Alert.alert('Message', undefined, [
				{ text: 'Reply', onPress: () => onReply?.(message) },
				...(isOwn ? [{ text: 'Edit', onPress: () => onEdit?.(message) }] : []),
				{ text: 'Copy text', onPress: () => Clipboard.setString(message.body) },
				...(isOwn && !message.redacted
					? [{ text: 'Delete', style: 'destructive' as const, onPress: () => onDelete?.(message.id) }]
					: []),
				{ text: 'Cancel', style: 'cancel' as const },
			]);
		}
	};

	if (message.redacted) {
		return (
			<View className={`flex-row ${isOwn ? 'justify-end' : 'justify-start'} mb-1 px-3`}>
				<View className="bg-surface border border-border rounded-2xl px-3 py-2">
					<Text className="text-muted-foreground text-sm italic">Message deleted</Text>
				</View>
			</View>
		);
	}

	const renderLeftActions = isOwn
		? undefined
		: (progress: Animated.SharedValue<number>) => <SwipeReplyAction progress={progress} />;

	const renderRightActions = isOwn
		? (progress: Animated.SharedValue<number>) => <SwipeReplyAction progress={progress} />
		: undefined;

	return (
		<Swipeable
			renderLeftActions={renderLeftActions}
			renderRightActions={renderRightActions}
			onSwipeableOpen={(direction) => {
				if ((direction === 'left' && !isOwn) || (direction === 'right' && isOwn)) {
					onReply?.(message);
				}
			}}
			friction={2}
			overshootFriction={8}
		>
			<View className={`flex-row items-end gap-2 ${isOwn ? 'justify-end' : 'justify-start'} ${isGrouped ? 'mb-0.5' : 'mb-3'} px-3`}>
				{/* Left avatar */}
				{!isOwn && (
					<View style={{ width: 28 }} className="mb-0.5">
						{showAvatar && (
							<AvatarCircle
								name={message.senderName}
								url={message.senderAvatar}
								size={28}
								onPress={onAvatarPress ? () => onAvatarPress(message.sender) : undefined}
							/>
						)}
					</View>
				)}

				<View className={`max-w-[75%] ${isOwn ? 'items-end' : 'items-start'}`}>
					{showSenderName && (
						<Pressable onPress={onAvatarPress ? () => onAvatarPress(message.sender) : undefined}>
							<Text className="text-primary text-xs mb-1 ml-1 font-medium">{message.senderName}</Text>
						</Pressable>
					)}

					<Pressable
						onLongPress={handleLongPress}
						delayLongPress={400}
						className={`rounded-2xl overflow-hidden ${
							isOwn ? 'bg-primary rounded-br-sm' : 'bg-surface border border-border rounded-bl-sm'
						}`}
					>
						{/* Reply preview */}
						{message.replyTo && (
							<View
								className={`mx-2 mt-2 mb-1 px-2 py-1.5 rounded-xl border-l-2 ${
									isOwn ? 'bg-white/10 border-white/40' : 'bg-primary/8 border-primary/40'
								}`}
							>
								<Text className={`text-xs font-semibold mb-0.5 ${isOwn ? 'text-white/80' : 'text-primary'}`} numberOfLines={1}>
									{message.replyToSenderName ?? 'Unknown'}
								</Text>
								<Text className={`text-xs ${isOwn ? 'text-white/60' : 'text-muted-foreground'}`} numberOfLines={2}>
									{message.replyToBody ?? '…'}
								</Text>
							</View>
						)}

						{message.type === 'm.image' && message.media?.thumbnailUrl && (
							<Pressable onPress={() => onImagePress?.(message.media!.thumbnailUrl!)}>
								<Image
									source={{ uri: message.media.thumbnailUrl }}
									style={{ width: 220, height: 165 }}
									contentFit="cover"
								/>
							</Pressable>
						)}

						{message.type === 'm.file' && (
							<View className="flex-row items-center gap-2 px-3 py-2">
								<Text className="text-2xl">📎</Text>
								<Text className={`text-sm flex-1 ${isOwn ? 'text-white' : 'text-foreground'}`} numberOfLines={1}>
									{message.media?.filename ?? message.body}
								</Text>
							</View>
						)}

						{message.type === 'm.audio' && message.media?.downloadUrl && (
							<VoiceMessage
								uri={message.media.downloadUrl}
								duration={message.media.duration}
								isOwn={isOwn}
							/>
						)}

						{(message.type === 'm.text' || message.type === 'm.notice' || message.type === 'm.emote') && (
							<MessageText
								body={message.type === 'm.emote' ? `* ${message.senderName} ${message.body}` : message.body}
								isOwn={isOwn}
							/>
						)}
					</Pressable>

					{/* Reactions */}
					{message.reactions && message.reactions.length > 0 && (
						<View className="flex-row flex-wrap gap-1 mt-1 mx-1">
							{message.reactions.map((r) => (
								<Pressable
									key={r.key}
									onPress={() => onReact?.(message.id, r.key)}
									className={`flex-row items-center gap-0.5 px-2 py-0.5 rounded-full border ${
										r.includesMe ? 'bg-primary/20 border-primary/40' : 'bg-surface border-border'
									}`}
								>
									<Text className="text-xs">{r.key}</Text>
									{r.count > 1 && (
										<Text className={`text-xs ${r.includesMe ? 'text-primary' : 'text-muted-foreground'}`}>
											{r.count}
										</Text>
									)}
								</Pressable>
							))}
						</View>
					)}

					<Text className="text-muted-foreground text-xs mt-0.5 mx-1">
						{formatTime(message.timestamp)}
						{message.edited && ' · edited'}
					</Text>
				</View>
			</View>
		</Swipeable>
	);
}
