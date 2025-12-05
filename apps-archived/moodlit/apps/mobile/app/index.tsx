import { Stack, useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Text, Pressable, View, StyleSheet } from 'react-native';
import DraggableFlatList, { ScaleDecorator } from 'react-native-draggable-flatlist';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { LinearGradient } from 'expo-linear-gradient';

import { Icon } from '@/components/Icon';
import { MoodCard } from '@/components/MoodCard';
import { SequenceCard } from '@/components/SequenceCard';
import { useStore } from '@/store/store';
import { getThemeColors } from '@/utils/theme';
import { useResponsive } from '@/hooks/useResponsive';
import type { Mood } from '@/store/store';

export default function Home() {
	const router = useRouter();
	const moods = useStore((state) => state.moods);
	const sequences = useStore((state) => state.sequences);
	const settings = useStore((state) => state.settings);
	const reorderMoods = useStore((state) => state.reorderMoods);
	const updateSettings = useStore((state) => state.updateSettings);

	const theme = getThemeColors();
	const responsive = useResponsive();

	const handleHaptic = () => {
		if (settings.hapticFeedback) {
			Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
		}
	};

	const toggleScreen = () => {
		handleHaptic();
		updateSettings({ screenEnabled: !settings.screenEnabled });
	};

	const toggleFlashlight = () => {
		handleHaptic();
		updateSettings({ flashlightEnabled: !settings.flashlightEnabled });
	};

	const handleMoodPress = (id: string) => {
		handleHaptic();
		router.push(`/mood/${id}`);
	};

	const handleSequencePress = (id: string) => {
		handleHaptic();
		router.push(`/sequence/${id}`);
	};

	const renderHeader = () => (
		<>
			<View className="flex-row items-center justify-between px-6 pb-4">
				<Text className={`text-3xl font-bold ${theme.text}`}>Moods</Text>
				<View className="flex-row gap-3">
					<Pressable
						onPress={() => {
							handleHaptic();
							router.push('/create-mood');
						}}
						className="p-2"
					>
						<Icon name="plus-circle" size={28} color="#fff" weight="regular" />
					</Pressable>
					<Pressable
						onPress={() => {
							handleHaptic();
							router.push('/sequences');
						}}
						className="p-2"
					>
						<Icon name="square-stack" size={28} color="#fff" weight="regular" />
					</Pressable>
					<Pressable
						onPress={() => {
							handleHaptic();
							router.push('/settings');
						}}
						className="p-2"
					>
						<Icon name="settings" size={28} color="#fff" weight="regular" />
					</Pressable>
				</View>
			</View>

			{/* Sequenzen Liste */}
			{sequences.length > 0 && (
				<>
					{sequences.map((sequence) => (
						<SequenceCard
							key={sequence.id}
							sequence={sequence}
							moods={moods}
							onPress={() => handleSequencePress(sequence.id)}
						/>
					))}
				</>
			)}
		</>
	);

	return (
		<GestureHandlerRootView className={`flex flex-1 ${theme.bg}`}>
			<Stack.Screen options={{ headerShown: false }} />

			<View className="flex-1 items-center">
				<View style={{ width: '100%', maxWidth: responsive.maxContentWidth }}>
					<DraggableFlatList
						data={moods}
						onDragEnd={({ data }) => reorderMoods(data)}
						keyExtractor={(item) => item.id}
						contentContainerStyle={{ paddingBottom: 100, paddingTop: 64 }}
						ListHeaderComponent={renderHeader}
						renderItem={({ item, drag, isActive }) => (
							<ScaleDecorator>
								<MoodCard
									mood={item}
									onPress={() => handleMoodPress(item.id)}
									onLongPress={drag}
									isActive={isActive}
								/>
							</ScaleDecorator>
						)}
					/>
				</View>
			</View>

			{/* Gradient am unteren Rand */}
			<LinearGradient
				colors={['transparent', 'rgba(0,0,0,0.2)', 'rgba(0,0,0,0.5)', 'rgba(0,0,0,0.7)']}
				locations={[0, 0.4, 0.7, 1]}
				style={{
					position: 'absolute',
					bottom: 0,
					left: 0,
					right: 0,
					height: 250,
				}}
				pointerEvents="none"
			/>

			{/* Toggle Buttons am unteren Rand */}
			<View className="absolute bottom-0 left-0 right-0 items-center pb-8 pt-4">
				<View style={{ width: '100%', maxWidth: responsive.maxContentWidth }} className="px-6">
					<View className="flex-row gap-3">
						<Pressable
							onPress={toggleScreen}
							className={`flex-1 flex-row items-center justify-center gap-2 rounded-2xl py-4 ${
								settings.screenEnabled
									? 'border-2 border-gray-200 bg-white'
									: 'border-2 border-gray-600 bg-gray-700'
							}`}
						>
							<Icon
								name="phone-portrait"
								size={20}
								color={settings.screenEnabled ? '#000' : '#fff'}
								weight={settings.screenEnabled ? 'fill' : 'regular'}
							/>
							<Text
								className={`font-semibold ${settings.screenEnabled ? 'text-gray-900' : 'text-white'}`}
							>
								Bildschirm
							</Text>
						</Pressable>

						<Pressable
							onPress={toggleFlashlight}
							className={`flex-1 flex-row items-center justify-center gap-2 rounded-2xl py-4 ${
								settings.flashlightEnabled
									? 'border-2 border-gray-200 bg-white'
									: 'border-2 border-gray-600 bg-gray-700'
							}`}
						>
							<Icon
								name="flashlight"
								size={20}
								color={settings.flashlightEnabled ? '#000' : '#fff'}
								weight={settings.flashlightEnabled ? 'fill' : 'regular'}
							/>
							<Text
								className={`font-semibold ${settings.flashlightEnabled ? 'text-gray-900' : 'text-white'}`}
							>
								Taschenlampe
							</Text>
						</Pressable>
					</View>
				</View>
			</View>
		</GestureHandlerRootView>
	);
}

const styles = StyleSheet.create({});
