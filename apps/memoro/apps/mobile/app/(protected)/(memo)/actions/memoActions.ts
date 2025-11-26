import { Alert } from 'react-native';
import { getAuthenticatedClient } from '~/features/auth/lib/supabaseClient';
import { tokenManager } from '~/features/auth/services/tokenManager';
import { creditService } from '~/features/credits/creditService';
import { multiPlatformAnalytics } from '~/features/analytics/services/multiPlatformAnalytics';

const debug = __DEV__ ? console.debug : () => {};

interface ReplaceWordParams {
  memo: any;
  memories: any[];
  wordToReplace: string;
  replacementWord: string;
  updateLoadingState: (key: string, value: boolean) => void;
  setMemo: (memo: any) => void;
  setMemories: (memories: any[]) => void;
  showSuccess: (message: string) => void;
  t: (key: string, defaultValue: string) => string;
}

/**
 * Replaces a word in all text areas of the memo (title, introduction, transcript, memories)
 * and saves the changes to the database.
 */
export async function handleReplaceWordInMemo({
  memo,
  memories,
  wordToReplace,
  replacementWord,
  updateLoadingState,
  setMemo,
  setMemories,
  showSuccess,
  t,
}: ReplaceWordParams): Promise<void> {
  if (!memo) {
    debug('No memo available for editing');
    return;
  }

  try {
    updateLoadingState('critical', true);

    // Create a RegExp object for global search (case-insensitive)
    // We use word boundaries (\b) to ensure we only replace whole words
    const regex = new RegExp(`\\b${wordToReplace}\\b`, 'gi');

    // Update title and introduction
    const updatedTitle = memo.title ? memo.title.replace(regex, replacementWord) : memo.title;
    const updatedIntro = memo.intro ? memo.intro.replace(regex, replacementWord) : memo.intro;

    // Update transcript in source object
    const updatedSource = { ...memo.source };

    // Determine which field is used for the transcript
    if (updatedSource?.content) {
      updatedSource.content = updatedSource.content.replace(regex, replacementWord);
    }
    if (updatedSource?.transcript) {
      updatedSource.transcript = updatedSource.transcript.replace(regex, replacementWord);
    }
    if (updatedSource?.transcription) {
      updatedSource.transcription = updatedSource.transcription.replace(regex, replacementWord);
    }

    // Update speakers if present (structured transcript)
    if (updatedSource?.speakers) {
      Object.keys(updatedSource.speakers).forEach((speakerKey) => {
        const speakerSegments = updatedSource.speakers![speakerKey];
        if (Array.isArray(speakerSegments)) {
          updatedSource.speakers![speakerKey] = speakerSegments.map((segment) => ({
            ...segment,
            text: segment.text.replace(regex, replacementWord),
          }));
        } else {
          debug(`Speaker ${speakerKey} is not an array:`, speakerSegments);
        }
      });
    }

    // Update utterances if present
    if (updatedSource?.utterances && Array.isArray(updatedSource.utterances)) {
      updatedSource.utterances = updatedSource.utterances.map((utterance) => ({
        ...utterance,
        text: utterance.text.replace(regex, replacementWord),
      }));
    }

    // Get authenticated Supabase client
    const supabase = await getAuthenticatedClient();

    // Update memo in database
    const { data, error } = await supabase
      .from('memos')
      .update({
        title: updatedTitle,
        intro: updatedIntro,
        source: updatedSource,
        updated_at: new Date().toISOString(),
      })
      .eq('id', memo.id)
      .select()
      .single();

    if (error) {
      debug('Error updating memo:', error.message);
      Alert.alert(
        t('common.error', 'Error'),
        t('memo.update_error', 'The memo could not be updated.')
      );
      return;
    }

    debug('Memo successfully updated');

    // Update local memo object
    setMemo({
      ...memo,
      title: updatedTitle,
      intro: updatedIntro,
      source: updatedSource,
    });

    // Update memories if present
    if (memories.length > 0) {
      const memoryUpdatePromises = memories.map(async (memory) => {
        const updatedContent = memory.content.replace(regex, replacementWord);
        const updatedTitle = memory.title.replace(regex, replacementWord);

        // Only update if something changed
        if (updatedContent !== memory.content || updatedTitle !== memory.title) {
          const { data, error } = await supabase
            .from('memories')
            .update({
              title: updatedTitle,
              content: updatedContent,
              updated_at: new Date().toISOString(),
            })
            .eq('id', memory.id);

          if (error) {
            debug(`Error updating memory ${memory.id}:`, error.message);
          }

          return { ...memory, title: updatedTitle, content: updatedContent };
        }

        return memory;
      });

      // Wait for all memory updates
      const updatedMemories = await Promise.all(memoryUpdatePromises);
      setMemories(updatedMemories);
      debug(`${updatedMemories.length} memories updated`);
    }

    // Show success toast
    showSuccess(
      t(
        'memo.replace_success',
        `All occurrences of "${wordToReplace}" have been replaced with "${replacementWord}".`
      )
    );
  } catch (error) {
    console.error('Error replacing word:', error);
    Alert.alert(
      t('common.error', 'Error'),
      t('memo.replace_error', 'An error occurred while replacing the word.')
    );
  } finally {
    updateLoadingState('critical', false);
  }
}

interface DeleteMemoParams {
  memoId: string;
  memo: any;
  updateLoadingState: (key: string, value: boolean) => void;
  showSuccess: (message: string) => void;
  t: (key: string, defaultValue: string) => string;
  onSuccess: () => void;
}

/**
 * Deletes a memo and all related data (memories, audio files)
 */
export async function handleDeleteMemo({
  memoId,
  memo,
  updateLoadingState,
  showSuccess,
  t,
  onSuccess,
}: DeleteMemoParams): Promise<void> {
  debug('Starting memo deletion:', memoId);

  try {
    updateLoadingState('critical', true);

    const supabase = await getAuthenticatedClient();
    debug('Supabase client initialized');

    // First, delete related memories
    debug('Deleting related memories for memo:', memoId);
    const { data: memoriesData, error: memoriesError } = await supabase
      .from('memories')
      .delete()
      .eq('memo_id', memoId)
      .select();

    if (memoriesError) {
      debug('Error deleting related memories:', memoriesError.message);
      Alert.alert(
        t('common.error', 'Error'),
        t('memo.delete_memories_error', 'Could not delete related memories.')
      );
      return;
    }

    debug('Related memories deleted successfully:', memoriesData?.length || 0);

    // Delete audio files if present
    const audioFiles: string[] = [];

    // Main audio file
    if (memo?.source?.audio_path) {
      audioFiles.push(memo.source.audio_path);
    }

    // Additional recordings
    if (memo?.source?.additional_recordings) {
      memo.source.additional_recordings.forEach((recording: any) => {
        if (recording.path) {
          audioFiles.push(recording.path);
        }
      });
    }

    if (audioFiles.length > 0) {
      debug('Deleting audio files:', audioFiles);
      const { error: storageError } = await supabase.storage
        .from('user-uploads')
        .remove(audioFiles);

      if (storageError) {
        debug('Error deleting audio files:', storageError.message);
        // Continue with memo deletion even if audio deletion fails
      }
    }

    // Finally, delete the memo itself
    debug('Deleting memo with ID:', memoId);
    const { data: deletedMemo, error: memoError } = await supabase
      .from('memos')
      .delete()
      .eq('id', memoId)
      .select();

    if (memoError) {
      debug('Error deleting memo:', memoError.message);
      Alert.alert(
        t('common.error', 'Error'),
        t('memo.delete_error', 'The memo could not be deleted.')
      );
      return;
    }

    debug('Memo deleted successfully:', deletedMemo);

    // Show success toast before navigation
    showSuccess(t('memo.deleted_success', 'Memo successfully deleted!'));

    // Call success callback (usually navigation)
    onSuccess();
  } catch (error) {
    debug('Error in handleDeleteMemo:', error);
    Alert.alert(
      t('common.error', 'Error'),
      t('memo.delete_error', 'An error occurred while deleting the memo.')
    );
  } finally {
    updateLoadingState('critical', false);
  }
}

interface TranslateMemoParams {
  memoId: string;
  targetLanguage: string;
  t: (key: string, defaultValue: string) => string;
  onSuccess: (newMemoId: string) => void;
}

/**
 * Translates a memo to a target language
 */
interface ReprocessMemoParams {
  memoId: string;
  memo: any;
  language?: string;
  blueprint?: any;
  recordingDate?: Date;
  updateLoadingState: (key: string, value: boolean) => void;
  showSuccess: (message: string) => void;
  t: (key: string, defaultValue: string) => string;
  refreshCredits: () => Promise<void>;
  loadMemoData: (id: string) => Promise<void>;
}

/**
 * Reprocesses a memo with new settings
 */
export async function handleReprocessMemo({
  memoId,
  memo,
  language,
  blueprint,
  recordingDate,
  updateLoadingState,
  showSuccess,
  t,
  refreshCredits,
  loadMemoData,
}: ReprocessMemoParams): Promise<void> {
  if (!memo) {
    return;
  }

  try {
    updateLoadingState('critical', true);
    debug('Starting memo reprocessing:', { memoId, language, blueprint, recordingDate });
    
    // Track reprocess event
    multiPlatformAnalytics.track('memo_reprocessed', {
      memo_id: memoId,
      language: language || 'auto',
      has_blueprint: !!blueprint,
      blueprint_id: blueprint?.id
    });

    // Get the authenticated token
    const token = await tokenManager.getValidToken();
    if (!token) {
      throw new Error('No valid token available');
    }

    // Prepare the request payload
    const payload = {
      memoId,
      language: language || 'auto',
      blueprint: blueprint || null,
      recordingDate:
        recordingDate?.toISOString() || memo.metadata?.recordingStartedAt || memo.created_at,
    };

    // Get the memoro service URL with fallback
    const memoroServiceUrl = (
      process.env.EXPO_PUBLIC_MEMORO_MIDDLEWARE_URL || 'http://localhost:3001'
    ).replace(/\/$/, '');

    // Call the Memoro service reprocess endpoint
    const response = await fetch(`${process.env.EXPO_PUBLIC_MEMORO_MIDDLEWARE_URL}/memoro/reprocess-memo`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Reprocess failed:', errorData);

      // Don't handle 402 errors here - let the global interceptor handle them

      throw new Error(`Reprocess failed: ${response.status}`);
    }

    const result = await response.json();
    debug('Reprocess successful:', result);

    // Refresh credits after successful reprocess
    await refreshCredits();

    // Show success message
    showSuccess(
      t(
        'reprocess.success',
        'Memo is being reprocessed. You will be notified when processing is complete.'
      )
    );

    // Reload memo data to reflect any immediate changes
    await loadMemoData(memoId);
  } catch (error) {
    console.error('Error reprocessing memo:', error);
    Alert.alert(
      t('common.error', 'Error'),
      t('reprocess.error', 'An error occurred while reprocessing the memo.')
    );
  } finally {
    updateLoadingState('critical', false);
  }
}

interface QuestionMemoParams {
  memoId: string;
  question: string;
  updateLoadingState: (key: string, value: boolean) => void;
  setMemories: (memories: any[]) => void;
  showSuccess: (message: string) => void;
  t: (key: string, defaultValue: string) => string;
  refreshCredits: () => Promise<void>;
  scrollToMemories?: () => void;
}

/**
 * Submits a question about the memo
 */
export async function handleQuestionMemo({
  memoId,
  question,
  updateLoadingState,
  setMemories,
  showSuccess,
  t,
  refreshCredits,
  scrollToMemories,
}: QuestionMemoParams): Promise<void> {
  if (!memoId || !question.trim()) {
    debug('No valid question or memo ID');
    return;
  }

  try {
    updateLoadingState('question', true);

    debug('Sending question to memoro service:', question);
    
    // Track question asked
    multiPlatformAnalytics.track('question_asked', {
      memo_id: memoId,
      question_length: question.length,
      mana_cost: 5
    });

    // Get the authenticated token
    const token = await tokenManager.getValidToken();
    if (!token) {
      throw new Error('No valid token available');
    }

    // Get the memoro service URL with fallback
    const memoroServiceUrl = (
      process.env.EXPO_PUBLIC_MEMORO_MIDDLEWARE_URL || 'http://localhost:3001'
    ).replace(/\/$/, '');

    // Call the memoro service directly (handles credit checks and consumption)
    const response = await fetch(`${memoroServiceUrl}/memoro/question-memo`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        memo_id: memoId,
        question: question.trim(),
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      // Don't check for 402 errors - let the global interceptor handle them
      throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    debug('Response from memoro service:', data);

    if (data?.success && data?.memory_id) {
      // Notify credit system about consumption for UI updates
      if (data.creditsConsumed) {
        creditService.triggerCreditUpdate(data.creditsConsumed);
      }

      // Refresh credits after 3 seconds
      setTimeout(() => {
        refreshCredits();
      }, 3000);

      // Reload memories to show the new answer
      updateLoadingState('memories', true);

      const supabase = await getAuthenticatedClient();
      const { data: memoriesData, error: memoriesError } = await supabase
        .from('memories')
        .select('id, title, content, metadata')
        .eq('memo_id', memoId)
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: false });

      if (memoriesError) {
        debug('Error reloading memories:', memoriesError.message);
      } else if (memoriesData) {
        setMemories(memoriesData);
        debug('Memories successfully updated');

        // Show success toast
        showSuccess(t('memo.answer_created_success', 'Answer successfully created!'));

        // Scroll to memories section if callback provided
        if (scrollToMemories) {
          setTimeout(scrollToMemories, 300);
        }
      }
      updateLoadingState('memories', false);
    } else {
      throw new Error(data?.error || 'Unknown error processing question');
    }
  } catch (error) {
    debug('Error processing question:', error);

    // Don't check for insufficient credits - let the global interceptor handle 402 errors
    Alert.alert(
      t('common.error', 'Error'),
      t('memo.question_error', 'An error occurred while processing your question.')
    );
  } finally {
    updateLoadingState('question', false);
  }
}

export async function handleTranslateMemo({
  memoId,
  targetLanguage,
  t,
  onSuccess,
}: TranslateMemoParams): Promise<boolean> {
  try {
    debug('Starting translation to language:', targetLanguage);
    
    // Track translate memo
    multiPlatformAnalytics.track('memo_translated', {
      memo_id: memoId,
      target_language: targetLanguage
    });

    const supabase = await getAuthenticatedClient();

    // Call the translate function
    const { data, error } = await supabase.functions.invoke('translate', {
      body: {
        memo_id: memoId,
        target_language: targetLanguage,
      },
    });

    if (error) {
      debug('Translation error:', error);
      Alert.alert(
        t('common.error', 'Error'),
        t('memo.translate_error', 'Translation failed. Please try again.')
      );
      return false;
    }

    debug('Translation result:', data);

    // Navigate to the new translated memo
    if (data.new_memo_id) {
      onSuccess(data.new_memo_id);
    }

    return true;
  } catch (error) {
    debug('Error during translation:', error);
    Alert.alert(
      t('common.error', 'Error'),
      t('common.unexpected_error', 'An unexpected error occurred.')
    );
    return false;
  }
}
