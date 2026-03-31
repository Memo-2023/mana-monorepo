import React, { useCallback, useMemo, useEffect } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import AdditionalRecording from '~/components/molecules/AdditionalRecording';
import Button from '~/components/atoms/Button';
import { useTheme } from '~/features/theme/ThemeProvider';
import { getAuthenticatedClient } from '~/features/auth/lib/supabaseClient';

const debug = __DEV__ ? console.debug : () => {};

interface MemoAudioProps {
	memo: any;
	audioUrl: string | null;
	isEditMode: boolean;
	onAddRecording: () => void;
	onTranscriptUpdate?: (newTranscript: string) => void;
	formatDateTimeForAudio: (dateString: string, durationSeconds?: number) => string;
	getSignedUrl?: (filePath: string) => Promise<string | null>;
}

export default function MemoAudio({
	memo,
	audioUrl,
	isEditMode,
	onAddRecording,
	onTranscriptUpdate,
	formatDateTimeForAudio,
	getSignedUrl,
}: MemoAudioProps) {
	const { t } = useTranslation();
	const { isDark } = useTheme();

	// Debug logging for audio URL
	useEffect(() => {
		debug('MemoAudio - audioUrl:', audioUrl);
		debug('MemoAudio - memo source:', memo?.source);
		debug('MemoAudio - memo source audio_path:', memo?.source?.audio_path);
		debug('MemoAudio - memo source audio_path:', memo?.source?.audio_path);
	}, [audioUrl, memo]);

	// Memoized recording date calculation
	const recordingDate = useMemo(() => {
		if (!memo) return '';

		// Try to get recording started date first
		const recordingStarted = memo.metadata?.recordingStartedAt || memo.created_at;
		const duration = memo.metadata?.duration || memo.metadata?.stats?.duration || 0;

		return formatDateTimeForAudio(recordingStarted, duration);
	}, [memo, formatDateTimeForAudio]);

	// Handler for deleting additional recordings
	const handleDeleteAdditionalRecording = useCallback(
		async (recordingIndex: number) => {
			if (!memo || !memo.source?.additional_recordings) return;

			try {
				const supabase = await getAuthenticatedClient();

				// Create updated additional recordings array without the deleted one
				const updatedRecordings = [...memo.source.additional_recordings];
				const deletedRecording = updatedRecordings.splice(recordingIndex, 1)[0];

				// Update memo in database
				const { error } = await supabase
					.from('memos')
					.update({
						source: {
							...memo.source,
							additional_recordings: updatedRecordings,
						},
						updated_at: new Date().toISOString(),
					})
					.eq('id', memo.id);

				if (error) {
					debug('Error deleting additional recording:', error);
					Alert.alert(
						t('common.error', 'Error'),
						t('memo.recording_delete_error', 'The recording could not be deleted.')
					);
					return;
				}

				// Delete the audio file from storage if it exists
				if (deletedRecording.path) {
					await supabase.storage.from('user-uploads').remove([deletedRecording.path]);
				}

				debug('Additional recording deleted successfully');
			} catch (error) {
				debug('Error in handleDeleteAdditionalRecording:', error);
				Alert.alert(
					t('common.error', 'Error'),
					t('memo.recording_delete_error', 'An error occurred while deleting the recording.')
				);
			}
		},
		[memo, t]
	);

	const styles = StyleSheet.create({
		container: {
			marginBottom: 20,
		},
		audioPlayerContainer: {
			marginBottom: 20,
			backgroundColor: isDark ? 'rgba(30, 30, 30, 0.5)' : 'rgba(245, 245, 245, 0.5)',
			borderRadius: 12,
			overflow: 'hidden',
		},
		additionalRecordingsContainer: {
			marginBottom: 20,
		},
		additionalRecordingItem: {
			marginBottom: 16,
			backgroundColor: isDark ? 'rgba(30, 30, 30, 0.5)' : 'rgba(245, 245, 245, 0.5)',
			borderRadius: 12,
			overflow: 'hidden',
			padding: 8,
		},
		addRecordingButton: {
			marginBottom: 16,
		},
	});

	// Only render if there are additional recordings or in edit mode
	if (
		(!memo?.source?.additional_recordings || memo.source.additional_recordings.length === 0) &&
		!isEditMode
	) {
		return null;
	}

	return (
		<View style={styles.container}>
			{/* Additional Recordings */}
			{memo.source?.additional_recordings && memo.source.additional_recordings.length > 0 && (
				<>
					{memo.source.additional_recordings.map((recording: any, index: number) => (
						<AdditionalRecording
							key={`recording-${index}`}
							recording={recording}
							index={index}
							memoId={memo.id}
							onDelete={() => handleDeleteAdditionalRecording(index)}
							isEditMode={isEditMode}
							getSignedUrl={getSignedUrl || (async () => null)}
							memo={memo}
							containerStyle={undefined}
						/>
					))}
				</>
			)}

			{/* Add Recording Button (only in edit mode) */}
			{isEditMode && (
				<Button
					variant="secondary"
					title={t('memo.add_recording', 'Add Recording')}
					iconName="mic-outline"
					onPress={onAddRecording}
					style={styles.addRecordingButton}
				/>
			)}
		</View>
	);
}
