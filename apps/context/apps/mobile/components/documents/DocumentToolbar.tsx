import React from 'react';
import { View, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '~/components/ui/Text';
import { SaveIndicator } from '~/components/ui/SaveIndicator';
import { useTheme } from '~/utils/theme/theme';
import { DocumentMode } from '~/types/documentEditor';
import { EDITOR_CONFIG } from '~/config/editorConfig';

export interface DocumentToolbarProps {
	mode: DocumentMode;
	onToggleMode: () => void;
	onSave: () => void;
	onShowTags: () => void;
	onShowVariantCreator: () => void;

	// Save status
	saveStatus: 'idle' | 'saving' | 'saved' | 'error';
	lastSaved?: Date | null;
	saveError?: string | null;

	// State
	canSave: boolean;
	isGeneratingText: boolean;
	showTagsEditor: boolean;

	className?: string;
}

/**
 * Toolbar-Komponente für den Dokumenten-Editor
 * Enthält Mode-Toggle, Save-Button, Tags-Button und Save-Indicator
 */
export const DocumentToolbar: React.FC<DocumentToolbarProps> = ({
	mode,
	onToggleMode,
	onSave,
	onShowTags,
	onShowVariantCreator,
	saveStatus,
	lastSaved,
	saveError,
	canSave,
	isGeneratingText,
	showTagsEditor,
	className,
}) => {
	const { isDark } = useTheme();

	const getButtonColor = (isActive: boolean) => {
		if (isActive) {
			return isDark ? '#4f46e5' : '#6366f1';
		}
		return isDark ? '#6b7280' : '#9ca3af';
	};

	const getButtonBackground = (isActive: boolean) => {
		if (isActive) {
			return isDark ? '#1e1b4b' : '#e0e7ff';
		}
		return 'transparent';
	};

	return (
		<View
			className={className}
			style={{
				flexDirection: 'row',
				alignItems: 'center',
				justifyContent: 'space-between',
				paddingHorizontal: 16,
				paddingVertical: 12,
				backgroundColor: isDark ? '#1f2937' : '#ffffff',
				borderTopWidth: 1,
				borderTopColor: isDark ? '#374151' : '#e5e7eb',
			}}
		>
			{/* Left side - Mode Toggle */}
			<View style={{ flexDirection: 'row', alignItems: 'center' }}>
				<TouchableOpacity
					onPress={onToggleMode}
					style={{
						flexDirection: 'row',
						alignItems: 'center',
						paddingHorizontal: 12,
						paddingVertical: 6,
						borderRadius: 6,
						backgroundColor: getButtonBackground(mode === 'edit'),
						marginRight: 8,
					}}
					disabled={isGeneratingText}
				>
					<Ionicons
						name={mode === 'edit' ? 'create' : 'create-outline'}
						size={16}
						color={getButtonColor(mode === 'edit')}
						style={{ marginRight: 4 }}
					/>
					<Text
						style={{
							fontSize: 14,
							color: getButtonColor(mode === 'edit'),
							fontWeight: mode === 'edit' ? '600' : '400',
						}}
					>
						Bearbeiten
					</Text>
				</TouchableOpacity>

				<TouchableOpacity
					onPress={onToggleMode}
					style={{
						flexDirection: 'row',
						alignItems: 'center',
						paddingHorizontal: 12,
						paddingVertical: 6,
						borderRadius: 6,
						backgroundColor: getButtonBackground(mode === 'preview'),
						marginRight: 16,
					}}
					disabled={isGeneratingText}
				>
					<Ionicons
						name={mode === 'preview' ? 'eye' : 'eye-outline'}
						size={16}
						color={getButtonColor(mode === 'preview')}
						style={{ marginRight: 4 }}
					/>
					<Text
						style={{
							fontSize: 14,
							color: getButtonColor(mode === 'preview'),
							fontWeight: mode === 'preview' ? '600' : '400',
						}}
					>
						Vorschau
					</Text>
				</TouchableOpacity>

				{/* Save Button */}
				<TouchableOpacity
					onPress={onSave}
					style={{
						flexDirection: 'row',
						alignItems: 'center',
						paddingHorizontal: 12,
						paddingVertical: 6,
						borderRadius: 6,
						backgroundColor: canSave ? (isDark ? '#059669' : '#10b981') : 'transparent',
						opacity: canSave ? 1 : 0.5,
						marginRight: 8,
					}}
					disabled={!canSave || saveStatus === 'saving'}
				>
					<Ionicons
						name="save"
						size={16}
						color={canSave ? '#ffffff' : isDark ? '#9ca3af' : '#6b7280'}
						style={{ marginRight: 4 }}
					/>
					<Text
						style={{
							fontSize: 14,
							color: canSave ? '#ffffff' : isDark ? '#9ca3af' : '#6b7280',
							fontWeight: '500',
						}}
					>
						Speichern
					</Text>
				</TouchableOpacity>
			</View>

			{/* Center - Save Indicator */}
			<SaveIndicator
				status={saveStatus}
				lastSaved={lastSaved}
				error={saveError}
				className="flex-1 justify-center"
			/>

			{/* Right side - Action Buttons */}
			<View style={{ flexDirection: 'row', alignItems: 'center' }}>
				{/* Tags Button */}
				<TouchableOpacity
					onPress={onShowTags}
					style={{
						flexDirection: 'row',
						alignItems: 'center',
						paddingHorizontal: 12,
						paddingVertical: 6,
						borderRadius: 6,
						backgroundColor: getButtonBackground(showTagsEditor),
						marginRight: 8,
					}}
					disabled={isGeneratingText}
				>
					<Ionicons
						name={showTagsEditor ? 'pricetags' : 'pricetags-outline'}
						size={16}
						color={getButtonColor(showTagsEditor)}
						style={{ marginRight: 4 }}
					/>
					<Text
						style={{
							fontSize: 14,
							color: getButtonColor(showTagsEditor),
							fontWeight: showTagsEditor ? '600' : '400',
						}}
					>
						Tags
					</Text>
				</TouchableOpacity>

				{/* Variant Creator Button */}
				<TouchableOpacity
					onPress={onShowVariantCreator}
					style={{
						flexDirection: 'row',
						alignItems: 'center',
						paddingHorizontal: 12,
						paddingVertical: 6,
						borderRadius: 6,
						backgroundColor: isDark ? '#7c3aed' : '#8b5cf6',
						opacity: isGeneratingText ? 0.5 : 1,
					}}
					disabled={isGeneratingText}
				>
					<Ionicons name="sparkles" size={16} color="#ffffff" style={{ marginRight: 4 }} />
					<Text
						style={{
							fontSize: 14,
							color: '#ffffff',
							fontWeight: '500',
						}}
					>
						AI
					</Text>
				</TouchableOpacity>
			</View>
		</View>
	);
};

/**
 * Keyboard Shortcuts Info Component
 * Zeigt verfügbare Tastenkürzel an
 */
export const KeyboardShortcutsInfo: React.FC = () => {
	const { isDark } = useTheme();

	if (Platform.OS !== 'web') {
		return null;
	}

	return (
		<View
			style={{
				paddingHorizontal: 16,
				paddingVertical: 8,
				backgroundColor: isDark ? '#374151' : '#f3f4f6',
				borderBottomWidth: 1,
				borderBottomColor: isDark ? '#4b5563' : '#e5e7eb',
			}}
		>
			<Text
				style={{
					fontSize: 12,
					color: isDark ? '#9ca3af' : '#6b7280',
					textAlign: 'center',
				}}
			>
				Tastenkürzel: Strg+S (Speichern) • Strg+P (Vorschau) • Strg+K (Fokus)
			</Text>
		</View>
	);
};
