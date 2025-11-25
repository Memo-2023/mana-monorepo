import { useState } from 'react';
import { useAppTheme } from '../theme/ThemeProvider';

interface UseChatInputProps {
  onSend: (message: string) => void;
  isLoading?: boolean;
  initialText?: string;
  placeholder?: string;
  maxLength?: number;
}

interface UseChatInputReturn {
  text: string;
  setText: (text: string) => void;
  handleSend: () => void;
  canSend: boolean;
  isLoading: boolean;
  isDarkMode: boolean;
  placeholder: string;
}

export default function useChatInput({
  onSend,
  isLoading = false,
  initialText = '',
  placeholder = 'Nachricht eingeben...',
  maxLength = 1000,
}: UseChatInputProps): UseChatInputReturn {
  const [text, setText] = useState(initialText);
  const { isDarkMode } = useAppTheme();
  
  const canSend = text.trim().length > 0 && !isLoading;
  
  const handleSend = () => {
    if (canSend) {
      onSend(text.trim());
      setText('');
    }
  };
  
  return {
    text,
    setText,
    handleSend,
    canSend,
    isLoading,
    isDarkMode,
    placeholder,
  };
}