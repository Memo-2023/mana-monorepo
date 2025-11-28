import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import {
	View,
	Text,
	FlatList,
	Dimensions,
	Pressable,
	Modal,
	Alert,
	ScrollView,
	TouchableOpacity,
} from 'react-native';
import { useQuotesStore, EnhancedQuote } from '~/store/quotesStore';
import { useListStore, List } from '~/store/listStore';
import { useEffect, useState } from 'react';
import { Icon } from '~/components/Icon';
import * as Haptics from 'expo-haptics';
import { Host, Picker } from '@expo/ui/swift-ui';
import { useIsDarkMode } from '~/store/settingsStore';
import QuoteCard from '~/components/QuoteCard';
import Animated, {
	FadeInRight,
	FadeInDown,
	FadeOutUp,
	useAnimatedScrollHandler,
	useSharedValue,
} from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import DraggableFlatList, {
	ScaleDecorator,
	RenderItemParams,
} from 'react-native-draggable-flatlist';
import { LIST_ITEM_CLASSES, LIST_CONTAINER_PADDING } from '~/constants/layout';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

const { width: screenWidth } = Dimensions.get('window');

const AnimatedFlatList = Animated.createAnimatedComponent(FlatList);

export default function ListDetail() {
	const router = useRouter();
	const { id } = useLocalSearchParams();
	const { t } = useTranslation();
	const isDarkMode = useIsDarkMode();
	const [isEditing, setIsEditing] = useState(false);
	const [viewMode, setViewMode] = useState<'card' | 'list'>('list');
	const scrollY = useSharedValue(0);

	const { quotes, toggleFavorite, initializeStore } = useQuotesStore();

	const { getList, getListQuotes, removeQuoteFromList, reorderListItems, updateList, sortList } =
		useListStore();

	const [list, setList] = useState<List | undefined>(undefined);
	const [listQuotes, setListQuotes] = useState<EnhancedQuote[]>([]);

	useEffect(() => {
		initializeStore();
	}, []);

	useEffect(() => {
		if (id && quotes.length > 0) {
			const pl = getList(id as string);
			setList(pl);
			if (pl) {
				const pQuotes = getListQuotes(pl.id, quotes);
				setListQuotes(pQuotes);
			}
		}
	}, [id, quotes, getList, getListQuotes]);

	const scrollHandler = useAnimatedScrollHandler({
		onScroll: (event) => {
			scrollY.value = event.contentOffset.y;
		},
	});

	const handleRemoveQuote = (quoteId: string) => {
		Alert.alert(t('lists.removeQuote'), t('lists.removeQuoteConfirm'), [
			{ text: t('common.cancel'), style: 'cancel' },
			{
				text: t('common.delete'),
				style: 'destructive',
				onPress: () => {
					if (list) {
						removeQuoteFromList(list.id, quoteId);
						const updatedQuotes = listQuotes.filter((q) => q.id !== quoteId);
						setListQuotes(updatedQuotes);
						Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
					}
				},
			},
		]);
	};

	const handleSortChange = (sortMode: List['sortMode']) => {
		if (!list) return;

		sortList(list.id, sortMode);
		updateList(list.id, { sortMode });

		// Reload quotes with new sort
		const pl = getList(list.id);
		if (pl) {
			const pQuotes = getListQuotes(pl.id, quotes);
			setListQuotes(pQuotes);
			setList(pl);
		}

		Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
	};

	const handleDragEnd = ({ data }) => {
		if (!list) return;

		// Update positions based on new order
		data.forEach((quote, index) => {
			const itemIndex = list.items.findIndex((item) => item.quoteId === quote.id);
			if (itemIndex !== -1) {
				reorderListItems(list.id, itemIndex, index);
			}
		});

		setListQuotes(data);
		Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
	};

	const renderQuote = ({ item, index }) => {
		if (viewMode === 'card') {
			const CARD_HEIGHT = Dimensions.get('window').height - 250;
			return (
				<View style={{ position: 'relative', width: '100%' }}>
					<QuoteCard
						quote={item}
						variant="vertical"
						index={index}
						scrollY={scrollY}
						cardHeight={CARD_HEIGHT}
						onToggleFavorite={toggleFavorite}
						onAuthorPress={() => {
							if (item?.authorId) {
								router.push(`/author/${item.authorId}`);
							} else if (item?.author?.id) {
								router.push(`/author/${item.author.id}`);
							}
						}}
						onDelete={isEditing ? () => handleRemoveQuote(item.id) : undefined}
					/>
				</View>
			);
		}

		return (
			<View className="mb-5">
				<QuoteCard
					quote={item}
					onToggleFavorite={toggleFavorite}
					onAuthorPress={() => {
						if (item?.authorId) {
							router.push(`/author/${item.authorId}`);
						} else if (item?.author?.id) {
							router.push(`/author/${item.author.id}`);
						}
					}}
					onDelete={isEditing ? () => handleRemoveQuote(item.id) : undefined}
				/>
			</View>
		);
	};

	const renderDraggableQuote = ({ item, drag, isActive }: RenderItemParams<EnhancedQuote>) => {
		return (
			<ScaleDecorator>
				<Pressable
					onLongPress={drag}
					disabled={!isEditing}
					className={`${isDarkMode ? 'bg-white/10' : 'bg-black/10'} rounded-2xl p-4 ${LIST_ITEM_CLASSES.wrapper} ${
						isActive ? 'opacity-80' : ''
					}`}
				>
					<View className="flex-row items-center">
						{isEditing && (
							<Icon
								name="reorder-three"
								size={24}
								color={isDarkMode ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)'}
							/>
						)}
						<View className="flex-1 ml-3">
							<Text
								className={`${isDarkMode ? 'text-white' : 'text-black'} text-base`}
								numberOfLines={2}
							>
								{item.text}
							</Text>
							<Text className={`${isDarkMode ? 'text-white/60' : 'text-black/60'} text-sm mt-1`}>
								{item.author?.name}
							</Text>
						</View>
						{isEditing && (
							<Pressable onPress={() => handleRemoveQuote(item.id)} className="ml-3">
								<Icon
									name="close-circle"
									size={24}
									color={isDarkMode ? 'rgba(255,0,0,0.6)' : 'rgba(255,0,0,0.6)'}
								/>
							</Pressable>
						)}
					</View>
				</Pressable>
			</ScaleDecorator>
		);
	};

	if (!list) {
		return (
			<View
				className={`flex-1 ${isDarkMode ? 'bg-black' : 'bg-white'} justify-center items-center`}
			>
				<Text className={isDarkMode ? 'text-white' : 'text-black'}>Liste nicht gefunden</Text>
			</View>
		);
	}

	return (
		<GestureHandlerRootView style={{ flex: 1 }}>
			<Stack.Screen
				options={{
					title: list.name,
					headerShown: true,
					headerTransparent: true,
					headerBlurEffect: isDarkMode ? 'dark' : 'light',
					headerStyle: {
						backgroundColor: 'transparent',
					},
					headerTintColor: isDarkMode ? '#ffffff' : '#000000',
					headerShadowVisible: false,
					headerBackTitle: t('lists.lists'),
					headerRight: () => (
						<View style={{ flexDirection: 'row', alignItems: 'center' }}>
							<TouchableOpacity
								onPress={() => {
									Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
									setViewMode(viewMode === 'card' ? 'list' : 'card');
								}}
								style={{
									justifyContent: 'center',
									alignItems: 'center',
									width: 44,
									height: 44,
									marginTop: -4,
								}}
							>
								<Icon
									name={viewMode === 'list' ? 'grid-outline' : 'list-outline'}
									size={24}
									color={isDarkMode ? '#ffffff' : '#000000'}
								/>
							</TouchableOpacity>
							<TouchableOpacity
								onPress={() => setIsEditing(!isEditing)}
								style={{
									justifyContent: 'center',
									alignItems: 'center',
									width: 44,
									height: 44,
									marginTop: -4,
								}}
							>
								<Icon
									name={isEditing ? 'checkmark-circle' : 'create-outline'}
									size={24}
									color={isDarkMode ? '#ffffff' : '#000000'}
								/>
							</TouchableOpacity>
						</View>
					),
					headerRightContainerStyle: {
						paddingRight: 16,
					},
				}}
			/>
			<View className={`flex-1 ${isDarkMode ? 'bg-black' : 'bg-white'}`}>
				{/* Content */}
				{listQuotes.length === 0 ? (
					<View className="flex-1 justify-center items-center px-6" style={{ paddingTop: 100 }}>
						<Icon
							name="book-outline"
							size={64}
							color={isDarkMode ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)'}
						/>
						<Text
							className={`${isDarkMode ? 'text-white/60' : 'text-black/60'} text-lg mt-4 text-center font-semibold`}
						>
							{t('lists.noQuotesInList')}
						</Text>
						<Text
							className={`${isDarkMode ? 'text-white/40' : 'text-black/40'} text-sm mt-2 text-center`}
						>
							{t('lists.emptyListHint')}
						</Text>
					</View>
				) : isEditing && list.sortMode === 'manual' ? (
					<DraggableFlatList
						data={listQuotes}
						onDragEnd={handleDragEnd}
						keyExtractor={(item) => item.id}
						renderItem={renderDraggableQuote}
						showsVerticalScrollIndicator={false}
						contentContainerStyle={{
							paddingBottom: LIST_CONTAINER_PADDING.bottom,
							paddingTop: LIST_CONTAINER_PADDING.top,
						}}
					/>
				) : (
					<AnimatedFlatList
						data={listQuotes}
						renderItem={renderQuote}
						keyExtractor={(item) => item.id}
						showsVerticalScrollIndicator={false}
						onScroll={scrollHandler}
						scrollEventThrottle={16}
						contentContainerStyle={{
							paddingTop: LIST_CONTAINER_PADDING.top,
							paddingBottom: viewMode === 'list' ? LIST_CONTAINER_PADDING.bottom : 100,
						}}
						pagingEnabled={viewMode === 'card'}
						snapToInterval={viewMode === 'card' ? Dimensions.get('window').height - 250 : undefined}
						snapToAlignment={viewMode === 'card' ? 'start' : undefined}
						decelerationRate={viewMode === 'card' ? 'fast' : 'normal'}
					/>
				)}

				{/* Segmented Control at bottom */}
				{!isEditing && list.sortMode && (
					<View className="absolute bottom-0 left-0 right-0 pb-28 px-4">
						<Host matchContents style={{ width: '100%' }}>
							<Picker
								options={['Manuell', 'A-Z', 'Autor', 'Datum', 'Zufällig']}
								selectedIndex={['manual', 'alphabetical', 'author', 'date', 'random'].indexOf(
									list.sortMode
								)}
								onOptionSelected={({ nativeEvent: { index } }) => {
									const modes: List['sortMode'][] = [
										'manual',
										'alphabetical',
										'author',
										'date',
										'random',
									];
									handleSortChange(modes[index]);
								}}
								variant="segmented"
							/>
						</Host>
					</View>
				)}
			</View>
		</GestureHandlerRootView>
	);
}
