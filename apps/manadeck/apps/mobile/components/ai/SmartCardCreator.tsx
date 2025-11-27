import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  Pressable,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Icon } from '../ui/Icon';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { useAIStore } from '../../store/aiStore';
import { GeneratedCard, GenerationOptions } from '../../utils/supabaseAIService';
import { ImageCardCreator } from './ImageCardCreator';

interface SmartCardCreatorProps {
  deckId: string;
  onCardsCreated?: (cards: GeneratedCard[]) => void;
}

export const SmartCardCreator: React.FC<SmartCardCreatorProps> = ({ deckId, onCardsCreated }) => {
  const {
    isGenerating,
    generatedCards,
    error,
    generateCardsFromText,
    clearGeneratedCards,
    saveGeneratedCards,
  } = useAIStore();

  const [inputMode, setInputMode] = useState<'text' | 'image'>('text');
  const [textInput, setTextInput] = useState('');
  const [options, setOptions] = useState<GenerationOptions>({
    cardTypes: ['flashcard', 'quiz'],
    difficulty: 'medium',
    count: 5,
    language: 'de',
  });
  const [selectedCards, setSelectedCards] = useState<Set<number>>(new Set());

  const handleGenerateFromText = async () => {
    if (!textInput.trim()) return;

    try {
      const cards = await generateCardsFromText(textInput, options);
      if (onCardsCreated) {
        onCardsCreated(cards);
      }
    } catch (error) {
      console.error('Error generating cards:', error);
    }
  };

  const handleSaveSelectedCards = async () => {
    const cardsToSave = generatedCards.filter((_, index) => selectedCards.has(index));
    if (cardsToSave.length === 0) return;

    try {
      await saveGeneratedCards(deckId, cardsToSave);
      clearGeneratedCards();
      setSelectedCards(new Set());
      if (onCardsCreated) {
        onCardsCreated(cardsToSave);
      }
    } catch (error) {
      console.error('Error saving cards:', error);
    }
  };

  const toggleCardSelection = (index: number) => {
    const newSelection = new Set(selectedCards);
    if (newSelection.has(index)) {
      newSelection.delete(index);
    } else {
      newSelection.add(index);
    }
    setSelectedCards(newSelection);
  };

  const selectAllCards = () => {
    if (selectedCards.size === generatedCards.length) {
      setSelectedCards(new Set());
    } else {
      setSelectedCards(new Set(generatedCards.map((_, i) => i)));
    }
  };

  const renderGeneratedCard = (card: GeneratedCard, index: number) => {
    const isSelected = selectedCards.has(index);

    return (
      <Pressable
        key={index}
        onPress={() => toggleCardSelection(index)}
        className="mb-3"
        style={({ pressed }) => pressed && { opacity: 0.7 }}>
        <Card
          padding="md"
          variant={isSelected ? 'primary' : 'outlined'}
          className={isSelected ? 'border-2 border-blue-500' : ''}>
          <View className="flex-row items-start justify-between">
            <View className="flex-1">
              <View className="mb-2 flex-row items-center">
                <View
                  className={`rounded px-2 py-1 ${
                    card.type === 'flashcard'
                      ? 'bg-blue-100'
                      : card.type === 'quiz'
                        ? 'bg-purple-100'
                        : 'bg-gray-100'
                  }`}>
                  <Text
                    className={`text-xs font-medium ${
                      card.type === 'flashcard'
                        ? 'text-blue-700'
                        : card.type === 'quiz'
                          ? 'text-purple-700'
                          : 'text-gray-700'
                    }`}>
                    {card.type.toUpperCase()}
                  </Text>
                </View>
                <View className="ml-2 flex-row items-center">
                  <Icon name="speedometer-outline" size={12} color="#6B7280" library="Ionicons" />
                  <Text className="ml-1 text-xs text-gray-500">
                    {Math.round(card.metadata.confidence * 100)}% Konfidenz
                  </Text>
                </View>
              </View>

              {card.type === 'flashcard' && card.content && 'front' in card.content && (
                <>
                  <Text className="font-semibold text-gray-900">{card.content.front}</Text>
                  <Text className="mt-1 text-sm text-gray-600">{card.content.back}</Text>
                </>
              )}

              {card.type === 'quiz' && card.content && 'question' in card.content && (
                <>
                  <Text className="font-semibold text-gray-900">{card.content.question}</Text>
                  <View className="mt-1">
                    {card.content.options.map((option: string, i: number) => (
                      <Text
                        key={i}
                        className={`text-sm ${
                          i === card.content.correctAnswer
                            ? 'font-medium text-green-600'
                            : 'text-gray-600'
                        }`}>
                        {i + 1}. {option}
                      </Text>
                    ))}
                  </View>
                </>
              )}

              {card.type === 'text' && card.content && 'text' in card.content && (
                <Text className="text-gray-900">{card.content.text}</Text>
              )}
            </View>

            <View className="ml-2">
              <Icon
                name={isSelected ? 'checkbox' : 'square-outline'}
                size={24}
                color={isSelected ? '#3B82F6' : '#9CA3AF'}
                library="Ionicons"
              />
            </View>
          </View>
        </Card>
      </Pressable>
    );
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Input Mode Selector */}
        <View className="mb-4 flex-row space-x-2">
          {[
            { key: 'text', label: 'Text', icon: 'text' },
            { key: 'image', label: 'Bild', icon: 'image' },
          ].map((mode) => (
            <Pressable
              key={mode.key}
              onPress={() => setInputMode(mode.key as any)}
              className={`flex-1 flex-row items-center justify-center rounded-lg border p-3 ${
                inputMode === mode.key ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white'
              }`}
              style={({ pressed }) => pressed && { opacity: 0.7 }}>
              <Icon
                name={mode.icon}
                size={20}
                color={inputMode === mode.key ? '#3B82F6' : '#6B7280'}
                library="Ionicons"
              />
              <Text
                className={`ml-2 font-medium ${
                  inputMode === mode.key ? 'text-blue-600' : 'text-gray-600'
                }`}>
                {mode.label}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Input Area */}
        {inputMode === 'text' && (
          <Card padding="lg" variant="elevated" className="mb-4">
            <Text className="mb-2 text-sm font-medium text-gray-700">
              Gib deinen Lerninhalt ein
            </Text>
            <TextInput
              value={textInput}
              onChangeText={setTextInput}
              placeholder="Füge hier deinen Text ein oder beschreibe, was du lernen möchtest..."
              multiline
              numberOfLines={6}
              className="rounded-lg border border-gray-200 bg-white p-3 text-gray-900"
              style={{ textAlignVertical: 'top' }}
            />
          </Card>
        )}

        {inputMode === 'image' && (
          <View className="mb-4">
            <ImageCardCreator
              onCardsGenerated={(cards) => {
                // Add to generated cards
                if (onCardsCreated) {
                  onCardsCreated(cards);
                }
              }}
            />
          </View>
        )}

        {/* Generation Options */}
        {inputMode === 'text' && (
          <Card padding="lg" variant="elevated" className="mb-4">
            <Text className="mb-3 text-sm font-medium text-gray-700">Optionen</Text>

            {/* Card Types */}
            <View className="mb-3">
              <Text className="mb-2 text-xs text-gray-500">Kartentypen</Text>
              <View className="flex-row flex-wrap">
                {(['flashcard', 'quiz', 'text'] as const).map((type) => (
                  <Pressable
                    key={type}
                    onPress={() => {
                      const types = options.cardTypes || [];
                      if (types.includes(type)) {
                        setOptions({
                          ...options,
                          cardTypes: types.filter((t) => t !== type),
                        });
                      } else {
                        setOptions({
                          ...options,
                          cardTypes: [...types, type],
                        });
                      }
                    }}
                    className={`mb-2 mr-2 rounded-full border px-3 py-1 ${
                      options.cardTypes?.includes(type)
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-300 bg-white'
                    }`}
                    style={({ pressed }) => pressed && { opacity: 0.7 }}>
                    <Text
                      className={`text-sm ${
                        options.cardTypes?.includes(type) ? 'text-blue-600' : 'text-gray-600'
                      }`}>
                      {type === 'flashcard' ? 'Karteikarte' : type === 'quiz' ? 'Quiz' : 'Text'}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Difficulty */}
            <View className="mb-3">
              <Text className="mb-2 text-xs text-gray-500">Schwierigkeit</Text>
              <View className="flex-row space-x-2">
                {(['easy', 'medium', 'hard'] as const).map((level) => (
                  <Pressable
                    key={level}
                    onPress={() => setOptions({ ...options, difficulty: level })}
                    className={`flex-1 rounded-lg border p-2 ${
                      options.difficulty === level
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-300 bg-white'
                    }`}
                    style={({ pressed }) => pressed && { opacity: 0.7 }}>
                    <Text
                      className={`text-center text-sm ${
                        options.difficulty === level ? 'text-blue-600' : 'text-gray-600'
                      }`}>
                      {level === 'easy' ? 'Einfach' : level === 'medium' ? 'Mittel' : 'Schwer'}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Count */}
            <View>
              <Text className="mb-2 text-xs text-gray-500">Anzahl Karten: {options.count}</Text>
              <View className="flex-row items-center">
                <Pressable
                  onPress={() =>
                    setOptions({ ...options, count: Math.max(1, (options.count || 5) - 1) })
                  }
                  className="rounded-lg bg-gray-200 p-2"
                  style={({ pressed }) => pressed && { opacity: 0.7 }}>
                  <Icon name="remove" size={20} color="#374151" library="Ionicons" />
                </Pressable>
                <Text className="mx-4 text-lg font-semibold">{options.count}</Text>
                <Pressable
                  onPress={() =>
                    setOptions({ ...options, count: Math.min(20, (options.count || 5) + 1) })
                  }
                  className="rounded-lg bg-gray-200 p-2"
                  style={({ pressed }) => pressed && { opacity: 0.7 }}>
                  <Icon name="add" size={20} color="#374151" library="Ionicons" />
                </Pressable>
              </View>
            </View>
          </Card>
        )}

        {/* Generate Button */}
        {inputMode === 'text' && textInput.trim() && (
          <Button
            onPress={handleGenerateFromText}
            variant="primary"
            fullWidth
            disabled={isGenerating}
            leftIcon={
              isGenerating ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Icon name="sparkles" size={20} color="white" library="Ionicons" />
              )
            }>
            {isGenerating ? 'Generiere Karten...' : 'Karten generieren'}
          </Button>
        )}

        {/* Error Display */}
        {error && (
          <Card padding="md" variant="outlined" className="mb-4 border-red-200 bg-red-50">
            <Text className="text-sm text-red-600">{error}</Text>
          </Card>
        )}

        {/* Generated Cards */}
        {generatedCards.length > 0 && (
          <View className="mt-6">
            <View className="mb-3 flex-row items-center justify-between">
              <Text className="text-lg font-semibold text-gray-900">
                Generierte Karten ({selectedCards.size}/{generatedCards.length})
              </Text>
              <Pressable
                onPress={selectAllCards}
                style={({ pressed }) => pressed && { opacity: 0.7 }}>
                <Text className="text-sm font-medium text-blue-600">
                  {selectedCards.size === generatedCards.length
                    ? 'Keine auswählen'
                    : 'Alle auswählen'}
                </Text>
              </Pressable>
            </View>

            {generatedCards.map((card, index) => renderGeneratedCard(card, index))}

            {selectedCards.size > 0 && (
              <View className="mt-4 flex-row space-x-2">
                <Button
                  onPress={handleSaveSelectedCards}
                  variant="primary"
                  fullWidth
                  leftIcon={
                    <Icon name="save-outline" size={20} color="white" library="Ionicons" />
                  }>
                  {selectedCards.size} Karten speichern
                </Button>
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
};
