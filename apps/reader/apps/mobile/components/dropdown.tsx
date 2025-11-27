import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, ScrollView, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '~/hooks/useTheme';

interface DropdownOption {
  label: string;
  value: string;
}

interface DropdownGroup {
  title: string;
  options: DropdownOption[];
}

interface DropdownProps {
  options: DropdownOption[];
  groups?: DropdownGroup[];
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  title?: string;
}

export function Dropdown({
  options,
  groups,
  value,
  onValueChange,
  placeholder = 'Select an option',
  disabled = false,
  title = 'Select Option',
}: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { colors } = useTheme();

  // Find selected option from either flat options or groups
  const allOptions = groups ? groups.flatMap((g) => g.options) : options;
  const selectedOption = allOptions.find((opt) => opt.value === value);

  const handleSelect = (optionValue: string) => {
    onValueChange(optionValue);
    setIsOpen(false);
  };

  return (
    <View>
      <TouchableOpacity
        onPress={() => !disabled && setIsOpen(true)}
        className={`flex-row items-center justify-between rounded-lg border ${colors.border} ${colors.surface} px-4 py-3 ${
          disabled ? 'opacity-50' : ''
        }`}
        disabled={disabled}>
        <Text
          className={`flex-1 ${selectedOption ? colors.text : colors.textSecondary}`}
          numberOfLines={1}>
          {selectedOption?.label || placeholder}
        </Text>
        <Ionicons
          name={isOpen ? 'chevron-up' : 'chevron-down'}
          size={20}
          color={colors.textSecondary}
        />
      </TouchableOpacity>

      <Modal
        visible={isOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsOpen(false)}>
        <Pressable
          style={{ flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
          onPress={() => setIsOpen(false)}>
          <View className="flex-1 justify-center px-4">
            <Pressable
              onPress={(e) => e.stopPropagation()}
              className={`max-h-[80%] rounded-xl border ${colors.border} ${colors.surface} shadow-xl`}>
              <View className={`border-b ${colors.border} px-4 py-3`}>
                <View className="flex-row items-center justify-between">
                  <Text className={`text-lg font-semibold ${colors.text}`}>{title}</Text>
                  <TouchableOpacity onPress={() => setIsOpen(false)}>
                    <Ionicons name="close-circle" size={24} color={colors.textSecondary} />
                  </TouchableOpacity>
                </View>
              </View>
              <ScrollView className="px-2 py-2" showsVerticalScrollIndicator={true}>
                {groups
                  ? // Render grouped options
                    groups.map((group, groupIndex) => (
                      <View key={group.title} className={groupIndex > 0 ? 'mt-4' : ''}>
                        <Text className={`mx-2 mb-2 text-sm font-bold ${colors.textSecondary}`}>
                          {group.title}
                        </Text>
                        {group.options.map((option) => (
                          <TouchableOpacity
                            key={option.value}
                            onPress={() => handleSelect(option.value)}
                            className={`mx-2 mb-1 rounded-lg px-4 py-3 ${
                              option.value === value ? colors.primary : colors.surfaceSecondary
                            }`}>
                            <Text
                              className={`${
                                option.value === value ? 'font-medium text-white' : colors.text
                              }`}>
                              {option.label}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    ))
                  : // Render flat options
                    options.map((option) => (
                      <TouchableOpacity
                        key={option.value}
                        onPress={() => handleSelect(option.value)}
                        className={`mx-2 mb-1 rounded-lg px-4 py-3 ${
                          option.value === value ? colors.primary : colors.surfaceSecondary
                        }`}>
                        <Text
                          className={`${
                            option.value === value ? 'font-medium text-white' : colors.text
                          }`}>
                          {option.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
              </ScrollView>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}
