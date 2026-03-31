import React, { useState, useRef, useEffect } from 'react';
import {
	View,
	StyleSheet,
	TouchableOpacity,
	Pressable,
	LayoutChangeEvent,
	Share,
	Alert,
	Clipboard,
	Platform,
} from 'react-native';
import { useTheme } from '~/features/theme/ThemeProvider';
import { useTranslation } from 'react-i18next';
import { useToast } from '~/features/toast/contexts/ToastContext';
import Icon from '~/components/atoms/Icon';
import Text from '~/components/atoms/Text';
import { useAudioPlayer, LockScreenMetadata } from '~/features/audioPlayer/useAudioPlayer';

interface AudioPlayerProps {
	audioUri: string;
	headlineText: string;
	dateText: string;
	durationText?: string;
	fileSizeBytes?: number;
	onDelete?: () => void;
	onPlayStatusChange?: (isPlaying: boolean) => void;
	showCopyButton?: boolean;
	lockScreenMetadata?: LockScreenMetadata;
}

function AudioPlayer({
	audioUri,
	headlineText,
	dateText,
	durationText,
	fileSizeBytes,
	onDelete,
	onPlayStatusChange,
	showCopyButton = true,
	lockScreenMetadata,
}: AudioPlayerProps) {
	const { isDark, themeVariant } = useTheme();
	const { t } = useTranslation();
	const { showSuccess, showError } = useToast();
	const [timelineWidth, setTimelineWidth] = useState(0);
	const [containerWidth, setContainerWidth] = useState(0);
	const timelineRef = useRef<View>(null);

	// Audio-Player-Hook für die Wiedergabe
	const {
		isPlaying,
		duration,
		currentTime,
		status,
		error,
		loadError,
		loadSound,
		playPause,
		stop,
		seek,
		setLockScreenInfo,
		formattedPosition,
		formattedDuration,
		percentComplete,
	} = useAudioPlayer();

	// Lade den Sound, wenn sich die URI ändert
	useEffect(() => {
		if (audioUri) {
			loadSound(audioUri);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [audioUri]);

	// Set lock screen metadata when provided or when headlineText changes
	useEffect(() => {
		const metadata = lockScreenMetadata ?? { title: headlineText, artist: 'Memoro' };
		setLockScreenInfo(metadata);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [lockScreenMetadata, headlineText]);

	// Benachrichtige über Wiedergabestatus, wenn sich isPlaying ändert
	// Verwende einen Ref, um zu verhindern, dass der Callback bei jedem Render aufgerufen wird
	const prevIsPlayingRef = useRef(isPlaying);

	useEffect(() => {
		// Nur aufrufen, wenn sich der Status tatsächlich geändert hat
		if (prevIsPlayingRef.current !== isPlaying) {
			prevIsPlayingRef.current = isPlaying;
			onPlayStatusChange?.(isPlaying);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [isPlaying]);

	const handleTimelinePress = (event: any) => {
		if (loadError || timelineWidth <= 0 || duration <= 0) {
			return;
		}

		const locationX = event.nativeEvent.locationX;
		const percentage = Math.max(0, Math.min(1, locationX / timelineWidth));
		const newPosition = Math.round(percentage * duration * 1000);

		seek(newPosition);
	};

	const handleTimelineLayout = (event: LayoutChangeEvent) => {
		const newWidth = event.nativeEvent.layout.width;
		setTimelineWidth(newWidth);
	};

	const handleContainerLayout = (event: LayoutChangeEvent) => {
		const newWidth = event.nativeEvent.layout.width;
		setContainerWidth(newWidth);
	};

	const handleShare = async () => {
		try {
			await Share.share({
				url: audioUri,
				message: `${headlineText} - ${dateText}`,
			});
			console.debug('Share opened successfully');
		} catch (error) {
			console.debug('Error sharing:', error);
		}
	};

	const handleCopyLink = async () => {
		try {
			await Clipboard.setString(audioUri);
			console.debug('Link copied to clipboard:', audioUri);
			showSuccess(t('memo.audio_link_copied', 'Link copied!'));
		} catch (error) {
			console.debug('Error copying link:', error);
			showError(t('memo.audio_link_copy_error', 'Link could not be copied.'));
		}
	};

	const handleDeletePress = () => {
		Alert.alert(
			t('memo.delete_audio_title', 'Delete Audio Recording'),
			t(
				'memo.delete_audio_confirmation',
				'Do you really want to delete this audio recording? This action cannot be undone.'
			),
			[
				{
					text: t('common.cancel', 'Cancel'),
					style: 'cancel',
				},
				{
					text: t('common.delete', 'Delete'),
					onPress: () => {
						if (onDelete) {
							onDelete();
						}
					},
					style: 'destructive',
				},
			],
			{ cancelable: true }
		);
	};

	const handleShowFile = () => {
		console.debug('Show file:', audioUri);
	};

	// Formatiere Dateigröße in menschenlesbares Format
	const formatFileSize = (bytes?: number): string => {
		if (!bytes) return '';

		const units = ['B', 'KB', 'MB', 'GB'];
		let size = bytes;
		let unitIndex = 0;

		while (size >= 1024 && unitIndex < units.length - 1) {
			size /= 1024;
			unitIndex++;
		}

		return `${size.toFixed(unitIndex > 0 ? 1 : 0)} ${units[unitIndex]}`;
	};

	// Import colors for consistent theme access
	const colors = require('~/tailwind.config.js').theme.extend.colors;

	// Get colors from the theme system (same as MemoPreview)
	const textColor = isDark
		? colors.dark?.[themeVariant]?.text || '#FFFFFF'
		: colors[themeVariant]?.text || '#000000';

	// Container background (like MemoPreview contentBackground)
	const backgroundColor = isDark
		? colors.dark?.[themeVariant]?.contentBackground
		: colors[themeVariant]?.contentBackground;

	// Border color (same as MemoPreview)
	const borderColor = isDark
		? colors.dark?.[themeVariant]?.border || '#424242'
		: colors[themeVariant]?.border || '#e6e6e6';

	// Inner container background (secondary button color)
	const innerBackgroundColor = isDark
		? colors.dark?.[themeVariant]?.secondaryButton
		: colors[themeVariant]?.secondaryButton;

	// Inner border color
	const innerBorderColor = isDark
		? colors.dark?.[themeVariant]?.border || '#424242'
		: colors[themeVariant]?.border || '#e6e6e6';

	const primaryColor = isDark
		? colors.dark?.[themeVariant]?.primary
		: colors[themeVariant]?.primary;

	const styles = StyleSheet.create({
		container: {
			backgroundColor,
			borderColor,
			borderWidth: 1,
			borderRadius: 16, // Same as MemoPreview
			padding: 16,
		},
		headerContainer: {
			marginBottom: 16,
			paddingRight: 80,
		},
		headlineContainer: {
			flexDirection: 'row',
			alignItems: 'center',
		},
		headlineText: {
			fontSize: 16,
			fontWeight: 'bold',
			marginLeft: 8,
			color: textColor,
			flex: 1,
		},
		dateText: {
			fontSize: 14,
			fontWeight: '500',
			color: isDark ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.8)',
			marginTop: 12,
			marginLeft: 32,
		},
		metaText: {
			fontSize: 14,
			fontWeight: '500',
			color: isDark ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.8)',
			marginTop: 4,
			marginLeft: 32,
		},
		timelineContainer: {
			marginBottom: 12,
		},
		timeline: {
			height: 8,
			borderRadius: 4,
			backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
			overflow: 'hidden',
		},
		progress: {
			height: '100%',
			backgroundColor: primaryColor,
		},
		controls: {
			flexDirection: 'row',
			justifyContent: 'space-between',
			alignItems: 'center',
			marginTop: 8,
		},
		scrubber: {
			position: 'absolute',
			top: -6,
			width: 20,
			height: 20,
			borderRadius: 10,
			backgroundColor: primaryColor,
			borderWidth: 3,
			borderColor,
			transform: [{ translateX: -10 }], // Zentriere den Scrubber
		},
		controlButton: {
			flexDirection: 'row',
			alignItems: 'center',
		},
		timestamp: {
			fontSize: 16,
			fontWeight: 'bold',
			color: textColor,
		},
		contentContainer: {
			backgroundColor: isDark ? 'rgba(20, 20, 20, 0.8)' : 'rgba(235, 235, 235, 0.8)',
			borderColor: innerBorderColor,
			borderWidth: 1,
			borderRadius: 8,
			padding: 12,
			marginTop: 8,
		},
		shareButtonContainer: {
			position: 'absolute',
			top: 8,
			right: 8,
			zIndex: 1,
			flexDirection: 'row',
			backgroundColor: isDark ? 'rgba(0, 0, 0, 0.3)' : 'rgba(255, 255, 255, 0.3)',
			borderRadius: 8,
		},
		actionButton: {
			padding: 8,
			marginLeft: 4,
		},
	});

	return (
		<View style={styles.container} onLayout={handleContainerLayout}>
			<View style={styles.shareButtonContainer}>
				<Pressable style={styles.actionButton} onPress={handleShare}>
					<Icon
						name={Platform.OS === 'android' ? 'share-social-outline' : 'share-outline'}
						size={20}
						color={textColor}
					/>
				</Pressable>
				{showCopyButton && (
					<Pressable style={styles.actionButton} onPress={handleCopyLink}>
						<Icon name="copy-outline" size={20} color={textColor} />
					</Pressable>
				)}
				{onDelete && (
					<Pressable style={styles.actionButton} onPress={handleDeletePress}>
						<Icon name="trash-outline" size={20} color={textColor} />
					</Pressable>
				)}
			</View>

			<View style={styles.headerContainer}>
				<View style={styles.headlineContainer}>
					<Icon name="mic-outline" size={24} color={textColor} />
					<Text style={styles.headlineText}>{headlineText}</Text>
				</View>
				{dateText && <Text style={styles.dateText}>{dateText}</Text>}
				{(durationText || fileSizeBytes) && (
					<Text style={styles.metaText}>
						{[durationText, formatFileSize(fileSizeBytes)].filter(Boolean).join(' • ')}
					</Text>
				)}
			</View>

			<View style={styles.contentContainer}>
				<View style={styles.timelineContainer}>
					<TouchableOpacity
						ref={timelineRef}
						style={[styles.timeline, loadError && { opacity: 0.5 }]}
						onPress={handleTimelinePress}
						onLayout={handleTimelineLayout}
						activeOpacity={0.8}
						disabled={loadError}
					>
						<View style={[styles.progress, { width: `${percentComplete}%` }]} />
						<View style={[styles.scrubber, { left: `${percentComplete}%` }]} />
					</TouchableOpacity>
				</View>
				<View style={styles.controls}>
					<Text style={styles.timestamp}>{loadError ? '--:--' : formattedPosition}</Text>
					<TouchableOpacity
						onPress={playPause}
						style={[styles.controlButton, loadError && { opacity: 0.5 }]}
						disabled={loadError}
					>
						<Icon name={isPlaying ? 'pause-outline' : 'play-outline'} size={32} color={textColor} />
					</TouchableOpacity>
					<Text style={styles.timestamp}>{loadError ? '--:--' : formattedDuration}</Text>
				</View>
			</View>
		</View>
	);
}

export default AudioPlayer;
