import { Stack, useRouter } from 'expo-router';
import { View, Text, FlatList, Pressable, TextInput, ScrollView, Alert, TouchableOpacity, Dimensions } from 'react-native';
import { useListStore, LIST_COLORS, List } from '~/store/listStore';
import React, { useEffect, useState } from 'react';
import { Icon } from '~/components/Icon';
import * as Haptics from 'expo-haptics';
import usePremiumStore from '~/store/premiumStore';
import { useListCreation } from '~/hooks/useListCreation';
import { PremiumLimitDialog } from '~/components/PremiumLimitDialog';
import { useIsDarkMode } from '~/store/settingsStore';
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  runOnJS,
  useAnimatedScrollHandler,
  interpolate,
  Extrapolate
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { LIST_ITEM_CLASSES, LIST_CONTAINER_PADDING } from '~/constants/layout';
import { useTranslation } from 'react-i18next';
import { GlassFAB } from '~/components/common/GlassFAB';
import { useTheme } from '~/hooks/useTheme';

const AnimatedFlatList = Animated.createAnimatedComponent(FlatList);
const { height: screenHeight } = Dimensions.get('window');

export default function Liste() {
  const router = useRouter();
  const isDarkMode = useIsDarkMode();
  const { colors } = useTheme();
  const { t } = useTranslation();
  const [viewMode, setViewMode] = useState<'card' | 'list'>('list');
  const scrollY = useSharedValue(0);
  const [showLimitDialog, setShowLimitDialog] = useState(false);
  
  // Premium store
  const { canCreateCollection, getRemainingCollections, MAX_WEEKLY_COLLECTIONS } = usePremiumStore();
  
  // Inline list creation state
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [newListData, setNewListData] = useState({
    name: '',
    description: '',
    color: LIST_COLORS[0]
  });
  
  const newListScale = useSharedValue(0.98);
  const newListOpacity = useSharedValue(0);

  const {
    lists,
    initializeLists,
    updateList,
    deleteList,
    duplicateList,
    getListStats
  } = useListStore();

  const { createList, canCreateList } = useListCreation();

  useEffect(() => {
    initializeLists();
  }, []);

  // Inline list creation functions
  const startInlineCreation = () => {
    // Check if user can create list
    if (!canCreateList()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      setShowLimitDialog(true);
      return;
    }

    setNewListData({
      name: '',
      description: '',
      color: LIST_COLORS[Math.floor(Math.random() * LIST_COLORS.length)]
    });
    setIsCreatingNew(true);

    // Animate new list appearance - very subtle
    newListScale.value = withSpring(1, { damping: 25, stiffness: 300, mass: 0.8 });
    newListOpacity.value = withTiming(1, { duration: 100 });

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };
  
  const handleInlineNameChange = (name: string) => {
    setNewListData(prev => ({ ...prev, name }));
  };
  
  const handleInlineDescriptionChange = (description: string) => {
    setNewListData(prev => ({ ...prev, description }));
  };
  
  const handleInlineColorChange = (color: string) => {
    setNewListData(prev => ({ ...prev, color }));
  };
  
  const saveInlineList = () => {
    if (!newListData.name.trim()) return;

    const result = createList(newListData.name, newListData.description, newListData.color);

    // Check if creation was successful
    if (!result.success) {
      setShowLimitDialog(true);
      return;
    }

    // Animate out and reset
    newListScale.value = withSpring(0.8, {}, () => {
      newListScale.value = withSpring(1);
    });

    setIsCreatingNew(false);
    setNewListData({
      name: '',
      description: '',
      color: LIST_COLORS[0]
    });

    // Reset animation values
    newListScale.value = 0.98;
    newListOpacity.value = 0;

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };
  
  // Helper function to reset state safely
  const resetCreationState = () => {
    setIsCreatingNew(false);
    setNewListData({
      name: '',
      description: '',
      color: LIST_COLORS[0]
    });
    // Reset animation values
    newListScale.value = 0.98;
    newListOpacity.value = 0;
  };

  const cancelInlineCreation = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    // Animate out before removing - subtle and fast
    newListScale.value = withTiming(0.95, { duration: 100 });
    newListOpacity.value = withTiming(0, { duration: 150 }, (finished) => {
      // Only reset if animation completed successfully
      if (finished) {
        runOnJS(resetCreationState)();
      }
    });
  };

  const handleDeleteList = (list: List) => {
    if (list.isDefault) {
      Alert.alert(t('lists.notice'), t('lists.cannotDeleteDefault'));
      return;
    }

    Alert.alert(
      t('lists.deleteList'),
      t('lists.deleteListConfirm', { name: list.name }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: () => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            deleteList(list.id);
          },
        },
      ]
    );
  };

  const handleDuplicateList = (list: List) => {
    const newName = `${list.name} (Kopie)`;
    duplicateList(list.id, newName);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  // Create empty list for inline creation
  const createEmptyList = React.useCallback((): List => ({
    id: 'new-list-temp',
    name: newListData.name,
    description: newListData.description,
    color: newListData.color,
    quoteIds: [],
    isDefault: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }), [newListData]);
  
  // Create display data including potential new list at top
  const displayLists = React.useMemo(() => {
    if (isCreatingNew) {
      const emptyList = createEmptyList();
      return [emptyList, ...lists];
    }
    return lists;
  }, [isCreatingNew, lists, createEmptyList]);

  // Calculate card height for vertical mode
  const TAB_BAR_HEIGHT = 80;
  const STATUS_BAR_HEIGHT = 44;
  const CARD_HEIGHT = screenHeight - STATUS_BAR_HEIGHT - TAB_BAR_HEIGHT - 100;
  
  const renderListCard = ({ item, index }: { item: List; index: number }) => {
    const stats = getListStats(item.id);
    const isEditing = item.id === 'new-list-temp';
    
    const wrapperStyle = viewMode === 'card' ? {
      height: CARD_HEIGHT,
      justifyContent: 'center',
      paddingHorizontal: 20,
      width: '100%'
    } : {};

    return (
      <View 
        style={wrapperStyle}
        className={viewMode === 'list' ? LIST_ITEM_CLASSES.wrapper : ''}
      >
        {!isEditing ? (
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push(`/list/${item.id}`);
            }}
            onLongPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              if (!item.isDefault) {
                Alert.alert(
                  item.name,
                  t('lists.listActions'),
                  [
                    { text: t('common.cancel'), style: 'cancel' },
                    { text: t('lists.duplicate'), onPress: () => handleDuplicateList(item) },
                    { 
                      text: t('common.delete'), 
                      style: 'destructive',
                      onPress: () => handleDeleteList(item) 
                    },
                  ]
                );
              }
            }}
          >
            {/* Gradient border like QuoteCard */}
            <LinearGradient
              colors={isDarkMode ? [item.color, item.color + 'CC'] : [item.color + 'CC', item.color + '99']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                borderRadius: 24,
                padding: 1
              }}
            >
              <View className="bg-black/40 rounded-3xl backdrop-blur-xl">
                <View className="p-6">
                  {/* Main content */}
                  <Text 
                    className="mb-4"
                    style={{ 
                      fontFamily: 'Georgia',
                      fontSize: 22,
                      lineHeight: 30,
                      color: 'white',
                      fontWeight: '300',
                      letterSpacing: 0.3
                    }}
                  >
                    {item.name}
                  </Text>
                  
                  {item.description && (
                    <Text 
                      className="text-white/60 mb-4"
                      style={{ fontSize: 14, lineHeight: 20 }}
                    >
                      {item.description}
                    </Text>
                  )}
                  
                  {/* Bottom divider section like QuoteCard */}
                  <View className={`border-t border-white/10 pt-3`}>
                    <View className="flex-row items-center justify-between">
                      <Text className="text-white/60 text-sm">
                        {t('common.quotes_count', { count: stats.totalQuotes })}
                      </Text>
                      
                      {item.isDefault && (
                        <Text className="text-white/40 text-xs uppercase tracking-wider">
                          System
                        </Text>
                      )}
                    </View>
                  </View>
                </View>
              </View>
            </LinearGradient>
          </Pressable>
        ) : (
          // Edit Mode - Inline Creation Card
          <LinearGradient
            colors={isDarkMode ? [newListData.color, newListData.color + 'CC'] : [newListData.color + 'CC', newListData.color + '99']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              borderRadius: 24,
              padding: 1
            }}
          >
            <View className="bg-black/40 rounded-3xl backdrop-blur-xl">
              <View className="p-6">
                {/* Name Input */}
                <TextInput
                  value={newListData.name}
                  onChangeText={handleInlineNameChange}
                  placeholder="Listen Name..."
                  placeholderTextColor="rgba(255,255,255,0.4)"
                  style={{ 
                    fontFamily: 'Georgia',
                    fontSize: 22,
                    lineHeight: 30,
                    color: 'white',
                    fontWeight: '300',
                    letterSpacing: 0.3,
                    paddingVertical: 0,
                    marginBottom: 16
                  }}
                  autoFocus
                />
                
                {/* Description Input */}
                <TextInput
                  value={newListData.description}
                  onChangeText={handleInlineDescriptionChange}
                  placeholder={t('lists.descriptionPlaceholder')}
                  placeholderTextColor="rgba(255,255,255,0.3)"
                  multiline
                  style={{
                    fontSize: 14,
                    lineHeight: 20,
                    color: 'rgba(255,255,255,0.6)',
                    paddingVertical: 0,
                    marginBottom: 16,
                    minHeight: 40
                  }}
                />
                
                {/* Color Selection */}
                <View className="mb-4">
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View className="flex-row">
                      {LIST_COLORS.slice(0, 12).map((color) => (
                        <Pressable
                          key={color}
                          onPress={() => handleInlineColorChange(color)}
                          className="mr-3"
                        >
                          <View
                            style={{ backgroundColor: color }}
                            className={`w-8 h-8 rounded-full ${
                              newListData.color === color ? 'border-2 border-white' : ''
                            }`}
                          >
                            {newListData.color === color && (
                              <View className="flex-1 items-center justify-center">
                                <Icon name="checkmark" size={16} color="#ffffff" />
                              </View>
                            )}
                          </View>
                        </Pressable>
                      ))}
                    </View>
                  </ScrollView>
                </View>
                
                {/* Bottom divider section with action buttons */}
                <View className={`border-t border-white/10 pt-3`}>
                  <View className="flex-row items-center justify-between">
                    <Text className="text-white/40 text-sm">
                      {t('lists.newList')}
                    </Text>
                    
                    {/* Action Buttons */}
                    <View className="flex-row items-center gap-4">
                      {/* Cancel Button */}
                      <Pressable
                        onPress={cancelInlineCreation}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      >
                        <Icon
                          name="close"
                          size={22}
                          color="rgba(255,255,255,0.8)"
                        />
                      </Pressable>
                      
                      {/* Save Button */}
                      <Pressable
                        onPress={saveInlineList}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        disabled={!newListData.name.trim()}
                      >
                        <Icon
                          name="checkmark"
                          size={22}
                          color={newListData.name.trim() ? "rgba(255,255,255,0.8)" : "rgba(255,255,255,0.3)"}
                        />
                      </Pressable>
                    </View>
                  </View>
                </View>
              </View>
            </View>
          </LinearGradient>
        )}
      </View>
    );
  };

  return (
    <>
      <Stack.Screen 
        options={{ 
          title: t('lists.lists'),
          headerShown: true,
          headerTransparent: true,
          headerBlurEffect: isDarkMode ? 'dark' : 'light',
          headerStyle: {
            backgroundColor: 'transparent',
          },
          headerTintColor: isDarkMode ? '#ffffff' : '#000000',
          headerShadowVisible: false,
          headerRight: () => (
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
          ),
          headerRightContainerStyle: {
            paddingRight: 16,
          },
        }} 
      />
      <View style={{ flex: 1, backgroundColor: colors.background }}>

        {/* Lists */}
        {displayLists.length === 0 ? (
          <View className="flex-1 justify-center items-center px-6" style={{ paddingTop: 100 }}>
            <Icon 
              name="albums-outline" 
              size={64} 
              color={isDarkMode ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.2)"} 
            />
            <Text className={`${isDarkMode ? 'text-white/60' : 'text-black/60'} text-lg mt-4 text-center font-semibold`}>
              {t('lists.noLists')}
            </Text>
            <Text className={`${isDarkMode ? 'text-white/40' : 'text-black/40'} text-sm mt-2 text-center`}>
              {t('lists.createFirst')}
            </Text>
            <Pressable
              onPress={startInlineCreation}
              className={`${isDarkMode ? 'bg-white' : 'bg-black'} rounded-full px-6 py-3 mt-6`}
            >
              <Text className={`${isDarkMode ? 'text-black' : 'text-white'} font-semibold`}>
                {t('lists.createNew')}
              </Text>
            </Pressable>
          </View>
        ) : (
          <AnimatedFlatList
            data={displayLists}
            renderItem={renderListCard}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ 
              paddingBottom: viewMode === 'list' ? LIST_CONTAINER_PADDING.bottom : CARD_HEIGHT * 0.1,
              paddingTop: LIST_CONTAINER_PADDING.top 
            }}
            onScroll={useAnimatedScrollHandler({
              onScroll: (event) => {
                scrollY.value = event.contentOffset.y;
              },
            })}
            scrollEventThrottle={16}
            pagingEnabled={viewMode === 'card'}
            snapToInterval={viewMode === 'card' ? CARD_HEIGHT : undefined}
            snapToAlignment={viewMode === 'card' ? "start" : undefined}
            decelerationRate={viewMode === 'card' ? "fast" : "normal"}
            getItemLayout={viewMode === 'card' ? (data, index) => ({
              length: CARD_HEIGHT,
              offset: CARD_HEIGHT * index,
              index
            }) : undefined}
          />
        )}

        {/* Floating Action Button for Lists */}
        {displayLists.length > 0 && !isCreatingNew && (
          <GlassFAB
            onPress={startInlineCreation}
            icon="add"
            size="medium"
            position="bottom-right"
          />
        )}

        {/* Premium Limit Dialog */}
        <PremiumLimitDialog
          visible={showLimitDialog}
          onClose={() => setShowLimitDialog(false)}
          limitType="collections"
          remaining={getRemainingCollections()}
          max={MAX_WEEKLY_COLLECTIONS}
        />

      </View>
    </>
  );
}