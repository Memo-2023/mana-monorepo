import React, { useEffect, useState } from 'react';
import { FlatList, View, Text, RefreshControl } from 'react-native';
import { MealWithItems } from '../../types/Database';
import { useMealStore } from '../../store/MealStore';
import { MealCardContextMenu } from './MealCardContextMenu';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { Button } from '../Button';
import { Header } from '../ui/Header';

interface MealListProps {
	onMealPress: (meal: MealWithItems) => void;
}

export const MealList: React.FC<MealListProps> = ({ onMealPress }) => {
	const [refreshing, setRefreshing] = useState(false);

	const { meals, isLoading, error, loadMeals, clearError } = useMealStore();

	useEffect(() => {
		loadMeals();
	}, [loadMeals]);

	const handleRefresh = async () => {
		setRefreshing(true);
		await loadMeals();
		setRefreshing(false);
	};

	const renderMealItem = ({ item }: { item: MealWithItems }) => (
		<MealCardContextMenu meal={item} onPress={() => onMealPress(item)} />
	);

	const renderEmptyState = () => (
		<View className="flex-1 items-center justify-center py-20">
			<Text className="mb-4 text-6xl">🍽️</Text>
			<Text className="mb-2 text-xl font-semibold text-gray-800 dark:text-gray-200">
				No meals yet
			</Text>
			<Text className="px-8 text-center text-gray-600 dark:text-gray-400">
				Start tracking your nutrition by taking a photo of your first meal using the camera button
				below!
			</Text>
		</View>
	);

	const renderError = () => (
		<View className="flex-1 items-center justify-center py-20">
			<Text className="mb-4 text-4xl">⚠️</Text>
			<Text className="mb-2 text-xl font-semibold text-red-600 dark:text-red-400">
				Oops! Something went wrong
			</Text>
			<Text className="mb-6 px-8 text-center text-gray-600 dark:text-gray-400">{error}</Text>
			<Button
				title="Try Again"
				onPress={() => {
					clearError();
					loadMeals();
				}}
				className="px-8"
			/>
		</View>
	);

	if (error && meals.length === 0) {
		return renderError();
	}

	if (isLoading && meals.length === 0) {
		return (
			<View className="flex-1 items-center justify-center">
				<LoadingSpinner text="Loading your meals..." />
			</View>
		);
	}

	return (
		<View className="flex-1 bg-gray-50 dark:bg-gray-900">
			{/* Meal List */}
			<FlatList
				data={meals}
				renderItem={renderMealItem}
				keyExtractor={(item) => item.id!.toString()}
				contentContainerStyle={{
					padding: 16,
					flexGrow: 1,
				}}
				ItemSeparatorComponent={() => <View style={{ height: 16 }} />}
				ListEmptyComponent={renderEmptyState}
				ListHeaderComponent={<Header title="NutriPhi" />}
				refreshControl={
					<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#6366f1" />
				}
				showsVerticalScrollIndicator={false}
			/>

			{/* Loading Overlay */}
			{isLoading && meals.length > 0 && <LoadingSpinner overlay text="Updating..." />}
		</View>
	);
};
