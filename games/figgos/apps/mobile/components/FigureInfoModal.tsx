import React, { useState } from 'react';
import { View, TouchableOpacity, Modal, ScrollView, Dimensions } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useTheme } from '~/utils/ThemeContext';
import { ThemedText, ThemedView } from './ThemedView';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface FigureInfoModalProps {
	visible: boolean;
	onClose: () => void;
	title: string;
	creator: string;
	activeTab: 'character' | 'item1' | 'item2' | 'item3';
	onTabChange: (tab: 'character' | 'item1' | 'item2' | 'item3') => void;
	characterInfo?: {
		character?: {
			description?: string;
			lore?: string;
		};
		items?: Array<{
			name?: string;
			description?: string;
			lore?: string;
		}>;
	};
}

export const FigureInfoModal: React.FC<FigureInfoModalProps> = ({
	visible,
	onClose,
	title,
	creator,
	activeTab,
	onTabChange,
	characterInfo,
}) => {
	const { theme, isDark } = useTheme();

	// Prüfen, ob Daten für die verschiedenen Tabs vorhanden sind
	const hasCharacter = !!characterInfo?.character?.description;
	const hasItems = !!characterInfo?.items && characterInfo.items.length > 0;
	const itemCount = hasItems ? Math.min(characterInfo!.items!.length, 3) : 0;

	// Rendere den Inhalt basierend auf dem aktiven Tab
	const renderContent = () => {
		if (activeTab === 'character' && hasCharacter) {
			return (
				<View className="p-[5px] mb-[10px]">
					<ThemedText className="text-[18px] font-bold mb-[10px]">Character</ThemedText>
					<ThemedText className="text-[15px] leading-[22px]">
						{characterInfo?.character?.description || 'No description available.'}
					</ThemedText>

					{characterInfo?.character?.lore && (
						<View className="mt-[15px]">
							<ThemedText className="text-[14px] font-bold mb-[5px] italic">Lore</ThemedText>
							<ThemedText className="text-[14px] italic leading-[20px]">
								{characterInfo.character.lore}
							</ThemedText>
						</View>
					)}
				</View>
			);
		} else if (activeTab.startsWith('item') && hasItems) {
			const itemIndex = parseInt(activeTab.replace('item', '')) - 1;
			if (itemIndex >= 0 && itemIndex < itemCount) {
				const item = characterInfo!.items![itemIndex];
				return (
					<View className="p-[5px] mb-[10px]">
						<ThemedText className="text-[18px] font-bold mb-[10px]">
							{item.name || `Item ${itemIndex + 1}`}
						</ThemedText>
						<ThemedText className="text-[15px] leading-[22px]">
							{item.description || 'No description available.'}
						</ThemedText>

						{item.lore && (
							<View className="mt-[15px]">
								<ThemedText className="text-[14px] font-bold mb-[5px] italic">Lore</ThemedText>
								<ThemedText className="text-[14px] italic leading-[20px]">{item.lore}</ThemedText>
							</View>
						)}
					</View>
				);
			}
		}

		return (
			<View className="p-[5px] mb-[10px]">
				<ThemedText className="text-[15px] leading-[22px]">No information available.</ThemedText>
			</View>
		);
	};

	return (
		<Modal visible={visible} transparent={true} animationType="fade" onRequestClose={onClose}>
			<TouchableOpacity
				className="flex-1 bg-transparent justify-start items-center pt-[150px]"
				activeOpacity={1}
				onPress={onClose}
			>
				<TouchableOpacity
					className={`w-[90%] max-w-[500px] h-[480px] rounded-2xl overflow-hidden relative shadow-md ${isDark ? 'bg-[#333333]' : 'bg-[#f0f0f0]'} ${activeTab === 'character' ? 'w-[70%] self-end' : activeTab.startsWith('item') ? 'w-[70%] self-start' : ''}`}
					activeOpacity={1}
					onPress={(e) => e.stopPropagation()}
				>
					{/* Header with title and creator */}
					<View className="pt-[25px] pb-[15px] px-5 items-center border-b border-b-[rgba(150,150,150,0.3)]">
						<ThemedText className="text-[22px] font-bold mb-[5px] text-center">{title}</ThemedText>
						<ThemedText className="text-[14px] opacity-70 text-center">by {creator}</ThemedText>
					</View>

					{/* Content area */}
					<ScrollView
						className="w-full max-h-[70%]"
						contentContainerClassName="p-5"
						showsVerticalScrollIndicator={true}
					>
						{renderContent()}
					</ScrollView>

					{/* Tab bar at the bottom */}
					<View
						className={`flex-row justify-around items-center h-[60px] border-t border-t-[rgba(150,150,150,0.3)] ${isDark ? 'bg-[#222222]' : 'bg-[#e0e0e0]'}`}
					>
						{/* Character Tab */}
						<TouchableOpacity
							className={`flex-1 h-full justify-center items-center py-[10px] ${activeTab === 'character' ? 'border-b-[3px]' : ''}`}
							style={activeTab === 'character' ? { borderBottomColor: theme.colors.primary } : {}}
							onPress={() => onTabChange('character')}
							disabled={!hasCharacter}
						>
							<FontAwesome
								name="user"
								size={20}
								color={activeTab === 'character' ? theme.colors.primary : theme.colors.text}
								style={{ opacity: hasCharacter ? 1 : 0.3 }}
							/>
							<ThemedText
								className={`text-[12px] mt-[4px] ${!hasCharacter ? 'opacity-30' : ''}`}
								style={
									activeTab === 'character'
										? { color: theme.colors.primary, fontWeight: 'bold' }
										: {}
								}
							>
								Character
							</ThemedText>
						</TouchableOpacity>

						{/* Item Tabs */}
						{[1, 2, 3].map((num) => (
							<TouchableOpacity
								key={`tab-item-${num}`}
								className={`flex-1 h-full justify-center items-center py-[10px] ${activeTab === `item${num}` ? 'border-b-[3px]' : ''}`}
								style={
									activeTab === `item${num}` ? { borderBottomColor: theme.colors.primary } : {}
								}
								onPress={() =>
									itemCount >= num && onTabChange(`item${num}` as 'item1' | 'item2' | 'item3')
								}
								disabled={itemCount < num}
							>
								<FontAwesome
									name="cube"
									size={20}
									color={activeTab === `item${num}` ? theme.colors.primary : theme.colors.text}
									style={{ opacity: itemCount >= num ? 1 : 0.3 }}
								/>
								<ThemedText
									className={`text-[12px] mt-[4px] ${itemCount < num ? 'opacity-30' : ''}`}
									style={
										activeTab === `item${num}`
											? { color: theme.colors.primary, fontWeight: 'bold' }
											: {}
									}
								>
									Item {num}
								</ThemedText>
							</TouchableOpacity>
						))}
					</View>
				</TouchableOpacity>
			</TouchableOpacity>
		</Modal>
	);
};
