import { View, ViewStyle, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FAB } from './FAB';
import { Text } from './Text';
import { useTheme } from '~/contexts/ThemeContext';

type ViewMode = 'single' | 'grid3' | 'grid5';

type ViewToggleProps = {
	mode: ViewMode;
	onModeChange: (mode: ViewMode) => void;
	bottom?: number;
	left?: number;
	right?: number;
	style?: ViewStyle;
};

export function ViewToggle({
	mode,
	onModeChange,
	bottom = 100,
	left,
	right,
	style,
}: ViewToggleProps) {
	const { theme } = useTheme();

	const cycleMode = () => {
		// Cycle through: single -> grid3 -> grid5 -> single
		const modeOrder: ViewMode[] = ['single', 'grid3', 'grid5'];
		const currentIndex = modeOrder.indexOf(mode);
		const nextIndex = (currentIndex + 1) % modeOrder.length;
		onModeChange(modeOrder[nextIndex]);
	};

	// Get icon based on current mode
	const getIcon = () => {
		switch (mode) {
			case 'single':
				return 'square';
			case 'grid3':
				return 'grid';
			case 'grid5':
				return 'apps';
			default:
				return 'grid';
		}
	};

	// If style is provided, render as inline toggle buttons
	if (style) {
		const modes: { mode: ViewMode; icon: keyof typeof Ionicons.glyphMap; label: string }[] = [
			{ mode: 'single', icon: 'square', label: 'Einzeln' },
			{ mode: 'grid3', icon: 'grid', label: '3x3' },
			{ mode: 'grid5', icon: 'apps', label: '5x5' },
		];

		return (
			<View style={[{ flexDirection: 'row', gap: 8 }, style]}>
				{modes.map(({ mode: viewMode, icon, label }) => {
					const isSelected = mode === viewMode;

					return (
						<Pressable
							key={viewMode}
							onPress={() => onModeChange(viewMode)}
							style={{
								backgroundColor: isSelected
									? theme.colors.primary.default
									: theme.colors.input.background,
								borderColor: isSelected ? theme.colors.primary.default : theme.colors.border,
								borderWidth: 1,
								flex: 1,
								flexDirection: 'row',
								alignItems: 'center',
								justifyContent: 'center',
								paddingVertical: 12,
								paddingHorizontal: 16,
								borderRadius: 12,
							}}
						>
							<Ionicons
								name={icon}
								size={20}
								color={isSelected ? theme.colors.primary.contrast : theme.colors.text.secondary}
								style={{ marginRight: 8 }}
							/>
							<Text
								style={{
									color: isSelected ? theme.colors.primary.contrast : theme.colors.text.primary,
									fontWeight: '500',
								}}
							>
								{label}
							</Text>
						</Pressable>
					);
				})}
			</View>
		);
	}

	// Otherwise, render as FAB
	return (
		<FAB
			icon={getIcon()}
			onPress={cycleMode}
			bottom={bottom}
			left={left}
			right={right}
			color={theme.colors.surface}
		/>
	);
}
