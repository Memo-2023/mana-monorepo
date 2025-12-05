import {
	SafeAreaView,
	ScrollView,
	View,
	ViewProps,
	ScrollViewProps,
	StyleSheet,
} from 'react-native';
import { ReactNode } from 'react';
import { Text } from '../ui/Text';
import { useTheme } from '~/utils/theme/theme';

type ScreenProps = {
	title?: string;
	children: ReactNode;
	scrollable?: boolean;
	padded?: boolean;
} & (ScrollViewProps | ViewProps);

export const Screen = ({
	title,
	children,
	scrollable = true,
	padded = true,
	className,
	style,
	...props
}: ScreenProps) => {
	const Content = scrollable ? ScrollView : View;
	const { isDark } = useTheme();

	return (
		<SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#111827' : '#f9fafb' }]}>
			{title && (
				<View
					style={{
						paddingHorizontal: 16,
						paddingVertical: 12,
						borderBottomWidth: 1,
						borderBottomColor: isDark ? '#374151' : '#e5e7eb',
					}}
				>
					<Text
						style={{
							fontSize: 20,
							fontWeight: 'bold',
							color: isDark ? '#f9fafb' : '#111827',
						}}
					>
						{title}
					</Text>
				</View>
			)}
			<Content
				style={[styles.content, padded && styles.padded, style]}
				contentContainerStyle={scrollable && padded ? { paddingBottom: 20 } : undefined}
				{...props}
			>
				{children}
			</Content>
		</SafeAreaView>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	content: {
		flex: 1,
	},
	padded: {
		paddingHorizontal: 16,
		paddingVertical: 16,
	},
});
