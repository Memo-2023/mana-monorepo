import { FAB } from './FAB';
import { useTheme } from '~/contexts/ThemeContext';

type FilterMode = 'all' | 'favorites';

type FilterToggleProps = {
	mode: FilterMode;
	onModeChange: (mode: FilterMode) => void;
	bottom?: number;
	right?: number;
	left?: number;
};

export function FilterToggle({ mode, onModeChange, bottom = 100, right, left }: FilterToggleProps) {
	const { theme } = useTheme();

	const toggleMode = () => {
		const newMode = mode === 'all' ? 'favorites' : 'all';
		onModeChange(newMode);
	};

	return (
		<FAB
			icon={mode === 'all' ? 'heart-outline' : 'heart'}
			onPress={toggleMode}
			bottom={bottom}
			right={right}
			left={left}
			color={theme.colors.surface}
		/>
	);
}
