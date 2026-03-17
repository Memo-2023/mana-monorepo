import { Pressable, View, Text } from 'react-native';

import { useTheme } from '~/utils/themeContext';

interface SegmentedControlProps<T extends string> {
	segments: { key: T; label: string }[];
	selected: T;
	onSelect: (key: T) => void;
}

export function SegmentedControl<T extends string>({
	segments,
	selected,
	onSelect,
}: SegmentedControlProps<T>) {
	const { colors } = useTheme();

	return (
		<View
			style={{
				flexDirection: 'row',
				backgroundColor: colors.backgroundTertiary,
				borderRadius: 8,
				padding: 2,
				marginHorizontal: 16,
				marginVertical: 8,
			}}
		>
			{segments.map((seg) => {
				const isActive = seg.key === selected;
				return (
					<Pressable
						key={seg.key}
						onPress={() => onSelect(seg.key)}
						style={{
							flex: 1,
							paddingVertical: 8,
							borderRadius: 6,
							backgroundColor: isActive ? colors.card : 'transparent',
							alignItems: 'center',
						}}
					>
						<Text
							style={{
								fontSize: 13,
								fontWeight: isActive ? '600' : '400',
								color: isActive ? colors.text : colors.textSecondary,
							}}
						>
							{seg.label}
						</Text>
					</Pressable>
				);
			})}
		</View>
	);
}
