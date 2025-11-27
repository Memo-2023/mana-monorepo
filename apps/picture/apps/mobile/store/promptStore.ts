import { create } from 'zustand';

type PromptStore = {
	prompt: string;
	setPrompt: (prompt: string) => void;
};

export const usePromptStore = create<PromptStore>((set) => ({
	prompt: '',
	setPrompt: (prompt) => set({ prompt }),
}));
