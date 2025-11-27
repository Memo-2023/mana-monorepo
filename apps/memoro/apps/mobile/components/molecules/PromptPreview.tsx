import React from 'react';
import { View, Pressable, Platform } from 'react-native';
import { useTheme } from '~/features/theme/ThemeProvider';
import Text from '~/components/atoms/Text';
import Icon from '~/components/atoms/Icon';
import colors from '~/tailwind.config.js';
import { useTranslation } from 'react-i18next';
import { getTheme } from '~/features/theme/constants';

// @expo/ui ContextMenu - use appropriate platform import
import {
	ContextMenu as ContextMenuiOS,
	Button as ButtoniOS,
	Host as HostiOS,
} from '@expo/ui/swift-ui';
import {
	ContextMenu as ContextMenuAndroid,
	Button as ButtonAndroid,
} from '@expo/ui/jetpack-compose';

// Select the correct components based on platform
const ContextMenu = Platform.OS === 'ios' ? ContextMenuiOS : ContextMenuAndroid;
const ExpoButton = Platform.OS === 'ios' ? ButtoniOS : ButtonAndroid;
const Host = Platform.OS === 'ios' ? HostiOS : View;

interface Blueprint {
	id: string;
	name: {
		[key: string]: string;
	};
	color?: string;
}

interface PromptModel {
	id: string;
	prompt_text: {
		[key: string]: string;
	};
	memory_title: {
		[key: string]: string;
	};
	created_at: string;
	updated_at: string;
	blueprints?: Blueprint[];
	is_public?: boolean;
}

interface PromptPreviewProps {
	prompt: PromptModel;
	onPress?: () => void;
	onShare?: () => void;
	onCopy?: () => void;
	isLoading?: boolean;
	isSelected?: boolean;
	disableContextMenu?: boolean;
}

/**
 * PromptPreviewSkeleton-Komponente
 *
 * Zeigt einen einfachen Skeleton-Loader für die PromptPreview-Komponente an.
 */
const PromptPreviewSkeleton: React.FC<{ isDark: boolean; themeVariant: string }> = ({
	isDark,
	themeVariant,
}) => {
	// Container-Style mit Hintergrundfarbe aus der Tailwind-Konfiguration
	const getContainerStyle = () => {
		// Direkter Zugriff auf die Farben aus der Tailwind-Konfiguration
		const backgroundColor = isDark
			? (colors as any).theme?.extend?.colors?.dark?.[themeVariant]?.contentBackground || '#1E1E1E'
			: (colors as any).theme?.extend?.colors?.[themeVariant]?.contentBackground || '#FFFFFF';

		return {
			backgroundColor,
			borderRadius: 12,
			height: 140,
			padding: 16,
			marginLeft: 16,
			marginRight: 16,
			flexShrink: 0,
		};
	};

	return <View style={getContainerStyle()} />;
};

/**
 * PromptPreview-Komponente
 *
 * Zeigt eine Vorschau eines Prompts mit Titel, Text und verknüpften Blueprints an.
 */
const PromptPreview: React.FC<PromptPreviewProps> = ({
	prompt,
	onPress,
	onShare,
	onCopy,
	isLoading = false,
	isSelected = false,
	disableContextMenu = false,
}) => {
	const { isDark, themeVariant, colorScheme, colors: themeColors } = useTheme();
	const theme = getTheme(colorScheme, themeVariant);
	const { i18n } = useTranslation();
	const currentLanguage = i18n.language || 'en';

	// Icon-Farbe basierend auf Theme (weiß im Dark Mode, dunkel im Light Mode)
	const iconColor = '#AEAEB2'; // Light gray icon color for both light and dark mode

	// Wenn das Laden aktiv ist, zeige den Skeleton-Loader an
	if (isLoading) {
		return <PromptPreviewSkeleton isDark={isDark} themeVariant={themeVariant} />;
	}

	// Extrahiere den Titel und Text in der aktuellen Sprache
	const title = prompt.memory_title?.[currentLanguage] || prompt.memory_title?.en || '';
	const promptText = prompt.prompt_text?.[currentLanguage] || prompt.prompt_text?.en || '';

	// Formatiere das Datum
	const formattedDate = new Date(prompt.created_at).toLocaleDateString(currentLanguage, {
		year: 'numeric',
		month: 'short',
		day: 'numeric',
	});

	// Container-Style mit Hintergrundfarbe aus der Tailwind-Konfiguration
	const getContainerStyle = () => {
		// Direkter Zugriff auf die Farben aus der Tailwind-Konfiguration
		const backgroundColor = isDark
			? (colors as any).theme?.extend?.colors?.dark?.[themeVariant]?.contentBackground || '#1E1E1E'
			: (colors as any).theme?.extend?.colors?.[themeVariant]?.contentBackground || '#FFFFFF';

		// Keep original background color regardless of selection

		return {
			backgroundColor,
			borderRadius: 12,
			padding: 16,
			flexShrink: 0,
			overflow: 'visible',
			shadowColor: isDark ? 'rgba(0, 0, 0, 0.3)' : 'rgba(0, 0, 0, 0.1)',
			shadowOffset: { width: 0, height: 2 },
			shadowOpacity: 0.8,
			shadowRadius: 2,
			elevation: 2,
		};
	};

	// Text-Style basierend auf dem Theme
	const getTextStyle = (isTitle = false) => {
		const textColor = isDark ? '#FFFFFF' : '#000000';

		return {
			color: textColor,
			fontSize: isTitle ? 16 : 14,
			fontWeight: isTitle ? 'bold' : ('normal' as 'bold' | 'normal'),
			marginBottom: isTitle ? 8 : 4,
		};
	};

	// Menu items
	const menuItems = [
		{
			key: 'copy',
			title: 'Kopieren',
			systemIcon: 'doc.on.doc',
			onSelect: onCopy,
		},
		{
			key: 'share',
			title: 'Teilen',
			systemIcon: 'square.and.arrow.up',
			onSelect: onShare,
		},
	];

	// Render-Funktion für die Blueprints-Liste
	const renderBlueprints = () => {
		if (!prompt.blueprints || prompt.blueprints.length === 0) {
			return null;
		}

		return (
			<View style={{ marginTop: 8 }}>
				<Text style={{ fontSize: 14, color: isDark ? '#AAAAAA' : '#666666' }}>
					{prompt.blueprints
						.map((blueprint) => blueprint.name?.[currentLanguage] || blueprint.name?.en || '')
						.join(', ')}
				</Text>
			</View>
		);
	};

	// Hauptinhalt der Komponente
	const content = (
		<View style={getContainerStyle()}>
			{/* Checkmark für ausgewählte Elemente */}
			{isSelected && (
				<View
					style={{
						position: 'absolute',
						top: -8,
						right: -8,
						backgroundColor: theme.colors.primary,
						borderRadius: 12,
						width: 24,
						height: 24,
						alignItems: 'center',
						justifyContent: 'center',
						zIndex: 1,
					}}
				>
					<Icon name="checkmark" size={16} color={theme.colors.textOnPrimary} />
				</View>
			)}

			<View style={{ marginBottom: 4 }}>
				<Text style={getTextStyle(true)}>{title}</Text>
			</View>

			<Text style={[getTextStyle(), { marginBottom: 8 }]} numberOfLines={2}>
				{promptText}
			</Text>

			{renderBlueprints()}
		</View>
	);

	// Wenn Kontextmenü deaktiviert ist, verwende einfaches Pressable
	if (disableContextMenu) {
		return <Pressable onPress={onPress}>{content}</Pressable>;
	}

	// Verwende @expo/ui ContextMenu
	return (
		<Host>
			<ContextMenu>
				<ContextMenu.Items>
					{menuItems.map((item) => (
						<ExpoButton
							key={item.key}
							{...(Platform.OS === 'ios' && { systemImage: item.systemIcon })}
							onPress={item.onSelect}
						>
							{item.title}
						</ExpoButton>
					))}
				</ContextMenu.Items>

				<ContextMenu.Trigger>
					<Pressable onPress={onPress}>{content}</Pressable>
				</ContextMenu.Trigger>
			</ContextMenu>
		</Host>
	);
};

export default PromptPreview;
