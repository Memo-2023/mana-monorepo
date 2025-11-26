import React, { useState, useCallback, useMemo, useImperativeHandle, forwardRef } from 'react';
import {
  View,
  Pressable,
  Platform,
  StyleSheet,
  TextInput,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '~/features/theme/ThemeProvider';
import Text from '~/components/atoms/Text';
import Icon from '~/components/atoms/Icon';
import HighlightedText from '~/components/atoms/HighlightedText';
import Markdown from 'react-native-markdown-display';
import { createMarkdownStyles, createCompactMarkdownStyles } from '~/features/theme/markdownStyles';

// TODO: Replace with @expo/ui ContextMenu when implementing
// import { MenuView } from '@react-native-menu/menu';

interface MemoryProps {
  title: string;
  content: string;
  defaultExpanded?: boolean;
  isEditing?: boolean;
  onContentChange?: (newContent: string) => void;
  onTitleChange?: (newTitle: string) => void;
  onShare?: () => void;
  onCopy?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  createdAt?: string;
  onMemoPress?: () => void;
  // Search highlighting props
  searchQuery?: string;
  isSearchMode?: boolean;
  currentResultIndex?: number;
  searchResults?: Array<{id: string; type: string; text: string; index: number; matchIndex: number}>;
  memoryId?: string;
}

export interface MemoryHandle {
  saveContent: () => void;
}

const Memory = forwardRef<MemoryHandle, MemoryProps>((props, ref) => {
  // Safely extract props without destructuring
  const safeProps = props || {};
  const title = safeProps.title || '';
  const content = safeProps.content || '';
  const defaultExpanded = safeProps.defaultExpanded !== undefined ? safeProps.defaultExpanded : true;
  const isEditing = safeProps.isEditing || false;
  const onContentChange = safeProps.onContentChange;
  const onTitleChange = safeProps.onTitleChange;
  const onShare = safeProps.onShare;
  const onCopy = safeProps.onCopy;
  const onEdit = safeProps.onEdit;
  const onDelete = safeProps.onDelete;
  const createdAt = safeProps.createdAt;
  const searchQuery = safeProps.searchQuery || '';
  const isSearchMode = safeProps.isSearchMode || false;
  const currentResultIndex = safeProps.currentResultIndex;
  const searchResults = safeProps.searchResults || [];

  // Get theme and translation values safely
  let isDark = false;
  let themeVariant = 'lume';
  let t = (key: string, fallback: string) => fallback;

  try {
    const theme = useTheme();
    isDark = theme.isDark;
    themeVariant = theme.themeVariant;
  } catch (error) {
    console.warn('Theme hook failed in Memory component, using defaults');
  }

  try {
    const translation = useTranslation();
    t = translation.t;
  } catch (error) {
    console.warn('Translation hook failed in Memory component, using fallback');
  }

  // State for expanding/collapsing
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [isHovered, setIsHovered] = useState(false);

  // Toggle function
  const toggleExpanded = useCallback(() => {
    setIsExpanded(prev => !prev);
  }, []);

  // Implement the ref methods
  useImperativeHandle(ref, () => ({
    saveContent: () => {
      console.log('Save content called');
    }
  }));

  // Menu items for Zeego DropdownMenu
  const menuItems = useMemo(() => {
    return [
      { 
        key: 'edit', 
        title: t('common.edit', 'Edit'),
        systemIcon: 'pencil',
        onSelect: onEdit,
      },
      { 
        key: 'copy', 
        title: t('memo.copy', 'Copy'),
        systemIcon: 'doc.on.doc',
        onSelect: onCopy,
      },
      { 
        key: 'share', 
        title: t('common.share', 'Share'),
        systemIcon: 'square.and.arrow.up',
        onSelect: onShare,
      },
      { 
        key: 'delete', 
        title: t('common.delete', 'Delete'),
        systemIcon: 'trash',
        destructive: true,
        onSelect: onDelete,
      },
    ];
  }, [t, onEdit, onCopy, onShare, onDelete]);


  // Theme colors and tw function
  const { tw, colors } = useTheme();
  const textColor = isDark ? '#FFFFFF' : '#000000';
  const secondaryTextColor = isDark ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)';
  // Icon-Farbe basierend auf Theme (weiß im Dark Mode, dunkel im Light Mode)
  const iconColor = '#AEAEB2'; // Light gray icon color for both light and dark mode
  
  // Import Tailwind config colors
  const tailwindConfig = require('~/tailwind.config.js');
  
  // Get contentBackground color from tailwind config (for content cards)
  const getContentBackgroundColor = () => {
    try {
      const colors = tailwindConfig.theme.extend.colors;
      
      if (isDark) {
        return colors.dark[themeVariant].contentBackground;
      } else {
        return colors[themeVariant].contentBackground;
      }
    } catch (error) {
      console.warn('Failed to get contentBackground from tailwind config, using fallback');
      return isDark ? '#1E1E1E' : '#FFFFFF';
    }
  };

  const backgroundColor = getContentBackgroundColor();

  // Markdown detection function
  const hasMarkdownSyntax = useCallback((text: string): boolean => {
    if (!text) return false;
    
    const markdownPatterns = [
      /^#{1,6}\s/m,        // Headers
      /\*\*.*\*\*/,        // Bold
      /\*[^*]+\*/,         // Italic (improved pattern)
      /\[.*\]\(.*\)/,      // Links
      /```[\s\S]*```/,     // Code blocks
      /`[^`]+`/,           // Inline code
      /^\s*[-*+]\s/m,      // Unordered lists
      /^\s*\d+\.\s/m,      // Ordered lists
      /^\s*>\s/m,          // Blockquotes
      /^\s*---\s*$/m,      // Horizontal rules
    ];
    
    return markdownPatterns.some(pattern => pattern.test(text));
  }, []);

  // Custom markdown rules for better blockquote rendering
  const markdownRules = useMemo(() => ({
    blockquote: (node: any, children: any, parent: any, styles: any) => (
      <View key={node.key} style={{
        backgroundColor: isDark ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.02)',
        marginVertical: 12,
        borderRadius: 4,
        position: 'relative',
      }}>
        <View style={{
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: 3,
          backgroundColor: isDark ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.3)',
        }} />
        <View style={{ paddingLeft: 20, paddingVertical: 16, paddingRight: 16 }}>
          {children}
        </View>
      </View>
    ),
    text: (node: any, children: any, parent: any, styles: any) => {
      // Special handling for text inside blockquotes
      if (parent && parent.type === 'blockquote') {
        return (
          <Text key={node.key} style={{
            fontStyle: 'italic',
            color: secondaryTextColor,
            fontSize: 16,
            lineHeight: 28,
          }}>
            {node.content}
          </Text>
        );
      }
      // Default text rendering
      return (
        <Text key={node.key} style={styles.text}>
          {node.content}
        </Text>
      );
    },
  }), [isDark, secondaryTextColor]);

  // Markdown styles using central configuration
  const markdownStyles = useMemo(() => 
    createMarkdownStyles({
      isDark,
      textColor,
      secondaryTextColor,
      backgroundColor: 'transparent',
    }), [isDark, textColor, secondaryTextColor]
  );

  // Markdown styles for title (more compact)
  const markdownTitleStyles = useMemo(() => 
    createCompactMarkdownStyles(markdownStyles), [markdownStyles]
  );

  // Clean styles with content background for better visual separation
  const styles = StyleSheet.create({
    container: {
      backgroundColor: 'transparent',
      width: '100%',
      maxWidth: 720,
      alignSelf: 'center',
      marginVertical: 8,
      paddingHorizontal: 0, // No horizontal padding - parent container handles spacing
      borderRadius: 16, // Add rounded corners like MemoPreview
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 12,
      paddingHorizontal: 0,
      backgroundColor: 'transparent',
      borderWidth: 0, // Remove border since container has its own styling
      borderRadius: 0, // Remove border radius since container handles it
    },
    headerContent: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
    },
    title: {
      fontSize: 16,
      fontWeight: 'bold',
      color: textColor,
      flex: 1,
      opacity: isExpanded ? 0.5 : 1,
    },
    titleInput: {
      fontSize: 16,
      fontWeight: 'bold',
      color: textColor,
      flex: 1,
      borderBottomWidth: 1,
      borderBottomColor: isDark ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.3)',
      paddingBottom: 2,
      minHeight: 20,
    },
    bulletPoint: {
      fontSize: 16,
      color: textColor,
      marginRight: 8,
      transform: [{ scale: 1.5 }],
      alignSelf: 'flex-start',
      marginTop: -2,
    },
    chevron: {
      marginLeft: 8,
      transform: [{ rotate: isExpanded ? '0deg' : '90deg' }],
    },
    content: {
      paddingTop: 0,
      paddingBottom: 12,
      backgroundColor: 'transparent',
      width: '100%',
    },
    contentVisible: {
      opacity: 1,
    },
    contentText: {
      fontSize: 16,
      lineHeight: 24,
      color: textColor,
    },
    contentInput: {
      fontSize: 16,
      lineHeight: 24,
      color: textColor,
      borderBottomWidth: 1,
      borderBottomColor: isDark ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.3)',
      paddingBottom: 4,
      minHeight: 24,
      textAlignVertical: 'top',
    },
    timestamp: {
      fontSize: 12,
      color: secondaryTextColor,
      marginTop: 8,
    },
  });

  // Return content directly - MenuView wrapped around entire component interferes with toggle
  return (
    <View style={styles.container}>
      <Pressable
        style={styles.header}
        onPress={isEditing ? undefined : toggleExpanded}
        onHoverIn={() => Platform.OS === 'web' && !isExpanded && setIsHovered(true)}
        onHoverOut={() => Platform.OS === 'web' && setIsHovered(false)}
        disabled={isEditing}
      >
        <View style={styles.headerContent}>
          {!isEditing && (
            <Text style={[styles.bulletPoint, { opacity: isExpanded ? 0.5 : 1 }]}>•</Text>
          )}
          {isEditing ? (
            <TextInput
              style={styles.titleInput}
              value={title}
              onChangeText={onTitleChange}
              placeholder="Memory Titel eingeben"
              placeholderTextColor={isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)'}
              multiline
              scrollEnabled={true}
              textAlignVertical="top"
            />
          ) : isSearchMode && searchQuery ? (
            <HighlightedText
              text={title}
              searchQuery={searchQuery}
              style={styles.title}
              numberOfLines={2}
              ellipsizeMode="tail"
              currentResultIndex={currentResultIndex}
              searchResults={searchResults}
              textType="memory-title"
            />
          ) : hasMarkdownSyntax(title) ? (
            <View style={{ flex: 1, opacity: isExpanded ? 0.5 : 1 }}>
              <Markdown style={markdownTitleStyles} rules={markdownRules}>
                {title}
              </Markdown>
            </View>
          ) : (
            <Text style={styles.title}>{title}</Text>
          )}

          {!isEditing && (
            <View style={[styles.chevron, { opacity: 0.5 }]}>
              <Icon
                name="chevron-down"
                size={16}
                color={isDark ? '#FFFFFF' : '#000000'}
              />
            </View>
          )}
        </View>
      </Pressable>

      {(isExpanded || isEditing) && (
        Platform.OS === 'web' ? (
          <View style={[styles.content, styles.contentVisible]}>
            {isEditing ? (
              <TextInput
                style={styles.contentInput}
                value={content}
                onChangeText={onContentChange}
                placeholder="Memory Inhalt eingeben"
                placeholderTextColor={isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)'}
                multiline
                scrollEnabled={false}
                textAlignVertical="top"
              />
            ) : isSearchMode && searchQuery ? (
              <HighlightedText
                text={content}
                searchQuery={searchQuery}
                style={styles.contentText}
                currentResultIndex={currentResultIndex}
                searchResults={searchResults}
                textType="memory-content"
              />
            ) : hasMarkdownSyntax(content) ? (
              <Markdown style={markdownStyles} rules={markdownRules}>
                {content}
              </Markdown>
            ) : (
              <Text style={styles.contentText}>{content}</Text>
            )}
            {createdAt && (
              <Text style={styles.timestamp}>
                {new Date(createdAt).toLocaleDateString()}
              </Text>
            )}
          </View>
        ) : (
          // TODO: Replace with @expo/ui ContextMenu for long-press menu
          <View style={[styles.content, styles.contentVisible]}>
            {isEditing ? (
              <TextInput
                style={styles.contentInput}
                value={content}
                onChangeText={onContentChange}
                placeholder="Memory Inhalt eingeben"
                placeholderTextColor={isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)'}
                multiline
                scrollEnabled={false}
                textAlignVertical="top"
              />
            ) : isSearchMode && searchQuery ? (
              <HighlightedText
                text={content}
                searchQuery={searchQuery}
                style={styles.contentText}
                currentResultIndex={currentResultIndex}
                searchResults={searchResults}
                textType="memory-content"
              />
            ) : hasMarkdownSyntax(content) ? (
              <Markdown style={markdownStyles} rules={markdownRules}>
                {content}
              </Markdown>
            ) : (
              <Text style={styles.contentText}>{content}</Text>
            )}
            {createdAt && (
              <Text style={styles.timestamp}>
                {new Date(createdAt).toLocaleDateString()}
              </Text>
            )}
          </View>
        )
      )}
    </View>
  );
});

Memory.displayName = 'Memory';

export default Memory;