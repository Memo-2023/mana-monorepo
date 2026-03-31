import React from 'react';
import { View, Pressable } from 'react-native';
import { useTheme } from '~/features/theme/ThemeProvider';
import Text from '~/components/atoms/Text';
import Icon from '~/components/atoms/Icon';
import CustomMenu from '~/components/atoms/CustomMenu';
import colors from '~/tailwind.config.js';
import { useTranslation } from 'react-i18next';
import { getTheme } from '~/features/theme/constants';

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

const PromptPreviewSkeleton: React.FC<{ isDark: boolean; themeVariant: string }> = ({
	isDark,
	themeVariant,
}) => {
	const backgroundColor = isDark
		? (colors as any).theme?.extend?.colors?.dark?.[themeVariant]?.contentBackground || '#1E1E1E'
		: (colors as any).theme?.extend?.colors?.[themeVariant]?.contentBackground || '#FFFFFF';

	return (
		<View
			style={{
				backgroundColor,
				borderRadius: 12,
				height: 140,
				padding: 16,
				marginLeft: 16,
				marginRight: 16,
				flexShrink: 0,
			}}
		/>
	);
};

const PromptPreview: React.FC<PromptPreviewProps> = ({
	prompt,
	onPress,
	onShare,
	onCopy,
	isLoading = false,
	isSelected = false,
	disableContextMenu = false,
}) => {
	const { isDark, themeVariant, colorScheme } = useTheme();
	const theme = getTheme(colorScheme, themeVariant);
	const { t, i18n } = useTranslation();
	const currentLanguage = i18n.language || 'en';

	if (isLoading) {
		return <PromptPreviewSkeleton isDark={isDark} themeVariant={themeVariant} />;
	}

	const title = prompt.memory_title?.[currentLanguage] || prompt.memory_title?.en || '';
	const promptText = prompt.prompt_text?.[currentLanguage] || prompt.prompt_text?.en || '';

	const backgroundColor = isDark
		? (colors as any).theme?.extend?.colors?.dark?.[themeVariant]?.contentBackground || '#1E1E1E'
		: (colors as any).theme?.extend?.colors?.[themeVariant]?.contentBackground || '#FFFFFF';

	const textColor = isDark ? '#FFFFFF' : '#000000';

	const menuItems = [
		{
			key: 'copy',
			title: t('common.copy', 'Kopieren'),
			iconName: 'copy-outline',
			onSelect: onCopy,
		},
		{
			key: 'share',
			title: t('common.share', 'Teilen'),
			iconName: 'share-outline',
			onSelect: onShare,
		},
	];

	const renderBlueprints = () => {
		if (!prompt.blueprints || prompt.blueprints.length === 0) return null;
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

	const content = (
		<View
			style={{
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
			}}
		>
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
				<Text style={{ color: textColor, fontSize: 16, fontWeight: 'bold', marginBottom: 8 }}>
					{title}
				</Text>
			</View>

			<Text style={{ color: textColor, fontSize: 14, marginBottom: 8 }} numberOfLines={2}>
				{promptText}
			</Text>

			{renderBlueprints()}
		</View>
	);

	if (disableContextMenu) {
		return <Pressable onPress={onPress}>{content}</Pressable>;
	}

	return (
		<CustomMenu items={menuItems} trigger="longpress">
			<Pressable onPress={onPress}>{content}</Pressable>
		</CustomMenu>
	);
};

export default PromptPreview;
