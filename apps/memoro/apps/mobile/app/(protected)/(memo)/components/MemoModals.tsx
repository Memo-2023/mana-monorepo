import React from 'react';
import { ScrollView } from 'react-native';
import ShareModal from '~/components/molecules/ShareModal';
import ReplaceWordModal from '~/components/molecules/ReplaceWordModal';
import SpeakerLabelModal from '~/components/molecules/SpeakerLabelModal';
import TagSelectorModal from '~/features/tags/TagSelectorModal';
import SpaceLinkSelector from '~/features/spaces/components/SpaceLinkSelector';
import TranslateLanguageModal from '~/components/molecules/TranslateLanguageModal';
import CreateMemoryModal from '~/components/molecules/CreateMemoryModal';
import ReprocessModal from '~/components/molecules/ReprocessModal';
import { useTranslation } from 'react-i18next';
import { useToast } from '~/features/toast/contexts/ToastContext';

interface MemoModalsProps {
  // Memo data
  memo: any; // TODO: Add proper Memo type
  memories: any[]; // TODO: Add proper Memory type
  audioUrl: string | null;
  currentLanguage: string;
  transcriptData: any; // The computed transcript data from memo page

  // Modal visibility states
  isSpaceSelectorVisible: boolean;
  isShareModalVisible: boolean;
  isReplaceWordModalVisible: boolean;
  isSpeakerLabelModalVisible: boolean;
  isTagSelectorVisible: boolean;
  isTranslateModalVisible: boolean;
  isCreateMemoryModalVisible: boolean;
  isReprocessModalVisible: boolean;

  // Modal close handlers
  onCloseSpaceSelector: () => void;
  onCloseShareModal: () => void;
  onCloseReplaceWordModal: () => void;
  onCloseSpeakerLabelModal: () => void;
  onCloseTagSelector: () => void;
  onCloseTranslateModal: () => void;
  onCloseCreateMemoryModal: () => void;
  onCloseReprocessModal: () => void;

  // Modal action handlers
  onSpaceSelect: (spaceIds: string[]) => void;
  onReplaceWord: (wordToReplace: string, replacementWord: string) => void;
  onUpdateSpeakerLabels: (speakerIds: string[], labels: Record<string, string>) => void;
  onTagSelect: (tagId: string) => void;
  onCreateTag: (name: string, color: string) => void;
  onTranslateConfirm: (targetLanguage: string) => Promise<boolean>;
  onMemoryCreated: () => void;
  onReprocess: (language?: string, blueprint?: any, recordingDate?: Date) => Promise<void>;

  // Additional props
  wordToReplace: string;
  replacementWord: string;
  setWordToReplace: (word: string) => void;
  setReplacementWord: (word: string) => void;
  speakerIds: string[];
  speakerMappings: Record<string, string>;
  tagItems: Array<{ id: string; text: string; color: string }>;
  selectedTagIds: string[];
  isTagsLoading: boolean;
  isReprocessing: boolean;
  scrollViewRef: React.RefObject<ScrollView>;
  loadMemoData: (id: string) => void;
  currentSpaceId?: string;
}

export default function MemoModals({
  memo,
  memories,
  audioUrl,
  currentLanguage,
  transcriptData,
  isSpaceSelectorVisible,
  isShareModalVisible,
  isReplaceWordModalVisible,
  isSpeakerLabelModalVisible,
  isTagSelectorVisible,
  isTranslateModalVisible,
  isCreateMemoryModalVisible,
  isReprocessModalVisible,
  onCloseSpaceSelector,
  onCloseShareModal,
  onCloseReplaceWordModal,
  onCloseSpeakerLabelModal,
  onCloseTagSelector,
  onCloseTranslateModal,
  onCloseCreateMemoryModal,
  onCloseReprocessModal,
  onSpaceSelect,
  onReplaceWord,
  onUpdateSpeakerLabels,
  onTagSelect,
  onCreateTag,
  onTranslateConfirm,
  onMemoryCreated,
  onReprocess,
  wordToReplace,
  replacementWord,
  setWordToReplace,
  setReplacementWord,
  speakerIds,
  speakerMappings,
  tagItems,
  selectedTagIds,
  isTagsLoading,
  isReprocessing,
  scrollViewRef,
  loadMemoData,
  currentSpaceId,
}: MemoModalsProps) {
  const { t } = useTranslation();
  const { showSuccess } = useToast();

  if (!memo) return null;

  return (
    <>
      {/* Space Selector Modal */}
      {isSpaceSelectorVisible && (
        <SpaceLinkSelector
          visible={isSpaceSelectorVisible}
          onClose={onCloseSpaceSelector}
          memoId={memo.id}
          currentSpaceId={currentSpaceId}
          onSave={onSpaceSelect}
        />
      )}

      {/* Tag Selector Modal */}
      {isTagSelectorVisible && (
        <TagSelectorModal
          isVisible={isTagSelectorVisible}
          onClose={onCloseTagSelector}
          onTagSelect={onTagSelect}
          selectedTagIds={selectedTagIds}
          tagItems={tagItems}
          isLoading={isTagsLoading}
          onCreateTag={onCreateTag}
        />
      )}

      {/* Replace Word Modal */}
      {isReplaceWordModalVisible && (
        <ReplaceWordModal
          visible={isReplaceWordModalVisible}
          onClose={onCloseReplaceWordModal}
          onSubmit={(word, replacement) => {
            onReplaceWord(word, replacement);
            onCloseReplaceWordModal();
          }}
          initialWordToReplace={wordToReplace}
          initialReplacementWord={replacementWord}
        />
      )}

      {/* Speaker Label Modal */}
      {isSpeakerLabelModalVisible && (
        <SpeakerLabelModal
          visible={isSpeakerLabelModalVisible}
          onClose={onCloseSpeakerLabelModal}
          onSubmit={onUpdateSpeakerLabels}
          speakers={speakerIds}
          initialMappings={speakerMappings}
        />
      )}

      {/* Share Modal */}
      {isShareModalVisible && (
        <ShareModal
          visible={isShareModalVisible}
          onClose={onCloseShareModal}
          title={memo.title || t('memo.untitled', 'Untitled')}
          intro={memo.intro}
          memories={memories || []}
          transcript={transcriptData?.transcript || ''}
          audioUrl={audioUrl || undefined}
        />
      )}

      {/* Translate Language Modal */}
      {isTranslateModalVisible && (
        <TranslateLanguageModal
          isVisible={isTranslateModalVisible}
          onClose={onCloseTranslateModal}
          onConfirm={onTranslateConfirm}
        />
      )}

      {/* Create Memory Modal */}
      {isCreateMemoryModalVisible && (
        <CreateMemoryModal
          visible={isCreateMemoryModalVisible}
          onClose={onCloseCreateMemoryModal}
          memoId={memo.id}
          onMemoryCreated={() => {
            // Reload memories to show the new one
            loadMemoData(memo.id);

            // Show success toast
            showSuccess(t('memo.memory_created_success', 'Memory erfolgreich erstellt!'));

            // Scroll to see the new memory
            setTimeout(() => {
              scrollViewRef.current?.scrollTo({
                y: 400,
                animated: true,
              });
            }, 300);

            onMemoryCreated();
          }}
        />
      )}

      {/* Reprocess Modal */}
      {isReprocessModalVisible && (
        <ReprocessModal
          isVisible={isReprocessModalVisible}
          onClose={onCloseReprocessModal}
          onReprocess={onReprocess}
          currentLanguage={currentLanguage}
          isProcessing={isReprocessing}
          memo={memo}
        />
      )}
    </>
  );
}
