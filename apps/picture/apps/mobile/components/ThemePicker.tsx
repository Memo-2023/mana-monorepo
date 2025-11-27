import { View, Text, Pressable, ScrollView } from 'react-native';
import { useTheme } from '~/contexts/ThemeContext';
import { themes, type ThemeVariant, type ColorMode } from '@picture/design-tokens';
import { Ionicons } from '@expo/vector-icons';

// ThemeMode includes 'system' for automatic light/dark switching
type ThemeMode = ColorMode | 'system';

export function ThemePicker() {
	const { theme, variant, mode, setVariant, setMode } = useTheme();

	const themeVariants: { value: ThemeVariant; label: string; icon: string }[] = [
		{ value: 'default', label: 'Indigo', icon: '🔵' },
		{ value: 'sunset', label: 'Sunset', icon: '🌅' },
		{ value: 'ocean', label: 'Ocean', icon: '🌊' },
	];

	const modeModes: { value: ThemeMode; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
		{ value: 'system', label: 'System', icon: 'phone-portrait-outline' },
		{ value: 'light', label: 'Hell', icon: 'sunny-outline' },
		{ value: 'dark', label: 'Dunkel', icon: 'moon-outline' },
	];

	return (
		<View style={{ backgroundColor: theme.colors.surface }} className="rounded-2xl p-4">
			{/* Theme Variant Selection */}
			<View className="mb-6">
				<Text style={{ color: theme.colors.text.primary }} className="mb-3 text-lg font-semibold">
					Theme
				</Text>
				<ScrollView horizontal showsHorizontalScrollIndicator={false}>
					<View className="flex-row gap-3">
						{themeVariants.map((themeVariant) => {
							const isSelected = variant === themeVariant.value;
							const themePreview = themes[themeVariant.value];

							return (
								<Pressable
									key={themeVariant.value}
									onPress={() => setVariant(themeVariant.value)}
									style={{
										borderColor: isSelected ? theme.colors.primary.default : theme.colors.border,
										borderWidth: 2,
										backgroundColor: theme.colors.elevated,
									}}
									className="min-w-[120px] items-center rounded-xl p-4"
								>
									{/* Theme Icon */}
									<Text className="mb-2 text-4xl">{themeVariant.icon}</Text>

									{/* Theme Name */}
									<Text
										style={{
											color: isSelected ? theme.colors.primary.default : theme.colors.text.primary,
										}}
										className="mb-2 font-semibold"
									>
										{themeVariant.label}
									</Text>

									{/* Color Preview */}
									<View className="flex-row gap-1">
										<View
											style={{
												backgroundColor: themePreview.colors.dark.primary.default,
												width: 20,
												height: 20,
												borderRadius: 10,
											}}
										/>
										<View
											style={{
												backgroundColor: themePreview.colors.dark.secondary.default,
												width: 20,
												height: 20,
												borderRadius: 10,
											}}
										/>
									</View>

									{/* Checkmark */}
									{isSelected && (
										<View className="absolute right-2 top-2">
											<Ionicons
												name="checkmark-circle"
												size={20}
												color={theme.colors.primary.default}
											/>
										</View>
									)}
								</Pressable>
							);
						})}
					</View>
				</ScrollView>
			</View>

			{/* Mode Selection */}
			<View>
				<Text style={{ color: theme.colors.text.primary }} className="mb-3 text-lg font-semibold">
					Modus
				</Text>
				<View className="flex-row gap-2">
					{modeModes.map((modeOption) => {
						const isSelected = mode === modeOption.value;

						return (
							<Pressable
								key={modeOption.value}
								onPress={() => setMode(modeOption.value)}
								style={{
									backgroundColor: isSelected
										? theme.colors.primary.default
										: theme.colors.input.background,
									borderColor: isSelected ? theme.colors.primary.default : theme.colors.border,
									borderWidth: 1,
								}}
								className="flex-1 flex-row items-center justify-center rounded-xl px-4 py-3"
							>
								<Ionicons
									name={modeOption.icon}
									size={20}
									color={isSelected ? theme.colors.primary.contrast : theme.colors.text.secondary}
									style={{ marginRight: 8 }}
								/>
								<Text
									style={{
										color: isSelected ? theme.colors.primary.contrast : theme.colors.text.primary,
									}}
									className="font-medium"
								>
									{modeOption.label}
								</Text>
							</Pressable>
						);
					})}
				</View>

				{/* System Mode Info */}
				{mode === 'system' && (
					<View
						style={{ backgroundColor: theme.colors.info + '20', borderColor: theme.colors.info }}
						className="mt-3 rounded-lg border p-3"
					>
						<View className="flex-row items-center">
							<Ionicons name="information-circle-outline" size={18} color={theme.colors.info} />
							<Text style={{ color: theme.colors.info }} className="ml-2 flex-1 text-sm">
								Das Theme folgt den Systemeinstellungen deines Geräts
							</Text>
						</View>
					</View>
				)}
			</View>
		</View>
	);
}
