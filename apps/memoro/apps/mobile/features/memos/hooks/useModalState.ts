import { useState } from 'react';

interface ModalState {
	isSpaceSelectorVisible: boolean;
	isShareModalVisible: boolean;
	isReplaceWordModalVisible: boolean;
	isSpeakerLabelModalVisible: boolean;
	isTagSelectorVisible: boolean;
}

interface ModalActions {
	setSpaceSelectorVisible: (visible: boolean) => void;
	setIsShareModalVisible: (visible: boolean) => void;
	setIsReplaceWordModalVisible: (visible: boolean) => void;
	setIsSpeakerLabelModalVisible: (visible: boolean) => void;
	setIsTagSelectorVisible: (visible: boolean) => void;
	closeAllModals: () => void;
}

export function useModalState(): ModalState & ModalActions {
	const [isSpaceSelectorVisible, setSpaceSelectorVisible] = useState(false);
	const [isShareModalVisible, setIsShareModalVisible] = useState(false);
	const [isReplaceWordModalVisible, setIsReplaceWordModalVisible] = useState(false);
	const [isSpeakerLabelModalVisible, setIsSpeakerLabelModalVisible] = useState(false);
	const [isTagSelectorVisible, setIsTagSelectorVisible] = useState(false);

	const closeAllModals = () => {
		setSpaceSelectorVisible(false);
		setIsShareModalVisible(false);
		setIsReplaceWordModalVisible(false);
		setIsSpeakerLabelModalVisible(false);
		setIsTagSelectorVisible(false);
	};

	return {
		// State
		isSpaceSelectorVisible,
		isShareModalVisible,
		isReplaceWordModalVisible,
		isSpeakerLabelModalVisible,
		isTagSelectorVisible,

		// Actions
		setSpaceSelectorVisible,
		setIsShareModalVisible,
		setIsReplaceWordModalVisible,
		setIsSpeakerLabelModalVisible,
		setIsTagSelectorVisible,
		closeAllModals,
	};
}
