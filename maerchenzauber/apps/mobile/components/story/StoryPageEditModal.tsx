import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TextInput, ScrollView, Dimensions, Modal as RNModal, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import Text from '../atoms/Text';
import Button from '../atoms/Button';
import TabSwitcher from '../molecules/TabSwitcher';

interface StoryPageEditModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (newText: string) => void;
  pageIndex: number;
  totalPages: number;
  initialText: string;
  imageUri: string;
  blurhash?: string;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function StoryPageEditModal({
  visible,
  onClose,
  onSave,
  pageIndex,
  totalPages,
  initialText,
  imageUri,
  blurhash,
}: StoryPageEditModalProps) {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<'text' | 'image'>('text');
  const [text, setText] = useState(initialText);
  const [hasChanges, setHasChanges] = useState(false);

  // Reset state when modal opens
  useEffect(() => {
    if (visible) {
      setText(initialText);
      setActiveTab('text');
      setHasChanges(false);
    }
  }, [visible, initialText]);

  // Track changes
  useEffect(() => {
    setHasChanges(text !== initialText);
  }, [text, initialText]);

  const handleSave = () => {
    if (hasChanges) {
      onSave(text);
    }
    onClose();
  };

  const handleCancel = () => {
    if (hasChanges) {
      // TODO: Show confirmation dialog
      setText(initialText);
    }
    onClose();
  };

  const tabs = [
    { key: 'text', label: 'Text' },
    { key: 'image', label: 'Bild' },
  ];

  return (
    <RNModal
      animationType="slide"
      transparent={false}
      visible={visible}
      onRequestClose={handleCancel}
      presentationStyle="fullScreen"
    >
      <View style={styles.modalContainer}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.container}
          keyboardVerticalOffset={0}
        >
          {/* Header with Safe Area padding */}
          <View style={[styles.header, { paddingTop: insets.top }]}>
            <BlurView intensity={80} tint="dark" style={styles.headerBlur}>
              <View style={styles.headerContent}>
                <TouchableOpacity onPress={handleCancel} style={styles.headerButton}>
                  <Ionicons name="close" size={28} color="#ffffff" />
                </TouchableOpacity>

                <Text variant="header" color="#ffffff" style={styles.headerTitle}>
                  Seite {pageIndex + 1} / {totalPages}
                </Text>

                <TouchableOpacity onPress={handleSave} style={styles.headerButton}>
                  <Ionicons name="checkmark" size={28} color={hasChanges ? "#4CAF50" : "#666666"} />
                </TouchableOpacity>
              </View>
            </BlurView>
          </View>

          {/* Content Area */}
          <View style={styles.content}>
            {activeTab === 'text' ? (
              <ScrollView
                style={styles.textScrollView}
                contentContainerStyle={styles.textScrollContent}
                keyboardShouldPersistTaps="handled"
              >
                <TextInput
                  value={text}
                  onChangeText={setText}
                  multiline
                  style={styles.textInput}
                  placeholderTextColor="#666666"
                  placeholder="Geschichte bearbeiten..."
                  autoCorrect={true}
                  spellCheck={true}
                  autoFocus={true}
                />
              </ScrollView>
            ) : (
              <ScrollView
                style={styles.imageScrollView}
                contentContainerStyle={styles.imageScrollContent}
              >
                <View style={styles.imageContainer}>
                  <Image
                    source={{ uri: imageUri }}
                    style={styles.image}
                    contentFit="contain"
                    placeholder={blurhash ? { blurhash } : undefined}
                    transition={200}
                    cachePolicy="memory-disk"
                  />
                </View>
                <Text variant="body" color="#AAAAAA" style={styles.imageHint}>
                  Bildbearbeitung kommt bald
                </Text>
              </ScrollView>
            )}
          </View>

          {/* Tab Switcher at Bottom with Safe Area padding */}
          <View style={[styles.tabContainer, { paddingBottom: insets.bottom }]}>
            <TabSwitcher
              options={tabs}
              activeKey={activeTab}
              onTabChange={(key) => setActiveTab(key as 'text' | 'image')}
              containerStyle={styles.tabSwitcher}
              activeColor="#4CAF50"
            />

            {/* Action Buttons */}
            <View style={styles.actionButtons}>
              <Button
                title="Abbrechen"
                onPress={handleCancel}
                variant="tonal"
                size="lg"
                color="#555555"
                style={styles.actionButton}
              />
              <Button
                title="Speichern"
                onPress={handleSave}
                variant="primary"
                size="lg"
                color="#4CAF50"
                iconName="save"
                iconPosition="left"
                disabled={!hasChanges}
                style={styles.actionButton}
              />
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </RNModal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: '#121212',
  },
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  header: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerBlur: {
    width: '100%',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    height: 60,
  },
  headerButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  textScrollView: {
    flex: 1,
  },
  textScrollContent: {
    paddingBottom: 40,
  },
  textInput: {
    color: '#FFFFFF',
    fontSize: 16,
    lineHeight: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(76, 175, 80, 0.3)',
    borderRadius: 12,
    padding: 16,
    minHeight: 200,
    textAlignVertical: 'top',
  },
  imageScrollView: {
    flex: 1,
  },
  imageScrollContent: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 40,
  },
  imageContainer: {
    width: '100%',
    aspectRatio: 3 / 4,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#242424',
    marginBottom: 16,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imageHint: {
    fontSize: 14,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  tabContainer: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
    backgroundColor: '#121212',
  },
  tabSwitcher: {
    marginBottom: 16,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
  },
});
