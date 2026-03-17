import { useState, useRef, useEffect } from 'react';
import { View, TextInput, Pressable, Text } from 'react-native';
import * as Haptics from 'expo-haptics';
import { ArrowUp, Paperclip, Microphone, X, PencilSimple } from 'phosphor-react-native';
import type { SimpleMessage } from '~/src/matrix/types';

interface Props {
	onSend: (body: string, replyToEventId?: string) => Promise<void>;
	onEdit?: (eventId: string, newBody: string) => Promise<void>;
	onTyping: (typing: boolean) => Promise<void>;
	onAttach?: () => void;
	onVoiceRecord?: () => void;
	replyTo?: SimpleMessage | null;
	onCancelReply?: () => void;
	editingMessage?: SimpleMessage | null;
	onCancelEdit?: () => void;
}

export default function MessageInput({
	onSend,
	onEdit,
	onTyping,
	onAttach,
	onVoiceRecord,
	replyTo,
	onCancelReply,
	editingMessage,
	onCancelEdit,
}: Props) {
	const [text, setText] = useState('');
	const [sending, setSending] = useState(false);
	const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

	// Pre-fill text when entering edit mode
	useEffect(() => {
		if (editingMessage) setText(editingMessage.body);
		else setText('');
	}, [editingMessage?.id]);

	const handleChangeText = (value: string) => {
		setText(value);
		if (!editingMessage) {
			onTyping(true);
			if (typingTimer.current) clearTimeout(typingTimer.current);
			typingTimer.current = setTimeout(() => onTyping(false), 3000);
		}
	};

	const handleSubmit = async () => {
		const body = text.trim();
		if (!body || sending) return;
		setSending(true);
		if (typingTimer.current) clearTimeout(typingTimer.current);
		onTyping(false);
		await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
		try {
			if (editingMessage) {
				await onEdit?.(editingMessage.id, body);
				onCancelEdit?.();
			} else {
				await onSend(body, replyTo?.id);
				onCancelReply?.();
			}
			setText('');
		} finally {
			setSending(false);
		}
	};

	const canSend = text.trim().length > 0 && !sending;
	const isEditing = !!editingMessage;
	const showMic = !canSend && !isEditing && !!onVoiceRecord;

	return (
		<View className="border-t border-border bg-background">
			{/* Context banner: Reply or Edit */}
			{(replyTo || isEditing) && (
				<View className="flex-row items-center gap-2 px-3 pt-2 pb-1">
					<View
						className={`w-0.5 self-stretch rounded-full ${isEditing ? 'bg-yellow-500' : 'bg-primary'}`}
					/>
					<View className="flex-1">
						<Text
							className={`text-xs font-medium ${isEditing ? 'text-yellow-500' : 'text-primary'}`}
						>
							{isEditing ? 'Editing message' : `Reply to ${replyTo!.senderName}`}
						</Text>
						<Text className="text-muted-foreground text-xs" numberOfLines={1}>
							{isEditing ? editingMessage!.body : replyTo!.body}
						</Text>
					</View>
					<Pressable
						onPress={isEditing ? onCancelEdit : onCancelReply}
						className="p-1 active:opacity-50"
					>
						<X size={16} color="#6b7280" />
					</Pressable>
				</View>
			)}

			{/* Input row */}
			<View className="flex-row items-end gap-2 px-3 py-2">
				{onAttach && !isEditing && (
					<Pressable
						onPress={onAttach}
						className="w-10 h-10 items-center justify-center rounded-full active:opacity-50"
					>
						<Paperclip size={20} color="#6b7280" />
					</Pressable>
				)}

				<TextInput
					className="flex-1 bg-surface border border-border rounded-2xl px-4 py-3 text-foreground max-h-32"
					value={text}
					onChangeText={handleChangeText}
					placeholder={
						isEditing
							? 'Edit message...'
							: replyTo
								? `Reply to ${replyTo.senderName}...`
								: 'Message...'
					}
					placeholderTextColor="#6b7280"
					multiline
					textAlignVertical="center"
				/>

				{showMic ? (
					<Pressable
						onPress={onVoiceRecord}
						className="w-10 h-10 rounded-full items-center justify-center bg-surface border border-border active:opacity-60"
					>
						<Microphone size={20} color="#7c6bff" />
					</Pressable>
				) : (
					<Pressable
						onPress={handleSubmit}
						disabled={!canSend}
						className={`w-10 h-10 rounded-full items-center justify-center ${
							canSend
								? isEditing
									? 'bg-yellow-500'
									: 'bg-primary'
								: 'bg-surface border border-border'
						} active:opacity-60`}
					>
						{isEditing ? (
							<PencilSimple size={16} weight="bold" color={canSend ? '#fff' : '#6b7280'} />
						) : (
							<ArrowUp size={18} weight="bold" color={canSend ? '#fff' : '#6b7280'} />
						)}
					</Pressable>
				)}
			</View>
		</View>
	);
}
