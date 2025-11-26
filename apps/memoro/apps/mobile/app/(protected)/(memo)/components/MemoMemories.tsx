import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Alert, Share, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import * as Clipboard from 'expo-clipboard';
import Memory from '~/components/organisms/Memory';
import Button from '~/components/atoms/Button';
import { useTheme } from '~/features/theme/ThemeProvider';
import { getAuthenticatedClient } from '~/features/auth/lib/supabaseClient';
import { useToast } from '~/features/toast';
import { DEBOUNCE_DELAYS } from '~/utils/sharedConstants';

const debug = __DEV__ ? console.debug : () => {};

interface MemoMemoriesProps {
  memoId: string;
  memories: any[];
  setMemories: (memories: any[]) => void;
  isEditMode: boolean;
  searchQuery?: string;
  isSearchMode?: boolean;
  currentSearchIndex?: number;
  searchResults?: Array<{id: string; type: string; text: string; index: number; matchIndex: number}>;
  onEditStart: () => void;
  onCreateMemory: () => void;
  updateLoadingState: (key: string, value: boolean) => void;
  loadingStates: {
    memories: boolean;
  };
}

export default function MemoMemories({
  memoId,
  memories,
  setMemories,
  isEditMode,
  searchQuery,
  isSearchMode,
  currentSearchIndex,
  searchResults,
  onEditStart,
  onCreateMemory,
  updateLoadingState,
  loadingStates,
}: MemoMemoriesProps) {
  const { t } = useTranslation();
  const { isDark } = useTheme();
  const { showSuccess } = useToast();
  
  // Local state for editing
  const [localMemories, setLocalMemories] = useState<any[]>([]);
  
  // Refs for memory elements and update timeouts
  const memoryRefs = useRef<(View | null)[]>([]);
  const memoryUpdateTimeouts = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  // Initialize local memories when entering edit mode
  useEffect(() => {
    if (isEditMode && localMemories.length === 0) {
      setLocalMemories(memories);
    }
  }, [isEditMode, memories]);

  // Initialize memory refs array
  const initializeMemoryRefs = useCallback(() => {
    if (memories && memoryRefs.current.length !== memories.length) {
      memoryRefs.current = Array(memories.length).fill(null);
    }
  }, [memories?.length]);

  useEffect(() => {
    initializeMemoryRefs();
  }, [initializeMemoryRefs]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      memoryUpdateTimeouts.current.forEach((timeout) => clearTimeout(timeout));
      memoryUpdateTimeouts.current.clear();
    };
  }, []);

  // Debounced memory update function
  const debouncedMemoryUpdate = useCallback(
    async (memoryId: string, field: 'title' | 'content', newValue: string) => {
      // Add size limit check to prevent unbounded growth
      if (memoryUpdateTimeouts.current.size > 50) {
        const entries = Array.from(memoryUpdateTimeouts.current.entries());
        entries.slice(0, 10).forEach(([key, timeout]) => {
          clearTimeout(timeout);
          memoryUpdateTimeouts.current.delete(key);
        });
      }
      
      // Clear existing timeout for this memory
      const existingTimeout = memoryUpdateTimeouts.current.get(memoryId);
      if (existingTimeout) {
        clearTimeout(existingTimeout);
      }

      const timeout = setTimeout(async () => {
        try {
          debug(`Updating memory ${field}:`, memoryId);
          const supabase = await getAuthenticatedClient();

          const updateData = { [field]: newValue };
          const { error } = await supabase.from('memories').update(updateData).eq('id', memoryId);

          if (error) {
            debug(`Error updating memory ${field}:`, error.message);
            Alert.alert(
              t('common.error', 'Error'),
              t('memo.memory_update_error', 'The memory could not be updated.')
            );
            return;
          }

          // Update the main memories state
          setMemories((prev) =>
            prev.map((m) => (m.id === memoryId ? { ...m, [field]: newValue } : m))
          );

          debug(`Memory ${field} updated successfully:`, memoryId);
        } catch (error) {
          debug(`Error in debouncedMemoryUpdate:`, error);
          Alert.alert(
            t('common.error', 'Error'),
            t('memo.memory_update_error', 'The memory could not be updated.')
          );
        } finally {
          memoryUpdateTimeouts.current.delete(memoryId);
        }
      }, DEBOUNCE_DELAYS.SLOW);

      memoryUpdateTimeouts.current.set(memoryId, timeout);
    },
    [setMemories, t]
  );

  // Update local memory state immediately for smooth UI
  const updateLocalMemory = useCallback(
    (memoryId: string, field: 'title' | 'content', newValue: string) => {
      setLocalMemories((prev) =>
        prev.map((m) => (m.id === memoryId ? { ...m, [field]: newValue } : m))
      );

      // Trigger debounced database update
      debouncedMemoryUpdate(memoryId, field, newValue);
    },
    [debouncedMemoryUpdate]
  );

  // Handler for deleting memories
  const handleDeleteMemory = useCallback(async (memoryId: string) => {
    try {
      updateLoadingState('critical', true);
      debug('Deleting memory:', memoryId);

      const supabase = await getAuthenticatedClient();

      // Delete memory from database
      const { error } = await supabase.from('memories').delete().eq('id', memoryId);

      if (error) {
        debug('Error deleting memory:', error.message);
        Alert.alert(
          t('common.error', 'Error'),
          t('memo.memory_delete_error', 'The memory could not be deleted.')
        );
        return;
      }

      // Remove memory from local state
      setMemories((prevMemories) => prevMemories.filter((m) => m.id !== memoryId));

      debug('Memory successfully deleted:', memoryId);
      showSuccess(t('memo.memory_deleted_success', 'Memory successfully deleted!'));
    } catch (error) {
      debug('Error deleting memory:', error);
      Alert.alert(
        t('common.error', 'Error'),
        t('memo.memory_delete_error', 'An error occurred while deleting the memory.')
      );
    } finally {
      updateLoadingState('critical', false);
    }
  }, [updateLoadingState, setMemories, showSuccess, t]);

  // Handler for copying memory content
  const handleCopyMemory = useCallback(async (memory: any) => {
    try {
      const content = `${memory.title}\n\n${memory.content}`;
      await Clipboard.setStringAsync(content);
      showSuccess(t('memo.memory_copied_success', 'Memory successfully copied!'));
    } catch (error) {
      debug('Error copying memory:', error);
      showSuccess(t('memo.memory_copy_error', 'Memory could not be copied'));
    }
  }, [showSuccess, t]);

  // Handler for sharing memory content
  const handleShareMemory = useCallback(async (memory: any) => {
    try {
      const content = `${memory.title}\n\n${memory.content}`;

      const result = await Share.share({
        message: content,
        title: memory.title,
      });

      if (result.action === Share.sharedAction) {
        showSuccess(t('memo.memory_shared_success', 'Memory successfully shared!'));
      }
    } catch (error) {
      debug('Error sharing memory:', error);
      showSuccess(t('memo.memory_share_error', 'Memory could not be shared'));
    }
  }, [showSuccess, t]);

  const styles = StyleSheet.create({
    memoriesContainer: {
      marginBottom: 16,
      marginHorizontal: 20,
      maxWidth: 760, // 720px content + 40px margins (20px each side)
      alignSelf: 'center',
      width: '100%',
    },
    memorySkeletonContainer: {
      backgroundColor: isDark ? 'rgba(30, 30, 30, 0.5)' : 'rgba(245, 245, 245, 0.5)',
      borderRadius: 12,
      padding: 16,
      marginBottom: 16,
    },
    memorySkeletonHeader: {
      marginBottom: 12,
    },
    memorySkeletonContent: {
      gap: 8,
    },
    memorySkeletonLine: {
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
      borderRadius: 4,
    },
    createMemoryButton: {
      marginTop: 8,
      marginBottom: 16,
    },
  });

  // Loading skeleton
  if (loadingStates.memories) {
    return (
      <View style={styles.memoriesContainer}>
        <View style={styles.memorySkeletonContainer}>
          <View style={styles.memorySkeletonHeader}>
            <View style={[styles.memorySkeletonLine, { width: '70%', height: 16 }]} />
          </View>
          <View style={styles.memorySkeletonContent}>
            <View style={[styles.memorySkeletonLine, { width: '100%', height: 12 }]} />
            <View style={[styles.memorySkeletonLine, { width: '90%', height: 12 }]} />
            <View style={[styles.memorySkeletonLine, { width: '80%', height: 12 }]} />
          </View>
        </View>
      </View>
    );
  }

  // No memories state
  if (memories.length === 0) {
    return (
      <View style={styles.memoriesContainer}>
        <Button
          variant="secondary"
          title={t('memo.create_memory_button', 'Create Memory')}
          iconName="reader-outline"
          onPress={onCreateMemory}
          style={styles.createMemoryButton}
        />
      </View>
    );
  }

  // Memories list
  return (
    <View style={styles.memoriesContainer}>
      {(isEditMode ? localMemories : memories).map((memory, index) => (
        <View 
          key={memory.id}
          ref={(ref) => { memoryRefs.current[index] = ref; }}
        >
          <Memory
            title={memory.title}
            content={memory.content}
            defaultExpanded={true}
            isEditing={isEditMode}
            searchQuery={searchQuery}
            isSearchMode={isSearchMode}
            currentResultIndex={currentSearchIndex}
            searchResults={searchResults}
            memoryId={memory.id}
            onCopy={() => handleCopyMemory(memory)}
            onShare={() => handleShareMemory(memory)}
            onEdit={() => onEditStart()}
            onDelete={() => handleDeleteMemory(memory.id)}
            onContentChange={
              isEditMode
                ? (newContent) => {
                    updateLocalMemory(memory.id, 'content', newContent);
                  }
                : undefined
            }
            onTitleChange={
              isEditMode
                ? (newTitle) => {
                    updateLocalMemory(memory.id, 'title', newTitle);
                  }
                : undefined
            }
          />
        </View>
      ))}
    </View>
  );
}