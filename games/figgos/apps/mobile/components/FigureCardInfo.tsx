import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useTheme } from '~/utils/ThemeContext';
import { ThemedText } from './ThemedView';

interface CardInfoPanelProps {
	title: string;
	creator: string;
	likes: number;
	isLiked: boolean;
	onLike: () => void;
	onShare: () => void;
}

export const CardInfoPanel: React.FC<CardInfoPanelProps> = ({
	title,
	creator,
	likes,
	isLiked,
	onLike,
	onShare,
}) => {
	const { theme, isDark } = useTheme();

	return (
		<View className="w-full px-3 py-3 items-center">
			{/* Title and creator - centered */}
			<View className="w-full mb-3 items-center">
				<ThemedText
					className="text-[20px] font-bold text-center"
					numberOfLines={1}
					ellipsizeMode="tail"
				>
					{title}
				</ThemedText>
				<ThemedText
					className="text-[14px] opacity-70 mt-1 text-center"
					numberOfLines={1}
					ellipsizeMode="tail"
				>
					by {creator}
				</ThemedText>
			</View>

			{/* Action icons - all four in a row */}
			<View className="flex-row items-center justify-center mt-2 w-full">
				<TouchableOpacity className="flex-row items-center mx-3 py-[6px]" onPress={onLike}>
					<FontAwesome
						name="heart"
						size={22}
						color={isLiked ? theme.colors.primary : theme.colors.text}
						style={{ opacity: isLiked ? 1 : 0.5 }}
					/>
					{likes > 0 && (
						<ThemedText className="text-[14px] ml-[5px] opacity-70">{likes}</ThemedText>
					)}
				</TouchableOpacity>

				<TouchableOpacity className="flex-row items-center mx-3 py-[6px]">
					<FontAwesome
						name="thumbs-up"
						size={22}
						color={theme.colors.text}
						style={{ opacity: 0.5 }}
					/>
				</TouchableOpacity>

				<TouchableOpacity className="flex-row items-center mx-3 py-[6px]">
					<FontAwesome
						name="refresh"
						size={22}
						color={theme.colors.text}
						style={{ opacity: 0.5 }}
					/>
				</TouchableOpacity>

				<TouchableOpacity className="flex-row items-center mx-3 py-[6px]" onPress={onShare}>
					<FontAwesome name="share" size={22} color={theme.colors.text} style={{ opacity: 0.5 }} />
				</TouchableOpacity>
			</View>
		</View>
	);
};
