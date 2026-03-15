import { FontAwesome } from '@expo/vector-icons';
import { Stack, Link } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, View, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { LogsList } from '~/components/LogsList';
import { SettingsButton } from '~/components/SettingsButton';
import { ThemeWrapper } from '~/components/ThemeWrapper';
import { getStoredLogs } from '~/utils/logService';
import { useTheme } from '~/utils/themeContext';

export interface LogEntry {
	id: string;
	timestamp: number;
	level: 'info' | 'warning' | 'error';
	message: string;
	details?: any;
}

export default function LogsScreen() {
	const [logs, setLogs] = useState<LogEntry[]>([]);
	const { isDarkMode } = useTheme();
	const insets = useSafeAreaInsets();

	useEffect(() => {
		loadLogs();

		// Set up a listener to refresh logs every 5 seconds
		const interval = setInterval(loadLogs, 5000);

		return () => clearInterval(interval);
	}, []);

	const loadLogs = async () => {
		const storedLogs = await getStoredLogs();
		setLogs(storedLogs);
	};

	return (
		<ThemeWrapper>
			<Stack.Screen
				options={{
					title: 'Logs',
					headerTransparent: false,
					headerBlurEffect: undefined,
					headerStyle: {
						backgroundColor: isDarkMode ? '#1E1E1E' : '#FFFFFF',
					},
					headerShadowVisible: false,
					headerTintColor: isDarkMode ? '#FFFFFF' : '#000000',
					headerLeft: () => (
						<View style={{ paddingLeft: 16 }}>
							<SettingsButton />
						</View>
					),
				}}
			/>
			<View
				style={[
					styles.container,
					isDarkMode && { backgroundColor: '#121212' },
					{
						paddingBottom: Math.max(insets.bottom, 16),
						paddingHorizontal: 16,
						paddingTop: 16,
					},
				]}
			>
				<LogsList logs={logs} isDarkMode={isDarkMode} />
			</View>
		</ThemeWrapper>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
});
