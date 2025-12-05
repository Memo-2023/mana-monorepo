import { View, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Text } from '../ui/Text';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';

type SpaceCardProps = {
	id: string;
	name: string;
	description?: string | null;
	documentCount?: number;
	tags?: string[];
	onPress?: () => void;
};

export const SpaceCard = ({
	id,
	name,
	description,
	documentCount = 0,
	tags = [],
	onPress,
}: SpaceCardProps) => {
	const router = useRouter();

	const handlePress = () => {
		if (onPress) {
			onPress();
		} else {
			router.push(`/spaces/${id}`);
		}
	};

	return (
		<Card className="mb-4" onPress={handlePress}>
			<View className="flex-row justify-between items-start">
				<View className="flex-1">
					<Text variant="h3" className="mb-1">
						{name}
					</Text>
					{description && (
						<Text variant="body" className="text-gray-600 dark:text-gray-400 mb-3">
							{description}
						</Text>
					)}
				</View>
			</View>

			<View className="flex-row justify-between items-center mt-2">
				<Text variant="caption">
					{documentCount} {documentCount === 1 ? 'Dokument' : 'Dokumente'}
				</Text>

				{tags.length > 0 && (
					<View className="flex-row flex-wrap gap-1">
						{tags.slice(0, 3).map((tag, index) => (
							<Badge key={index} label={tag} variant="default" />
						))}
						{tags.length > 3 && <Badge label={`+${tags.length - 3}`} variant="default" />}
					</View>
				)}
			</View>
		</Card>
	);
};
