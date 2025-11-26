import React, { useEffect, useState, memo } from 'react';
import { Text, Animated, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { getAuthenticatedClient } from '~/features/auth/lib/supabaseClient';
import { useRecordingStore } from '~/features/audioRecordingV2/store/recordingStore';
import { RecordingStatus } from '~/features/audioRecordingV2/types';
import { useDirectMemoTitle } from '~/features/memos/hooks/useDirectMemoTitle';
import { useAuthContext } from '~/features/auth/contexts/AuthContext';
import { hasTranscript } from '~/features/memos/utils/transcriptUtils';

interface DirectMemoTitleProps {
  memoId: string;
  initialTitle?: string;
  titleClasses?: string;
  numberOfLines?: number;
  ellipsizeMode?: 'head' | 'middle' | 'tail' | 'clip';
  style?: any; // Add style prop
  textColor?: string; // Add textColor prop
  reactToGlobalRecordingStatus?: boolean; // Add prop to control recording status reaction
}

/**
 * A component that directly subscribes to Supabase for title updates
 * This bypasses all other state management to ensure reliable updates
 * 
 * Supports both legacy (direct subscription) and new (centralized service) implementations
 * based on feature flags for gradual migration
 */
const DirectMemoTitle: React.FC<DirectMemoTitleProps> = memo(({ memoId, initialTitle = 'New Recording', titleClasses, numberOfLines = 2, ellipsizeMode = 'tail', style, textColor, reactToGlobalRecordingStatus = false }) => {
  const { t } = useTranslation();
  const { user } = useAuthContext();
  
  
    return (
      <DirectMemoTitleCentralized
        memoId={memoId}
        initialTitle={initialTitle}
        titleClasses={titleClasses}
        numberOfLines={numberOfLines}
        ellipsizeMode={ellipsizeMode}
        style={style}
        textColor={textColor}
        reactToGlobalRecordingStatus={reactToGlobalRecordingStatus}
      />
    );
});

/**
 * New implementation using centralized MemoRealtimeService
 */
const DirectMemoTitleCentralized: React.FC<DirectMemoTitleProps> = memo(({ memoId, initialTitle = 'New Recording', titleClasses, numberOfLines = 2, ellipsizeMode = 'tail', style, textColor, reactToGlobalRecordingStatus = false }) => {
  // Animation value for smooth transitions
  const [fadeAnim] = useState(new Animated.Value(1));
  const [displayTitle, setDisplayTitle] = useState(initialTitle);
  
  // Use the centralized hook
  const { title, isLoading } = useDirectMemoTitle({
    memoId,
    initialTitle,
    reactToGlobalRecordingStatus,
    onTitleChange: (newTitle, isInitial) => {
      // Handle title changes with animation (except for initial load)
      if (!isInitial && newTitle !== displayTitle) {
        updateTitleWithAnimation(newTitle);
      } else {
        setDisplayTitle(newTitle);
      }
    }
  });
  
  // Function to update title with animation (same as legacy)
  const updateTitleWithAnimation = (newTitle: string) => {
    if (newTitle === displayTitle) return;
    
    requestAnimationFrame(() => {
      console.log(`DirectMemoTitleCentralized: Updating from "${displayTitle}" to "${newTitle}"`);
      
      // Fade out
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 100,
        useNativeDriver: true,
      }).start(() => {
        // Update title
        setDisplayTitle(newTitle);
        
        // Fade in
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }).start();
      });
    });
  };
  
  // Sync title from hook to local state
  useEffect(() => {
    if (title !== displayTitle) {
      setDisplayTitle(title);
    }
  }, [title, displayTitle]);
  
  return (
    <DirectMemoTitleUI
      title={displayTitle}
      titleClasses={titleClasses}
      numberOfLines={numberOfLines}
      ellipsizeMode={ellipsizeMode}
      style={style}
      textColor={textColor}
      fadeAnim={fadeAnim}
      isLoading={isLoading}
    />
  );
});

/**
 * Legacy implementation (original DirectMemoTitle logic)
 */
const DirectMemoTitleLegacy: React.FC<DirectMemoTitleProps> = memo(({ memoId, initialTitle = 'New Recording', titleClasses, numberOfLines = 2, ellipsizeMode = 'tail', style, textColor, reactToGlobalRecordingStatus = false }) => {
  const { t } = useTranslation();
  
  // Local state for the title - start with initial title but prioritize fresh data
  const [title, setTitle] = useState(initialTitle);
  const [hasFetchedFreshData, setHasFetchedFreshData] = useState(false);
  
  // Animation value for smooth transitions
  const [fadeAnim] = useState(new Animated.Value(1));
  
  // Get recording status from the store only if we should react to it
  const recordingStatus = useRecordingStore(state => reactToGlobalRecordingStatus ? state.status : undefined);
  
  // Function to update title with animation
  const updateTitleWithAnimation = (newTitle: string) => {
    if (newTitle === title) return;
    
    // Use requestAnimationFrame to ensure we're not updating during render
    requestAnimationFrame(() => {
      console.log(`DirectMemoTitle: Updating from "${title}" to "${newTitle}"`);
      
      // Fade out
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 100,
        useNativeDriver: true,
      }).start(() => {
        // Update title
        setTitle(newTitle);
        
        // Fade in
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }).start();
      });
    });
  };
  
  // Handle recording status changes only if we should react to them
  useEffect(() => {
    let isMounted = true;
    
    // Only handle recording status if reactToGlobalRecordingStatus is true AND we have recording status
    if (reactToGlobalRecordingStatus && recordingStatus !== undefined) {
      console.log(`DirectMemoTitle ${memoId}: Handling recording status:`, recordingStatus);
      
      // Use setTimeout to ensure we're not updating during render
      setTimeout(() => {
        if (!isMounted) return;
        
        // Show recording/uploading status based on the global recording state
        if (recordingStatus === RecordingStatus.RECORDING || recordingStatus === RecordingStatus.PAUSED) {
          console.log(`DirectMemoTitle ${memoId}: Setting recording in progress`);
          updateTitleWithAnimation(t('memo.status.recording_in_progress'));
        } else if (recordingStatus === RecordingStatus.UPLOADING) {
          console.log(`DirectMemoTitle ${memoId}: Setting uploading recording`);
          updateTitleWithAnimation(t('memo.status.uploading_recording'));
        }
      }, 0);
    }
    
    return () => {
      isMounted = false;
    };
  }, [recordingStatus, reactToGlobalRecordingStatus, t, memoId]);
  
  // Setup direct Supabase subscription - only for latest memo to avoid conflicts
  useEffect(() => {
    // Temporarily disable individual subscriptions for non-latest memos
    // to reduce subscription conflicts and simplify state management
    if (!reactToGlobalRecordingStatus) {
      console.log(`DirectMemoTitle ${memoId}: Skipping subscription (not latest memo), using initial title`);
      // For non-latest memos, just use the initialTitle that should come from MemoList
      if (initialTitle !== title && initialTitle !== 'Loading...') {
        setTitle(initialTitle);
      }
      return;
    }
    
    let isMounted = true;
    
    // Function to determine display title based on memo state
    const getDisplayTitle = (memo: any): string => {
      console.log(`DirectMemoTitle getDisplayTitle for ${memoId}:`, {
        title: memo.title,
        transcriptionStatus: memo.metadata?.processing?.transcription?.status,
        headlineStatus: memo.metadata?.processing?.headline_and_intro?.status,
        hasTranscript: hasTranscript(memo),
        hasPath: !!memo.source?.path
      });
      
      // Priority 1: Check for recording status (uploading)
      if (memo.metadata?.recordingStatus === 'uploading') {
        console.log(`DirectMemoTitle: Recording uploading`);
        return t('memo.status.uploading_recording');
      }
      
      // Priority 2: Check processing statuses FIRST (before checking completed states)
      const transcriptionStatus = memo.metadata?.processing?.transcription?.status;
      const headlineStatus = memo.metadata?.processing?.headline_and_intro?.status;
      // Also check the new transcription_status field from Option 3 implementation
      const simpleTranscriptionStatus = memo.metadata?.transcription_status;
      
      // Check for pending or ongoing transcription (check both old and new status fields)
      if (transcriptionStatus === 'pending' || transcriptionStatus === 'processing' || 
          simpleTranscriptionStatus === 'pending' || simpleTranscriptionStatus === 'processing') {
        console.log(`DirectMemoTitle: Transcription ${transcriptionStatus || simpleTranscriptionStatus}`);
        return t('memo.status.memo_transcribing');
      }
      
      // Check for failed transcription
      if (transcriptionStatus === 'failed' || simpleTranscriptionStatus === 'failed') {
        console.log(`DirectMemoTitle: Transcription failed`);
        return t('memo.status.transcription_failed', 'Transcription failed');
      }
      
      // Check for pending or ongoing headline generation
      if (headlineStatus === 'pending' || headlineStatus === 'processing') {
        console.log(`DirectMemoTitle: Headline ${headlineStatus}`);
        return t('memo.status.headline_generating');
      }
      
      // Check for completed transcription but no headline yet
      if ((transcriptionStatus === 'completed' || simpleTranscriptionStatus === 'completed') && (!headlineStatus || headlineStatus === 'pending')) {
        console.log(`DirectMemoTitle: Transcription done, generating headline`);
        return t('memo.status.headline_generating');
      }
      
      // Check if we have transcript but no title (should generate headline)
      if (memo.source?.transcript && !memo.title) {
        console.log(`DirectMemoTitle: Has transcript but no title, generating headline`);
        return t('memo.status.headline_generating');
      }
      
      // Priority 3: Check if we have a real, meaningful title
      const hasRealTitle = memo.title && 
                          memo.title !== 'Unbenanntes Memo' && 
                          memo.title !== 'Neue Aufnahme' &&
                          memo.title.trim() !== '';
      
      if (hasRealTitle) {
        console.log(`DirectMemoTitle: Using real title: ${memo.title}`);
        return memo.title;
      }
      
      // Priority 4: Check for completed headline generation
      if (memo.metadata?.processing?.headline_and_intro?.status === 'completed') {
        // If we have a title, use it
        if (memo.title && memo.title.trim() !== '') {
          console.log(`DirectMemoTitle: Using completed title: ${memo.title}`);
          return memo.title;
        }
        // If headline is completed but no title, this is an error state - keep showing processing
        console.log(`DirectMemoTitle: Headline completed but no title available, showing headline generating status`);
        return t('memo.status.headline_generating');
      }
      
      // Check if we have audio_path but no transcript (still transcribing)
      if (memo.source?.audio_path && !memo.source?.transcript) {
        console.log(`DirectMemoTitle: Has audio_path but no transcript, transcribing`);
        return t('memo.status.memo_transcribing');
      }
      
      // Check if we have audio_path but no processing metadata (still uploading)
      if (memo.source?.audio_path && !memo.metadata?.processing) {
        console.log(`DirectMemoTitle: Has audio_path but no processing metadata, uploading`);
        return t('memo.status.uploading_recording');
      }
      
      // Default fallback - check if we have any processing metadata
      if (memo.metadata?.processing) {
        console.log(`DirectMemoTitle: Has processing metadata, showing transcribing status`);
        return t('memo.status.memo_transcribing');
      }
      
      // Only show "memo ready" if we truly have no processing information
      const result = memo.title || t('memo.status.memo_transcribing');
      console.log(`DirectMemoTitle: Default fallback: ${result}`);
      return result;
    };
    
    // Setup Supabase subscription
    const setupSubscription = async () => {
      try {
        const supabase = await getAuthenticatedClient();
        if (!supabase) {
          console.error('Failed to get authenticated Supabase client');
          return;
        }
        
        // First get the current memo data
        const { data: memo, error } = await supabase
          .from('memos')
          .select('*')
          .eq('id', memoId)
          .single();
          
        if (error) {
          console.error(`DirectMemoTitle ${memoId}: Error fetching memo:`, error);
        } else if (memo && isMounted) {
          console.log(`DirectMemoTitle ${memoId}: Initial memo data:`, {
            title: memo.title,
            transcriptionStatus: memo.metadata?.processing?.transcription?.status,
            headlineStatus: memo.metadata?.processing?.headline_and_intro?.status,
            hasTranscript: hasTranscript(memo)
          });
          // Always use fresh data from Supabase, ignore initial title
          const freshTitle = getDisplayTitle(memo);
          console.log(`DirectMemoTitle ${memoId}: Setting fresh title to:`, freshTitle);
          setTitle(freshTitle); // Set directly without animation for initial load
          setHasFetchedFreshData(true);
        }
        
        // Subscribe to updates for this specific memo
        const subscription = supabase
          .channel(`direct-memo-${memoId}`)
          .on('postgres_changes', {
            event: 'UPDATE',
            schema: 'public',
            table: 'memos',
            filter: `id=eq.${memoId}`
          }, (payload) => {
            console.log(`DirectMemoTitle ${memoId}: Received update for memo`, payload.new.id);
            console.log(`DirectMemoTitle ${memoId}: New title:`, payload.new.title);
            console.log(`DirectMemoTitle ${memoId}: Transcription status:`, payload.new.metadata?.processing?.transcription?.status);
            console.log(`DirectMemoTitle ${memoId}: Headline status:`, payload.new.metadata?.processing?.headline_and_intro?.status);
            console.log(`DirectMemoTitle ${memoId}: Has transcript:`, !!payload.new.source?.transcript);
            
            if (isMounted) {
              // Use requestAnimationFrame to ensure we're not updating during render
              requestAnimationFrame(() => {
                if (isMounted) {
                  const newTitle = getDisplayTitle(payload.new);
                  console.log(`DirectMemoTitle ${memoId} (Realtime): Processing update to "${newTitle}"`);
                  updateTitleWithAnimation(newTitle);
                }
              });
            }
          })
          .subscribe();
                  // No polling needed - realtime subscription is reliable enough
        console.log('DirectMemoTitle: Using realtime subscription only (no polling)');
        
        // Return cleanup function
        return () => {
          subscription.unsubscribe();
        };
      } catch (err) {
        console.error('Error setting up subscription:', err);
      }
    };
    
    setupSubscription();
    
    // Cleanup
    return () => {
      isMounted = false;
    };
  }, [memoId, t, reactToGlobalRecordingStatus, initialTitle, title]);
  
  const styles = StyleSheet.create({
    container: {
      // Container stays stable during animations
      position: 'relative',
    },
    title: {
      fontSize: 16,
      fontWeight: 'bold',
    },
    placeholderText: {
      // Invisible text to maintain layout
      opacity: 0,
    },
    animatedText: {
      // Positioned absolutely to overlay the placeholder
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
    },
  });
  
  // Use a fixed height container to prevent layout shifts
  // Only animate the text content, not the container
  return (
    <DirectMemoTitleUI
      title={title}
      titleClasses={titleClasses}
      numberOfLines={numberOfLines}
      ellipsizeMode={ellipsizeMode}
      style={style}
      textColor={textColor}
      fadeAnim={fadeAnim}
      isLoading={false}
    />
  );
});

/**
 * Shared UI component for both implementations
 */
interface DirectMemoTitleUIProps {
  title: string;
  titleClasses?: string;
  numberOfLines?: number;
  ellipsizeMode?: 'head' | 'middle' | 'tail' | 'clip';
  style?: any;
  textColor?: string;
  fadeAnim: Animated.Value;
  isLoading?: boolean;
}

const DirectMemoTitleUI: React.FC<DirectMemoTitleUIProps> = memo(({ 
  title, 
  titleClasses, 
  numberOfLines = 2, 
  ellipsizeMode = 'tail', 
  style, 
  textColor, 
  fadeAnim,
  isLoading = false
}) => {
  const styles = StyleSheet.create({
    container: {
      // Container stays stable during animations
      position: 'relative',
    },
    title: {
      fontSize: 16,
      fontWeight: 'bold',
    },
    placeholderText: {
      // Invisible text to maintain layout
      opacity: 0,
    },
    animatedText: {
      // Positioned absolutely to overlay the placeholder
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
    },
    loadingText: {
      opacity: 0.6,
    },
  });

  return (
    <View style={[styles.container, style]}>
      {/* Invisible text to maintain consistent layout */}
      <Text 
        className={titleClasses} 
        numberOfLines={numberOfLines} 
        ellipsizeMode={ellipsizeMode}
        style={[styles.title, styles.placeholderText, textColor && { color: textColor }]}
      >
        {title}
      </Text>
      
      {/* Animated text that fades in/out on top */}
      <Animated.Text 
        style={[
          styles.title, 
          styles.animatedText, 
          { opacity: fadeAnim }, 
          textColor && { color: textColor },
          isLoading && styles.loadingText
        ]} 
        className={titleClasses} 
        numberOfLines={numberOfLines} 
        ellipsizeMode={ellipsizeMode}
      >
        {title}
      </Animated.Text>
    </View>
  );
});

export default DirectMemoTitle;
