import React, { useState, useEffect, memo } from 'react';
import { View, Pressable, TouchableOpacity, Alert, ScrollView } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { useTheme } from '~/features/theme/ThemeProvider';
import { useAuth } from '~/features/auth/contexts/AuthContext';
import { getAuthenticatedClient } from '~/features/auth/lib/supabaseClient';
import Text from '~/components/atoms/Text';
import Icon from '~/components/atoms/Icon';
import TagList from '~/components/molecules/TagList';
import Pill from '~/components/atoms/Pill';
import TagSelectorModal from '~/features/tags/TagSelectorModal';
import colors from '~/tailwind.config.js';
import { useSpaceContext } from '~/features/spaces';
import { useToast } from '~/features/toast/contexts/ToastContext';
import { useTranslation } from 'react-i18next';

// Import our custom hooks and utilities
import { useMemoProcessing } from '~/features/memos/hooks/useMemoProcessing';
import { useMemoTagsAndSpace } from '~/features/memos/hooks/useMemoTagsAndSpace';
import {
  formatDuration,
  useFormatTime,
  useFormatDate,
} from '~/features/memos/utils/dateFormatters';
import { useRecordingStore } from '~/features/audioRecordingV2/store/recordingStore';
import { useMemoStore } from '~/features/memos/store/memoStore';
import { creditService } from '~/features/credits/creditService';
import tagEvents from '~/features/tags/tagEvents';
import { getTranscriptText, isCombinedMemo, getCombinedMemoDuration } from '~/features/memos/utils/transcriptUtils';
import { memoRealtimeService } from '~/features/memos/services/memoRealtimeService';
import { useUploadProgress } from '~/features/storage/hooks/useUploadProgress';
import { UploadStatus } from '~/features/storage/uploadStatus.types';

import { useActionSheet } from '@expo/react-native-action-sheet';

// Interface for the memo model
interface MemoModel {
  id: string;
  title?: string;
  timestamp?: Date;
  is_pinned?: boolean;
  tags?: Array<{ id: string; text: string; color: string }>;
  space?: {
    id: string;
    name: string;
    color?: string;
  };
  source?: {
    type?: string;
    content?: string;
    audio_path?: string;
    transcript?: string;
  };
  metadata?: {
    processing?: {
      transcription?: {
        status?: string;
        timestamp?: string;
        retryAttempts?: number;
      };
      headline?: {
        status?: string;
        timestamp?: string;
      };
      headline_and_intro?: {
        status?: string;
        updated_at?: string;
        retryAttempts?: number;
      };
    };
    transcriptionStatus?: string;
    blueprintId?: string | null;
    audioFileId?: string; // ID of the audio file for upload status tracking
    stats?: {
      viewCount?: number;
      wordCount?: number;
      lastViewed?: string;
      audioDuration?: number;
    };
  };
}

// Props for the MemoPreview component
interface MemoPreviewProps {
  memo: MemoModel;
  onPress?: () => void;
  onShare?: () => void;
  onCopy?: () => void;
  onPinToTop?: () => void;
  onDelete?: () => void;
  isLoading?: boolean;
  /**
   * If true, shows selection checkbox.
   */
  selectionMode?: boolean;
  /**
   * Whether this memo is currently selected.
   */
  selected?: boolean;
  /**
   * Called when the selection checkbox is pressed.
   */
  onSelect?: (selected: boolean) => void;
  /**
   * If true, this memo can react to global recording status (e.g., for the latest memo on home page)
   */
  reactToGlobalRecordingStatus?: boolean;
  /**
   * If true, this memo has photos/images attached
   */
  hasPhotos?: boolean;
  /**
   * If true, adds horizontal margins to the preview (default: true)
   */
  showMargins?: boolean;
}

/**
 * MemoPreviewSkeleton-Komponente
 *
 * Shows a simple skeleton loader for the MemoPreview component.
 * Only shows the background without placeholders for content.
 */
const MemoPreviewSkeleton: React.FC<{ isDark: boolean; themeVariant: string; showMargins?: boolean }> = ({
  isDark,
  themeVariant,
  showMargins = true,
}) => {
  // Container style with background color from the Tailwind configuration
  const getContainerStyle = () => {
    // Direct access to colors from the Tailwind configuration
    const backgroundColor = isDark
      ? (colors as any).theme?.extend?.colors?.dark?.[themeVariant]?.contentBackground || '#1E1E1E'
      : (colors as any).theme?.extend?.colors?.[themeVariant]?.contentBackground || '#FFFFFF';

    return {
      backgroundColor,
      borderRadius: 16,
      minHeight: 140,
      padding: 16,
      ...(showMargins && {
        marginLeft: 8,
        marginRight: 8,
      }),
      flexShrink: 0,
    };
  };

  return <View style={getContainerStyle()} />;
};

// Import the direct title component

/**
 * MemoTitle component
 *
 * A memoized component that only re-renders when the title changes
 */
const MemoTitle: React.FC<{ title: string; titleClasses: string; textColor: string }> = memo(
  ({ title, titleClasses, textColor }) => {
    return (
      <Text
        className={titleClasses}
        numberOfLines={2}
        ellipsizeMode="tail"
        style={{ color: textColor, lineHeight: 24 }}>
        {title}
      </Text>
    );
  }
);

/**
 * MemoPreview component
 *
 * Displays a preview of a memo with title, tags, and space information.
 */
const MemoPreviewComponent: React.FC<MemoPreviewProps> = ({
  memo,
  onPress,
  onShare,
  onCopy,
  onPinToTop,
  onDelete,
  isLoading = false,
  selectionMode = false,
  selected = false,
  onSelect,
  reactToGlobalRecordingStatus = false,
  hasPhotos = false,
  showMargins = true,
}) => {
  const { isDark, tw, themeVariant, colors: themeColors } = useTheme();
  const { user } = useAuth();
  const { spaces } = useSpaceContext();
  const { setLatestMemo, loadLatestMemo } = useMemoStore();
  const { showSuccess } = useToast();
  const { t } = useTranslation();
  const { showActionSheetWithOptions } = useActionSheet();

  // Guard against invalid memo
  if (!memo || !memo.id) {
    return null;
  }

  const shouldShowPhotoIcon = hasPhotos;

  // Use local state to track the current memo data (so we can update it from broadcasts)
  const [currentMemo, setCurrentMemo] = useState<MemoModel>(memo);

  // Update local memo when prop changes
  useEffect(() => {
    setCurrentMemo(memo);
  }, [memo]);

  // Get the current recording status from the recording store only if we should react to it
  const recordingStatus = useRecordingStore((state) =>
    reactToGlobalRecordingStatus ? state.status : undefined
  );

  // Use our custom hooks with the current memo state
  const { processingStatus, displayTitle } = useMemoProcessing({
    memo: currentMemo,
    recordingStatus: recordingStatus,
  });

  // Track upload status for this memo's audio file
  const audioFileId = currentMemo.metadata?.audioFileId;
  const uploadProgress = useUploadProgress(audioFileId);

  // State for UI
  const [isTagSelectorVisible, setIsTagSelectorVisible] = useState(false);

  // Use the memo tags and space hook (with currentMemo for real-time updates)
  const {
    selectedTagIds,
    tagItems,
    memoSpace,
    isLoading: tagsLoading,
    onSelectTag,
    onCreateTag,
  } = useMemoTagsAndSpace({
    memo: currentMemo,
    spaces,
    userId: user?.id || '',
  });

  // Get locale-aware formatters
  const formatTimeLocale = useFormatTime();
  const formatDateLocale = useFormatDate();

  // Subscribe to broadcast channel for this memo to catch service_role updates
  useEffect(() => {
    if (!memo?.id) return;

    const unsubscribe = memoRealtimeService.subscribeToBroadcastChannel(
      `memo-updates-${memo.id}`,
      async (payload) => {
        console.log('MemoPreview: Received broadcast for memo', memo.id, payload);

        try {
          // Fetch fresh memo data from Supabase
          const supabase = await getAuthenticatedClient();
          const { data: updatedMemo, error } = await supabase
            .from('memos')
            .select('*')
            .eq('id', memo.id)
            .single();

          if (error) {
            console.error('MemoPreview: Error fetching updated memo after broadcast:', error);
            return;
          }

          if (updatedMemo) {
            // Preserve audioDuration from currentMemo if it exists and updatedMemo doesn't have it
            // This is important for placeholders that have audioDuration set before the backend calculates it
            const preservedStats = {
              ...updatedMemo.metadata?.stats,
              // Preserve audioDuration from current memo if the updated memo doesn't have it
              ...((!updatedMemo.metadata?.stats?.audioDuration && currentMemo.metadata?.stats?.audioDuration) && {
                audioDuration: currentMemo.metadata.stats.audioDuration
              })
            };

            const memoWithPreservedData = {
              ...updatedMemo,
              // Map database created_at to timestamp for UI compatibility
              timestamp: new Date(updatedMemo.created_at),
              metadata: {
                ...updatedMemo.metadata,
                stats: preservedStats
              }
            };

            // Update local state with fresh memo data - this triggers useMemoProcessing to recalculate
            setCurrentMemo(memoWithPreservedData);

            // If this is the latest memo on recording page, also update it in the store
            if (reactToGlobalRecordingStatus) {
              setLatestMemo(memoWithPreservedData);
            }

            console.log('MemoPreview: Updated memo from broadcast', {
              id: updatedMemo.id,
              title: updatedMemo.title,
              headlineStatus: updatedMemo.metadata?.processing?.headline_and_intro?.status,
              oldTitle: currentMemo.title,
              preservedAudioDuration: preservedStats.audioDuration,
              timestamp: memoWithPreservedData.timestamp
            });
          }
        } catch (error) {
          console.error('MemoPreview: Error processing broadcast update:', error);
        }
      }
    );

    return () => unsubscribe();
  }, [memo?.id, reactToGlobalRecordingStatus, setLatestMemo]);

  // Get text colors from theme configuration
  const textColor = isDark
    ? (colors as any).theme?.extend?.colors?.dark?.[themeVariant]?.text || '#FFFFFF'
    : (colors as any).theme?.extend?.colors?.[themeVariant]?.text || '#000000';

  // Icon-Farbe basierend auf Theme (weiß im Dark Mode, dunkel im Light Mode)
  const iconColor = '#AEAEB2'; // Light gray icon color for both light and dark mode

  // CSS classes for the component
  const contentClasses = tw('flex-col h-full');
  const titleClasses = tw('text-[16px] font-bold mb-1 mt-2');
  const infoRowClasses = tw('flex-row items-center mb-1');
  const infoTextClasses = tw('text-[10px]');
  const separatorClasses = tw('mx-1');
  const tagContainerClasses = tw('h-8 w-full');

  // Tag selector handlers
  const handleOpenTagSelector = () => {
    setIsTagSelectorVisible(true);
  };

  const handleCloseTagSelector = () => {
    setIsTagSelectorVisible(false);
  };

  // Function to copy transcript to clipboard
  const handleCopyTranscript = async () => {
    try {
      const transcript = getTranscriptText(memo);
      if (transcript) {
        await Clipboard.setStringAsync(transcript);
        showSuccess(t('memo.transcript_copied_success', 'Transcript successfully copied!'));
      } else {
        showSuccess(t('memo.no_transcript_available', 'No transcript available'));
      }
    } catch (error) {
      console.debug('Fehler beim Kopieren des Transkripts:', error);
      showSuccess(t('memo.transcript_copy_error', 'Transcript could not be copied'));
    }
  };

  // Function to copy all memo content to clipboard
  const handleCopyAll = async () => {
    try {
      // Get authenticated client to fetch complete memo data
      const supabase = await getAuthenticatedClient();

      // Fetch complete memo data with intro
      const { data: fullMemo, error: memoError } = await supabase
        .from('memos')
        .select('*')
        .eq('id', memo.id)
        .single();

      if (memoError) {
        console.debug('Error fetching full memo for copy:', memoError);
        // Fallback to basic content if full memo fetch fails
      }

      // Fetch memories for this memo
      const { data: memories, error: memoriesError } = await supabase
        .from('memories')
        .select('*')
        .eq('memo_id', memo.id)
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: false });

      if (memoriesError) {
        console.debug('Error fetching memories for copy:', memoriesError);
        // Continue without memories
      }

      // Build the content string
      let content = `${fullMemo?.title || memo.title || t('memo.untitled', 'Untitled')}\n\n`;

      // Add intro if available
      if (fullMemo?.intro) {
        content += `${fullMemo.intro}\n\n`;
      }

      // Add memories if available
      if (memories && memories.length > 0) {
        memories.forEach((memory: any) => {
          content += `${memory.title || t('memo.memory', 'Memory')}\n${memory.content}\n\n`;
        });
      }

      // Add transcript if available
      const transcript = getTranscriptText(fullMemo || memo);
      if (transcript) {
        content += `${t('memo.transcript_title', 'Transcript')}:\n${transcript}\n\n`;
      }

      await Clipboard.setStringAsync(content);
      showSuccess(t('memo.content_copied_success', 'Complete memo content copied to clipboard'));
    } catch (error) {
      console.debug('Fehler beim Kopieren des Memo-Inhalts:', error);
      showSuccess(t('memo.content_copy_error', 'Memo content could not be copied'));
    }
  };

  // Function to pin/unpin memo
  const handlePinToggle = async () => {
    try {
      const supabase = await getAuthenticatedClient();
      const newPinnedState = !memo.is_pinned;

      const { error } = await supabase
        .from('memos')
        .update({ is_pinned: newPinnedState })
        .eq('id', memo.id);

      if (error) {
        console.debug('Error toggling pin state:', error);
        showSuccess(t('memo.pin_error', 'Memo could not be pinned/unpinned'));
        return;
      }

      // Update local state
      setCurrentMemo({
        ...currentMemo,
        is_pinned: newPinnedState,
      });

      // Update the memo store if this is the latest memo
      if (reactToGlobalRecordingStatus) {
        setLatestMemo({
          ...currentMemo,
          is_pinned: newPinnedState,
        });
      }

      showSuccess(
        newPinnedState
          ? t('memo.pinned_success', 'Memo successfully pinned!')
          : t('memo.unpinned_success', 'Memo successfully unpinned!')
      );

      // Event emittieren für andere Komponenten
      tagEvents.emitMemoPinned(memo.id, newPinnedState);

      // Call the onPinToTop callback if provided
      onPinToTop && onPinToTop();
    } catch (error) {
      console.debug('Error in handlePinToggle:', error);
      showSuccess(t('common.unexpected_error', 'An unexpected error occurred.'));
    }
  };

  // Function to retry transcription
  const handleRetryTranscription = async () => {
    try {
      await creditService.retryTranscription(memo.id);
      Alert.alert(
        t('common.success', 'Success'),
        t(
          'memo.transcription_retry_initiated',
          'Transcription retry initiated. This may take a few moments.'
        )
      );
      // Refresh memo data to get updated status and title
      await loadLatestMemo();
    } catch (error) {
      console.error('Error retrying transcription:', error);
      Alert.alert(
        t('common.error', 'Error'),
        error instanceof Error
          ? error.message
          : t('memo.transcription_retry_failed', 'Failed to retry transcription')
      );
    }
  };

  // Function to retry headline generation
  const handleRetryHeadline = async () => {
    try {
      await creditService.retryHeadline(memo.id);
      Alert.alert(
        t('common.success', 'Success'),
        t('memo.headline_retry_initiated', 'Headline generation retry initiated.')
      );
      // Refresh memo data to get updated status and title
      await loadLatestMemo();
    } catch (error) {
      console.error('Error retrying headline:', error);
      Alert.alert(
        t('common.error', 'Error'),
        error instanceof Error
          ? error.message
          : t('memo.headline_retry_failed', 'Failed to retry headline generation')
      );
    }
  };

  // Function to delete memo
  const handleDelete = async () => {
    // If parent provides onDelete callback, delegate to it (parent will handle confirmation)
    if (onDelete) {
      onDelete();
      return;
    }

    // Otherwise, handle deletion internally with confirmation
    Alert.alert(
      t('memo.delete_memo', 'Delete Memo'),
      t(
        'memo.delete_confirmation',
        'Do you really want to delete "{{title}}"? This action cannot be undone.',
        { title: memo.title || t('memo.this_memo', 'this memo') }
      ),
      [
        {
          text: t('common.cancel', 'Cancel'),
          style: 'cancel',
        },
        {
          text: t('common.delete', 'Delete'),
          style: 'destructive',
          onPress: async () => {
            // Delete confirmed
            try {
              // Get authenticated supabase client
              const supabase = await getAuthenticatedClient();

              // Get the memo to check if it has audio
              const { data: memoData } = await supabase
                .from('memos')
                .select('source')
                .eq('id', memo.id)
                .single();

              // First, delete related memories
              const { error: memoriesError } = await supabase
                .from('memories')
                .delete()
                .eq('memo_id', memo.id);

              if (memoriesError) {
                console.debug('Error deleting related memories:', memoriesError.message);
                return;
              }

              // If there's audio, delete it from storage
              if (memoData?.source?.audio_path) {
                const audioPath = memoData.source.audio_path;
                if (audioPath) {
                  const { error: storageError } = await supabase.storage
                    .from('user-uploads')
                    .remove([audioPath]);

                  if (storageError) {
                    console.debug('Error deleting audio file:', storageError.message);
                    // Continue with memo deletion even if audio deletion fails
                  }
                }
              }

              // Finally, delete the memo itself
              const { error: memoError } = await supabase.from('memos').delete().eq('id', memo.id);

              if (memoError) {
                console.debug('Error deleting memo:', memoError.message);
                showSuccess(t('memo.delete_error', 'Memo could not be deleted'));
                return;
              }

              showSuccess(t('memo.deleted_success', 'Memo successfully deleted!'));

              // Wenn diese Komponente auf der Recording-Seite verwendet wird, lade das nächste Memo
              if (reactToGlobalRecordingStatus) {
                console.debug('🗑️ MemoPreview: Deleted memo on recording page, loading next memo');
                // Clear the current memo and load the next one
                setLatestMemo(null);
                setTimeout(() => {
                  loadLatestMemo();
                }, 100);
              }
            } catch (error) {
              console.debug('Error in handleDelete:', error);
              showSuccess(t('memo.delete_unexpected_error', 'An error occurred while deleting'));
            }
          },
        },
      ]
    );
  };

  // Haptic feedback for context menu
  const triggerContextMenuHaptic = async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (error) {
      console.debug('Haptic feedback error:', error);
    }
  };

  // Show action sheet on long press
  const handleLongPress = () => {
    triggerContextMenuHaptic();

    const options = [
      t('memo_menu.share', 'Share'),
      t('memo_menu.copy', 'Copy'),
      t('memo_menu.copy_transcript', 'Copy Transcript'),
      memo.is_pinned ? t('memo_menu.unpin', 'Unpin') : t('memo_menu.pin', 'Pin'),
      t('memo_menu.delete', 'Delete'),
      t('common.cancel', 'Cancel'),
    ];
    const destructiveButtonIndex = 4; // Delete
    const cancelButtonIndex = 5;

    showActionSheetWithOptions(
      {
        options,
        cancelButtonIndex,
        destructiveButtonIndex,
        userInterfaceStyle: isDark ? 'dark' : 'light',
      },
      (buttonIndex) => {
        if (buttonIndex === undefined || buttonIndex === cancelButtonIndex) {
          return;
        }

        switch (buttonIndex) {
          case 0: // Share
            if (onShare) {
              onShare();
            }
            break;
          case 1: // Copy All
            if (onCopy) {
              onCopy();
            } else {
              handleCopyAll();
            }
            break;
          case 2: // Copy Transcript
            handleCopyTranscript();
            break;
          case 3: // Pin/Unpin
            if (onPinToTop) {
              onPinToTop();
            } else {
              handlePinToggle();
            }
            break;
          case 4: // Delete
            handleDelete();
            break;
        }
      }
    );
  };



  // Container style
  const getContainerStyle = () => {
    // Direct access to colors from the Tailwind configuration
    const backgroundColor = isDark
      ? (colors as any).theme?.extend?.colors?.dark?.[themeVariant]?.contentBackground
      : (colors as any).theme?.extend?.colors?.[themeVariant]?.contentBackground;

    // Get border color from theme
    const borderColor = isDark
      ? (colors as any).theme?.extend?.colors?.dark?.[themeVariant]?.border || '#424242'
      : (colors as any).theme?.extend?.colors?.[themeVariant]?.border || '#e6e6e6';

    // If viewCount is 0, use primary color for border
    const hasZeroViews = currentMemo.metadata?.stats?.viewCount === 0;
    const primaryColor = isDark
      ? (colors as any).theme?.extend?.colors?.dark?.[themeVariant]?.primary
      : (colors as any).theme?.extend?.colors?.[themeVariant]?.primary;

    return {
      backgroundColor,
      borderRadius: 16,
      borderWidth: hasZeroViews ? 2 : 1,
      borderColor: hasZeroViews ? primaryColor || '#4FC3F7' : borderColor,
      minHeight: 140,
      width: showMargins ? undefined : '100%', // Full width when no margins
      flexShrink: 0,
      ...(showMargins && {
        marginLeft: 8,
        marginRight: 8,
      }),
    };
  };

  // Render tag selector
  const renderTagSelector = () => {
    return (
      <TagSelectorModal
        isVisible={isTagSelectorVisible}
        onClose={handleCloseTagSelector}
        onTagSelect={onSelectTag}
        selectedTagIds={selectedTagIds}
        tagItems={tagItems}
        isLoading={tagsLoading}
        title={t('tags.add_tags', 'Add Tags')}
        onCreateTag={onCreateTag}
      />
    );
  };

  // Check if transcription or headline failed and can be retried
  const canRetryTranscription =
    (currentMemo.metadata?.processing?.transcription?.status === 'error' ||
      currentMemo.metadata?.transcription_status === 'failed') &&
    (currentMemo.metadata?.processing?.transcription?.retryAttempts || 0) < 3;

  const canRetryHeadline =
    currentMemo.metadata?.processing?.headline_and_intro?.status === 'error' &&
    (currentMemo.metadata?.processing?.headline_and_intro?.retryAttempts || 0) < 3;

  // Content to render inside the container
  const renderContent = () => {
    // Filter selected tags
    const selectedTags = tagItems.filter((tagItem) => selectedTagIds.includes(tagItem.id));

    return (
      <View className={contentClasses}>
        {/* Content area with padding */}
        <View style={{ flex: 1, paddingTop: 16, paddingHorizontal: 16 }}>
          <View className="flex-row items-center justify-between" style={{ opacity: 0.6 }}>
            {currentMemo?.timestamp && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={{ flex: 1 }}
                contentContainerStyle={{ alignItems: 'center' }}>
                <View className="flex-row items-center">
                  <Text
                    variant="tiny"
                    className={infoTextClasses}
                    style={{ lineHeight: 14, color: `${textColor}B3` }}>
                    {formatDateLocale(currentMemo.timestamp, {
                      weekday: 'short',
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </Text>
                  <Text
                    variant="tiny"
                    className={separatorClasses}
                    style={{ lineHeight: 14, color: `${textColor}80` }}>
                    •
                  </Text>
                  <Text
                    variant="tiny"
                    className={infoTextClasses}
                    style={{ lineHeight: 14, color: `${textColor}B3` }}>
                    {formatTimeLocale(currentMemo.timestamp)}
                  </Text>
                  {(() => {
                    // Get duration - either from stats or calculate for combined memos
                    const audioDuration = isCombinedMemo(currentMemo)
                      ? getCombinedMemoDuration(currentMemo)
                      : currentMemo.metadata?.stats?.audioDuration;
                    
                    if (audioDuration !== undefined && audioDuration > 0) {
                      return (
                        <>
                          <Text
                            variant="tiny"
                            className={separatorClasses}
                            style={{ lineHeight: 14, color: `${textColor}80` }}>
                            •
                          </Text>
                          <Text
                            variant="tiny"
                            className={infoTextClasses}
                            style={{ lineHeight: 14, color: `${textColor}B3` }}>
                            {formatDuration(audioDuration)}
                          </Text>
                        </>
                      );
                    }
                    return null;
                  })()}
                  {currentMemo.is_pinned && (
                    <>
                      <Text
                        variant="tiny"
                        className={separatorClasses}
                        style={{ lineHeight: 14, color: `${textColor}80` }}>
                        •
                      </Text>
                      <Icon name="pin" size={12} color="#FF9500" style={{ marginLeft: 2 }} />
                    </>
                  )}
                  {shouldShowPhotoIcon && (
                    <>
                      <Text
                        variant="tiny"
                        className={separatorClasses}
                        style={{ lineHeight: 14, color: `${textColor}80` }}>
                        •
                      </Text>
                      <Icon
                        name="image-outline"
                        size={12}
                        color={isDark ? '#FFFFFF' : '#000000'}
                        style={{ marginLeft: 2, opacity: 0.8 }}
                      />
                    </>
                  )}
                  {currentMemo.metadata?.location && (
                    <>
                      <Text
                        variant="tiny"
                        className={separatorClasses}
                        style={{ lineHeight: 14, color: `${textColor}80` }}>
                        •
                      </Text>
                      <Icon
                        name="location-outline"
                        size={12}
                        color={isDark ? '#FFFFFF' : '#000000'}
                        style={{ marginLeft: 2, opacity: 0.8 }}
                      />
                    </>
                  )}
                  {currentMemo.metadata?.combined_memo_count && currentMemo.metadata.combined_memo_count > 1 && (
                    <>
                      <Text
                        variant="tiny"
                        className={separatorClasses}
                        style={{ lineHeight: 14, color: `${textColor}80` }}>
                        •
                      </Text>
                      <Icon
                        name="git-merge"
                        size={12}
                        color={isDark ? '#FFFFFF' : '#000000'}
                        style={{ marginLeft: 2, opacity: 0.8 }}
                      />
                      <Text
                        variant="tiny"
                        style={{ marginLeft: 2, color: `${textColor}B3`, fontSize: 10 }}>
                        {currentMemo.metadata.combined_memo_count}
                      </Text>
                    </>
                  )}
                </View>
              </ScrollView>
            )}

            {/* Space Pill */}
            {memoSpace && (
              <View style={{ maxWidth: '45%', alignSelf: 'center', marginTop: -4, flexShrink: 0 }}>
                <Pill
                  label={memoSpace.name}
                  color={memoSpace.color || '#4FC3F7'}
                  size="small"
                  maxLength={20}
                  variant="underlined"
                />
              </View>
            )}
          </View>

          {/* Upload Status Badge */}
          {uploadProgress.status !== UploadStatus.NOT_UPLOADED &&
           uploadProgress.status !== UploadStatus.SUCCESS && (
            <View style={{ marginTop: 8, marginBottom: 4 }}>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingHorizontal: 8,
                  paddingVertical: 4,
                  borderRadius: 12,
                  backgroundColor: uploadProgress.isUploading
                    ? (isDark ? '#1E3A8A' : '#DBEAFE')
                    : uploadProgress.isPending
                    ? (isDark ? '#78350F' : '#FEF3C7')
                    : (isDark ? '#7F1D1D' : '#FEE2E2'),
                  gap: 4,
                  alignSelf: 'flex-start',
                }}
              >
                {uploadProgress.isUploading ? (
                  <View style={{ width: 14, height: 14 }}>
                    <Icon
                      name="cloud-upload-outline"
                      size={14}
                      color={isDark ? '#93C5FD' : '#1E40AF'}
                    />
                  </View>
                ) : uploadProgress.isPending ? (
                  <Icon
                    name="cloud-upload-outline"
                    size={14}
                    color={isDark ? '#FCD34D' : '#92400E'}
                  />
                ) : (
                  <Icon
                    name="alert-circle-outline"
                    size={14}
                    color={isDark ? '#FCA5A5' : '#991B1B'}
                  />
                )}
                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: '500',
                    color: uploadProgress.isUploading
                      ? (isDark ? '#93C5FD' : '#1E40AF')
                      : uploadProgress.isPending
                      ? (isDark ? '#FCD34D' : '#92400E')
                      : (isDark ? '#FCA5A5' : '#991B1B'),
                  }}
                >
                  {uploadProgress.isUploading
                    ? 'Uploading...'
                    : uploadProgress.isPending
                    ? uploadProgress.attemptCount > 0
                      ? `Retry ${uploadProgress.attemptCount}...`
                      : 'Queued...'
                    : 'Upload Failed'}
                </Text>
              </View>
            </View>
          )}

          <MemoTitle title={displayTitle} titleClasses={titleClasses} textColor={textColor} />

          {/* Retry Buttons for Failed Operations */}
          {!selectionMode && (canRetryTranscription || canRetryHeadline) && (
            <View className="mt-2 flex-row items-center" style={{ gap: 8 }}>
              {canRetryTranscription && (
                <TouchableOpacity
                  onPress={handleRetryTranscription}
                  className="flex-row items-center rounded-md px-2 py-1"
                  style={{
                    backgroundColor: isDark ? '#333' : '#f0f0f0',
                    borderWidth: 1,
                    borderColor: '#FF6B6B',
                  }}>
                  <Icon name="refresh" size={12} color="#FF6B6B" />
                  <Text className="ml-1 text-xs" style={{ color: '#FF6B6B' }}>
                    {t('memo.retry_transcription', 'Retry Transcription')}
                  </Text>
                </TouchableOpacity>
              )}

              {canRetryHeadline && (
                <TouchableOpacity
                  onPress={handleRetryHeadline}
                  className="flex-row items-center rounded-md px-2 py-1"
                  style={{
                    backgroundColor: isDark ? '#333' : '#f0f0f0',
                    borderWidth: 1,
                    borderColor: '#FFA500',
                  }}>
                  <Icon name="refresh" size={12} color="#FFA500" />
                  <Text className="ml-1 text-xs" style={{ color: '#FFA500' }}>
                    {t('memo.retry_headline', 'Retry Headline')}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>

        {/* Tags Container - positioned with consistent spacing from title */}
        <View style={{ marginTop: 4, minHeight: 32, paddingBottom: 10, opacity: 0.6 }}>
          <TagList
            tags={selectedTags}
            horizontal
            showAddButton={!selectionMode}
            onTagPress={selectionMode ? undefined : onSelectTag}
            onAddPress={selectionMode ? undefined : handleOpenTagSelector}
          />
        </View>

        {!selectionMode && renderTagSelector()}
      </View>
    );
  };

  // If isLoading is true, show the skeleton loader
  if (isLoading) {
    return <MemoPreviewSkeleton isDark={isDark} themeVariant={themeVariant} showMargins={showMargins} />;
  }

  // Platform-specific implementations
  // In selection mode, use simple Pressable without context menu
  if (selectionMode) {
    return (
      <Pressable
        style={getContainerStyle()}
        onPress={() => onSelect && onSelect(!selected)}
      >
        <View style={{ flex: 1 }}>{renderContent()}</View>
      </Pressable>
    );
  }

  // Simple Pressable with ActionSheet - no ContextMenu component needed
  return (
    <Pressable
      style={getContainerStyle()}
      onPress={onPress}
      onLongPress={handleLongPress}
      delayLongPress={500}
    >
      <View style={{ flex: 1 }}>{renderContent()}</View>
    </Pressable>
  );
};

// Memorize the component to prevent unnecessary re-renders
// Only re-render when essential properties change, not on processing status changes
const MemoPreview = memo(MemoPreviewComponent, (prevProps, nextProps) => {
  // Always re-render if isLoading changes
  if (prevProps.isLoading !== nextProps.isLoading) return false;

  // Always re-render if reactToGlobalRecordingStatus changes
  if (prevProps.reactToGlobalRecordingStatus !== nextProps.reactToGlobalRecordingStatus)
    return false;

  // Always re-render if the memo ID changes
  if (prevProps.memo?.id !== nextProps.memo?.id) return false;

  // Always re-render if the memo title changes
  if (prevProps.memo?.title !== nextProps.memo?.title) return false;

  // Always re-render if tags or space changes
  if (JSON.stringify(prevProps.memo?.tags) !== JSON.stringify(nextProps.memo?.tags)) return false;
  if (JSON.stringify(prevProps.memo?.space) !== JSON.stringify(nextProps.memo?.space)) return false;

  // Always re-render if pin state changes
  if (prevProps.memo?.is_pinned !== nextProps.memo?.is_pinned) return false;

  // Always re-render if showMargins changes
  if (prevProps.showMargins !== nextProps.showMargins) return false;

  // Always re-render if selection state changes
  if (prevProps.selected !== nextProps.selected) return false;
  if (prevProps.selectionMode !== nextProps.selectionMode) return false;

  // Always re-render if photo state changes
  if (prevProps.hasPhotos !== nextProps.hasPhotos) return false;

  // Always re-render if timestamp changes
  if (prevProps.memo?.timestamp?.getTime() !== nextProps.memo?.timestamp?.getTime())
    return false;

  // Always re-render if stats change (especially viewCount for yellow border)
  if (prevProps.memo?.metadata?.stats?.viewCount !== nextProps.memo?.metadata?.stats?.viewCount)
    return false;
  if (prevProps.memo?.metadata?.stats?.shareCount !== nextProps.memo?.metadata?.stats?.shareCount)
    return false;
  if (prevProps.memo?.metadata?.stats?.editCount !== nextProps.memo?.metadata?.stats?.editCount)
    return false;
  if (prevProps.memo?.metadata?.stats?.audioDuration !== nextProps.memo?.metadata?.stats?.audioDuration)
    return false;

  // Don't re-render just because processing status changes - MemoTitle will handle this
  // The displayTitle is calculated in useMemoProcessing and passed to MemoTitle
  // MemoTitle is memoized separately and will only re-render when the title changes

  // Default to using React's memoization logic for other props
  return true;
});

export default MemoPreview;
