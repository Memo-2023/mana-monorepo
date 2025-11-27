import React, { useState, useCallback } from 'react';
import { View, Pressable, Platform, StyleSheet, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import Icon from '~/components/atoms/Icon';
import MemoMenu from '~/features/menus/MemoMenu';
import TableOfContentsMenu from './TableOfContentsMenu';
import { useTheme } from '~/features/theme/ThemeProvider';
import { useRecordingStore } from '~/features/audioRecordingV2/store/recordingStore';
import colors from '~/tailwind.config.js';

interface TableOfContentsItem {
	id: string;
	title: string;
	icon: string;
	onPress: () => void;
}

interface MemoBottomBarProps {
	onShare?: () => void;
	onAddRecording?: () => void;
	onEdit?: () => void;
	// MemoMenu props
	onPin?: () => void;
	onCopyTranscript?: () => void;
	onManageSpaces?: () => void;
	onReplaceWord?: () => void;
	onLabelSpeakers?: () => void;
	onSearch?: () => void;
	onTranslate?: () => void;
	onAskQuestion?: () => void;
	onCreateMemory?: () => void;
	onAddPhoto?: () => void;
	onReprocess?: () => void;
	onDelete?: () => void;
	isPinned?: boolean;
	hasStructuredTranscript?: boolean;
	// Table of Contents
	tableOfContentsItems?: TableOfContentsItem[];
	// Edit loading state
	isEditMode?: boolean;
	// Custom background color (for memo detail page)
	backgroundColor?: string;
}

/**
 * MemoBottomBar - Eine untere Aktionsleiste für Memo-Details
 *
 * Diese Komponente zeigt die gleichen Icons wie im Header am unteren Rand der Seite an.
 * Sie enthält die vier Hauptaktionen: Teilen, Aufnahme hinzufügen, Bearbeiten und das MemoMenu.
 */
const MemoBottomBar: React.FC<MemoBottomBarProps> = ({
	onShare,
	onAddRecording,
	onEdit,
	onPin,
	onCopyTranscript,
	onManageSpaces,
	onReplaceWord,
	onLabelSpeakers,
	onSearch,
	onTranslate,
	onAskQuestion,
	onCreateMemory,
	onAddPhoto,
	onReprocess,
	onDelete,
	isPinned = false,
	hasStructuredTranscript = false,
	tableOfContentsItems = [],
	isEditMode = false,
	backgroundColor,
}) => {
	const { isDark, themeVariant } = useTheme();
	const insets = useSafeAreaInsets();
	const { isRecording } = useRecordingStore();
	const [isEditLoading, setIsEditLoading] = useState(false);

	// Reset loading state when edit mode changes
	React.useEffect(() => {
		if (isEditMode) {
			setIsEditLoading(false);
		}
	}, [isEditMode]);

	// Get theme colors like PromptBar
	// Use provided backgroundColor or fall back to menuBackground
	const menuBackgroundColor = React.useMemo(() => {
		if (backgroundColor) {
			return backgroundColor;
		}
		const themeColors = colors.theme?.extend?.colors as Record<string, any>;
		return isDark
			? themeColors?.dark?.[themeVariant]?.menuBackground || '#252525'
			: themeColors?.[themeVariant]?.menuBackground || '#FFFFFF';
	}, [backgroundColor, isDark, themeVariant]);

	const borderColor = React.useMemo(() => {
		const themeColors = colors.theme?.extend?.colors as Record<string, any>;
		return isDark
			? themeColors?.dark?.[themeVariant]?.border || '#424242'
			: themeColors?.[themeVariant]?.border || '#e6e6e6';
	}, [isDark, themeVariant]);

	const borderLightColor = React.useMemo(() => {
		const themeColors = colors.theme?.extend?.colors as Record<string, any>;
		return isDark
			? themeColors?.dark?.[themeVariant]?.borderLight || '#333333'
			: themeColors?.[themeVariant]?.borderLight || '#f2f2f2';
	}, [isDark, themeVariant]);

	// Icon-Farbe basierend auf dem Theme
	const iconColor = isDark ? '#FFFFFF' : '#000000';

	// Icon-Farbe für deaktivierte Buttons
	const disabledIconColor = isDark ? '#666666' : '#CCCCCC';

	// Haptic feedback helper
	const triggerHaptic = useCallback(async () => {
		try {
			await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
		} catch (error) {
			console.debug('Haptic feedback error:', error);
		}
	}, []);

	// Handlers with haptic feedback
	const handleAddRecordingPress = useCallback(async () => {
		await triggerHaptic();
		onAddRecording?.();
	}, [onAddRecording, triggerHaptic]);

	const handleEditPress = useCallback(async () => {
		await triggerHaptic();
		setIsEditLoading(true);
		onEdit?.();
		// The loading state will be cleared by the parent component when edit mode is ready
	}, [onEdit, triggerHaptic]);

	const handleSharePress = useCallback(async () => {
		await triggerHaptic();
		onShare?.();
	}, [onShare, triggerHaptic]);

	return (
		<View
			style={[
				styles.container,
				{
					backgroundColor: menuBackgroundColor,
					borderTopWidth: 1,
					borderColor: borderColor,
					paddingBottom: insets.bottom > 0 ? Math.max(insets.bottom - 12, 0) : 0,
				},
			]}
		>
			{/* Add Recording Button */}
			<Pressable
				style={[
					styles.iconButton,
					{
						backgroundColor: isRecording ? 'transparent' : 'transparent',
					},
				]}
				onPress={handleAddRecordingPress}
				disabled={isRecording}
			>
				<Icon name="mic-outline" size={24} color={isRecording ? disabledIconColor : iconColor} />
			</Pressable>

			{/* Edit Button */}
			<Pressable style={styles.iconButton} onPress={handleEditPress} disabled={isEditLoading}>
				{isEditLoading ? (
					<ActivityIndicator size="small" color={iconColor} />
				) : (
					<Icon name="create-outline" size={24} color={iconColor} />
				)}
			</Pressable>

			{/* Table of Contents */}
			<View style={styles.iconButton}>
				<TableOfContentsMenu items={tableOfContentsItems} />
			</View>

			{/* Share Button */}
			<Pressable style={styles.iconButton} onPress={handleSharePress}>
				<Icon
					name={Platform.OS === 'android' ? 'share-social-outline' : 'share-outline'}
					size={24}
					color={iconColor}
				/>
			</Pressable>

			{/* Memo Menu */}
			<View style={styles.iconButton}>
				<MemoMenu
					isPinned={isPinned}
					onPin={onPin}
					onCopyTranscript={onCopyTranscript}
					onManageSpaces={onManageSpaces}
					onReplaceWord={onReplaceWord}
					onLabelSpeakers={onLabelSpeakers}
					onSearch={onSearch}
					onTranslate={onTranslate}
					onAskQuestion={onAskQuestion}
					onCreateMemory={onCreateMemory}
					onAddPhoto={onAddPhoto}
					onReprocess={onReprocess}
					onDelete={onDelete}
					hasStructuredTranscript={hasStructuredTranscript}
				/>
			</View>
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		position: 'absolute',
		bottom: 0,
		left: 0,
		right: 0,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-evenly',
		paddingTop: 8,
		paddingHorizontal: 16,
	},
	iconButton: {
		borderRadius: 16,
		justifyContent: 'center',
		alignItems: 'center',
		width: '20%',
		height: 48,
	},
});

export default React.memo(MemoBottomBar);
