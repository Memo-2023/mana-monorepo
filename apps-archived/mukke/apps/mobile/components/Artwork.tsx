import { Ionicons } from '@expo/vector-icons';
import { Image, View } from 'react-native';

import { useTheme } from '~/utils/themeContext';

interface ArtworkProps {
	uri: string | null | undefined;
	size?: number;
	rounded?: boolean;
}

export function Artwork({ uri, size = 48, rounded = false }: ArtworkProps) {
	const { colors } = useTheme();

	if (uri) {
		return (
			<Image
				source={{ uri }}
				style={{
					width: size,
					height: size,
					borderRadius: rounded ? size / 2 : 8,
				}}
			/>
		);
	}

	return (
		<View
			style={{
				width: size,
				height: size,
				borderRadius: rounded ? size / 2 : 8,
				backgroundColor: colors.backgroundTertiary,
				alignItems: 'center',
				justifyContent: 'center',
			}}
		>
			<Ionicons name="musical-note" size={size * 0.4} color={colors.textTertiary} />
		</View>
	);
}
