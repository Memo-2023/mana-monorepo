import React from 'react';
import { View, TextInput, TouchableOpacity, Text, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import useChatInput from '../hooks/useChatInput';
import ModelDropdown from './ModelDropdown';

interface ChatInputProps {
  onSend: (message: string) => void;
  isLoading?: boolean;
  placeholder?: string;
  showModelSelection?: boolean;
  selectedModelId?: string;
  onSelectModel?: (id: string) => void;
  showAttachments?: boolean;
  showSearch?: boolean;
}

export default function ChatInput({
  onSend,
  isLoading = false,
  placeholder = 'Nachricht eingeben...',
  showModelSelection = false,
  selectedModelId = '550e8400-e29b-41d4-a716-446655440000',
  onSelectModel = () => {},
  showAttachments = false,
  showSearch = false,
}: ChatInputProps) {
  const {
    text,
    setText,
    handleSend,
    canSend,
    isDarkMode,
  } = useChatInput({
    onSend,
    isLoading,
    placeholder,
  });

  return (
    <View className="w-full px-4">
      <View className={`rounded-lg p-4 ${isDarkMode ? 'bg-[#2C2C2E]' : 'bg-white'}`}>
        {showModelSelection && (
          <View className="flex-row justify-between items-center mb-3">
            <Text className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              Modell:
            </Text>
            <ModelDropdown 
              selectedModelId={selectedModelId} 
              onSelectModel={onSelectModel}
            />
          </View>
        )}
        
        <TextInput
          className={`w-full min-h-[40px] text-base rounded-lg px-4 py-2 ${
            isDarkMode 
              ? 'text-white bg-[#1C1C1E]' 
              : 'text-black bg-gray-100'
          }`}
          placeholder={placeholder}
          placeholderTextColor={isDarkMode ? '#8E8E93' : '#8E8E93'}
          value={text}
          onChangeText={setText}
          multiline
          maxLength={1000}
          editable={!isLoading}
        />
        
        <View className="flex-row justify-between items-center mt-4">
          {(showAttachments || showSearch) && (
            <View className="flex-row space-x-4">
              {showAttachments && (
                <TouchableOpacity className="flex-row items-center">
                  <Ionicons name="attach" size={20} color={isDarkMode ? '#FFFFFF' : '#000000'} />
                  <Text className={`ml-1 ${isDarkMode ? 'text-white' : 'text-black'}`}>Attach</Text>
                </TouchableOpacity>
              )}
              
              {showSearch && (
                <TouchableOpacity className="flex-row items-center">
                  <Ionicons name="search" size={20} color={isDarkMode ? '#FFFFFF' : '#000000'} />
                  <Text className={`ml-1 ${isDarkMode ? 'text-white' : 'text-black'}`}>Search</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
          
          <TouchableOpacity 
            className={`flex-row items-center px-3 py-2 rounded-full ${
              canSend ? 'bg-[#0A84FF]' : 'bg-[#0A84FF]/20'
            }`}
            onPress={handleSend}
            disabled={!canSend}
          >
            {isLoading ? (
              <View className="flex-row items-center">
                <View className="h-4 w-4 mr-1">
                  <ActivityIndicator size="small" color="#FFFFFF" />
                </View>
                <Text className="text-white">Wird gesendet...</Text>
              </View>
            ) : (
              <>
                <Ionicons 
                  name="send" 
                  size={18} 
                  color={canSend ? '#FFFFFF' : '#0A84FF'} 
                />
                <Text 
                  className={`ml-1 ${canSend ? 'text-white' : 'text-[#0A84FF]'}`}
                >
                  Senden
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}