import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from './Text';

type PageHeaderProps = {
	title: string;
};

export function PageHeader({ title }: PageHeaderProps) {
	const insets = useSafeAreaInsets();

	return (
		<View style={{ paddingHorizontal: 12, paddingTop: insets.top, paddingBottom: 28 }}>
			<Text variant="title" weight="bold">
				{title}
			</Text>
		</View>
	);
}
