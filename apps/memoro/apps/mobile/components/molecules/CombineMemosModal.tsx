import React, { useState, useEffect } from 'react';
import { View, FlatList, Pressable } from 'react-native';
import { useTranslation } from 'react-i18next';
import '~/features/i18n'; // Ensure i18n is loaded
import { useTheme } from '~/features/theme/ThemeProvider';
import BaseModal from '~/components/atoms/BaseModal';
import Text from '~/components/atoms/Text';
import Icon from '~/components/atoms/Icon';
import LoadingOverlay from '~/components/atoms/LoadingOverlay';
import { getAuthenticatedClient } from '~/features/auth/lib/supabaseClient';
import { creditService } from '~/features/credits/creditService';
import ManaIcon from '~/features/subscription/ManaIcon';
import themeColors from '~/tailwind.config.js';

interface Blueprint {
	id: string;
	name: {
		de?: string;
		en?: string;
	};
	description?: {
		de?: string;
		en?: string;
	};
	category?: {
		id: string;
		name: {
			de?: string;
			en?: string;
		};
		description?: {
			de?: string;
			en?: string;
		};
		style?: { color?: string; [key: string]: any };
	};
	is_public: boolean;
	created_at: string;
	updated_at: string;
	user_id: string;
}

interface CombineMemosModalProps {
	isVisible: boolean;
	onClose: () => void;
	selectedMemoIds: string[];
	onCombine: (blueprintId: string, prompt?: string) => void;
}

export default function CombineMemosModal({
	isVisible,
	onClose,
	selectedMemoIds,
	onCombine,
}: CombineMemosModalProps) {
	const { t, i18n } = useTranslation();
	const { isDark, themeVariant } = useTheme();
	const [blueprints, setBlueprints] = useState<Blueprint[]>([]);
	const [selectedBlueprint, setSelectedBlueprint] = useState<Blueprint | null>(null);
	const [loading, setLoading] = useState(false);
	const [isSubmitting, setIsSubmitting] = useState(false);

	// Theme colors
	const backgroundColor = isDark
		? themeColors?.colors?.dark?.[themeVariant]?.surface || '#1a1a1a'
		: themeColors?.colors?.[themeVariant]?.surface || '#ffffff';

	const textColor = isDark
		? themeColors?.colors?.dark?.[themeVariant]?.onSurface || '#ffffff'
		: themeColors?.colors?.[themeVariant]?.onSurface || '#000000';

	const surfaceVariantColor = isDark
		? themeColors?.colors?.dark?.[themeVariant]?.surfaceVariant || '#2a2a2a'
		: themeColors?.colors?.[themeVariant]?.surfaceVariant || '#f5f5f5';

	useEffect(() => {
		if (isVisible) {
			fetchBlueprints();
			// Preload pricing in background
			creditService.getPricing().catch(console.error);
			// Vorselektiere "Transkripte kombinieren"
			setSelectedBlueprint({
				id: 'transcript_only',
				name: { de: 'Transkripte kombinieren', en: 'Combine Transcripts' },
				description: {
					de: 'Kombiniert nur die Transkripte ohne AI-Verarbeitung',
					en: 'Combines only transcripts without AI processing',
				},
				is_public: true,
				created_at: new Date().toISOString(),
				updated_at: new Date().toISOString(),
				user_id: 'system',
				category: undefined,
			});
		}
	}, [isVisible]);

	const fetchBlueprints = async () => {
		setLoading(true);
		try {
			const supabase = await getAuthenticatedClient();

			if (!supabase) {
				console.error('No authenticated Supabase client available');
				return;
			}

			console.debug('Fetching public blueprints...');

			const { data, error } = await supabase
				.from('blueprints')
				.select('id, name, description, is_public, created_at, updated_at, user_id, category')
				.eq('is_public', true)
				.order('created_at', { ascending: false });

			console.log('Blueprints data:', data);
			console.log('Blueprints error:', error);

			if (error) {
				console.error('Error fetching blueprints:', error);
				return;
			}

			// Hardcodierte Blueprints hinzufügen
			const hardcodedBlueprints: Blueprint[] = [
				{
					id: 'transcript_only',
					name: { de: 'Transkripte kombinieren', en: 'Combine Transcripts' },
					description: {
						de: 'Kombiniert nur die Transkripte ohne AI-Verarbeitung',
						en: 'Combines only transcripts without AI processing',
					},
					is_public: true,
					created_at: new Date().toISOString(),
					updated_at: new Date().toISOString(),
					user_id: 'system',
					category: undefined,
				},
			];

			const allBlueprints = [...hardcodedBlueprints, ...(data || [])];
			setBlueprints(allBlueprints);
			console.log(
				'Blueprints set:',
				allBlueprints?.length || 0,
				'items (',
				hardcodedBlueprints.length,
				'hardcoded +',
				data?.length || 0,
				'from DB)'
			);
		} catch (error) {
			console.error('Error fetching blueprints:', error);
		} finally {
			setLoading(false);
		}
	};

	const handleBlueprintSelect = (blueprint: Blueprint) => {
		setSelectedBlueprint(selectedBlueprint?.id === blueprint.id ? null : blueprint);
	};

	const handleSubmit = async (prompt?: string) => {
		if (!selectedBlueprint) return;

		setIsSubmitting(true);
		try {
			await onCombine(selectedBlueprint.id, prompt);
			onClose();
			setSelectedBlueprint(null); // Reset selection
		} catch (error) {
			console.error('Error combining memos:', error);
		} finally {
			setIsSubmitting(false);
		}
	};

	const currentLanguage = i18n.language.startsWith('de') ? 'de' : 'en';

	const renderBlueprintItem = ({ item }: { item: Blueprint }) => {
		console.log('Rendering blueprint item:', item.id, item.name);
		const displayName =
			item.name?.[currentLanguage] || item.name?.en || item.name?.de || 'Unnamed Blueprint';
		const displayDescription =
			item.description?.[currentLanguage] || item.description?.en || item.description?.de || '';
		const isSelected = selectedBlueprint?.id === item.id;

		console.log('Display name:', displayName, 'Description:', displayDescription);

		return (
			<Pressable
				onPress={() => handleBlueprintSelect(item)}
				style={{
					marginBottom: 12,
					padding: 16,
					borderRadius: 12,
					borderWidth: 2,
					minHeight: 80,
					backgroundColor: isSelected ? (isDark ? '#1e3a8a40' : '#3b82f640') : backgroundColor,
					borderColor: isSelected ? '#3b82f6' : isDark ? '#404040' : '#e5e5e5',
				}}
			>
				<View style={{ position: 'relative' }}>
					<View style={{ paddingRight: 40 }}>
						<Text
							style={{
								fontSize: 18,
								fontWeight: '600',
								marginBottom: 8,
								color: textColor,
							}}
						>
							{displayName}
						</Text>
						{displayDescription && (
							<Text
								style={{
									fontSize: 14,
									color: textColor,
									opacity: 0.7,
									lineHeight: 20,
								}}
							>
								{displayDescription}
							</Text>
						)}
					</View>
					{isSelected && (
						<View
							style={{
								position: 'absolute',
								top: 0,
								right: 0,
								justifyContent: 'center',
								alignItems: 'center',
								width: 32,
								height: 32,
							}}
						>
							<Icon name="checkmark-circle" size={24} color="#3b82f6" />
						</View>
					)}
				</View>
			</Pressable>
		);
	};

	const handlePrimaryAction = () => {
		if (selectedBlueprint) {
			handleSubmit();
		}
	};

	// Fallback translations if i18n is not ready
	const title = t('memo.combine_memos', 'Memos kombinieren');
	const combineButtonText = t('memo.combine', 'Kombinieren');
	const cancelButtonText = t('common.cancel', 'Abbrechen');

	return (
		<BaseModal
			isVisible={isVisible}
			onClose={onClose}
			title={title}
			primaryButtonText={combineButtonText}
			secondaryButtonText={cancelButtonText}
			onPrimaryButtonPress={handlePrimaryAction}
			onSecondaryButtonPress={onClose}
			primaryButtonDisabled={!selectedBlueprint || isSubmitting}
			primaryButtonLoading={isSubmitting}
		>
			<View style={{ height: 400, minHeight: 400, marginTop: -24, marginHorizontal: -20 }}>
				{/* Mana cost display */}
				{selectedMemoIds.length > 0 && (
					<View>
						<View
							style={{
								flexDirection: 'row',
								alignItems: 'center',
								justifyContent: 'flex-start',
								marginHorizontal: 20,
								marginTop: 12,
								marginBottom: 4,
							}}
						>
							<ManaIcon size={16} color="#0099FF" />
							<Text
								style={{
									marginLeft: 6,
									fontSize: 14,
									fontWeight: '600',
									color: '#0099FF',
								}}
							>
								{creditService.calculateMemoCombineCostSync(selectedMemoIds.length)}
							</Text>
							<Text
								style={{
									marginLeft: 4,
									fontSize: 14,
									fontWeight: '600',
									color: '#0099FF',
								}}
							>
								Mana
							</Text>
							<Text
								style={{
									marginLeft: 4,
									fontSize: 14,
									color: isDark ? '#888' : '#666',
								}}
							>
								({selectedMemoIds.length} × {creditService.getOperationCostSync('MEMO_COMBINE')})
							</Text>
						</View>
						<View
							style={{
								height: 1,
								backgroundColor: isDark ? '#444444' : '#DDDDDD',
								marginVertical: 4,
							}}
						/>
					</View>
				)}

				{/* Blueprint list */}
				<View style={{ flex: 1 }}>
					{loading ? (
						<View
							style={{
								flex: 1,
								justifyContent: 'center',
								alignItems: 'center',
								paddingHorizontal: 20,
							}}
						>
							<Text style={{ color: textColor }}>{t('common.loading', 'Wird geladen')}...</Text>
						</View>
					) : blueprints.length === 0 ? (
						<View
							style={{
								flex: 1,
								justifyContent: 'center',
								alignItems: 'center',
								paddingHorizontal: 20,
							}}
						>
							<Text style={{ color: textColor }}>
								{t('blueprints.no_blueprints', 'Keine Blueprints verfügbar')}
							</Text>
						</View>
					) : (
						<FlatList
							data={blueprints}
							renderItem={renderBlueprintItem}
							keyExtractor={(item) => item.id}
							showsVerticalScrollIndicator={true}
							style={{ flex: 1 }}
							contentContainerStyle={{ paddingBottom: 16, paddingTop: 8, paddingHorizontal: 20 }}
						/>
					)}
				</View>
			</View>

			<LoadingOverlay
				visible={isSubmitting}
				message={t('memo.combining', 'Kombiniere...')}
				modal={false}
			/>
		</BaseModal>
	);
}
