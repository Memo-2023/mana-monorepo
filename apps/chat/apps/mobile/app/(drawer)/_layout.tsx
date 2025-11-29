import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Drawer } from 'expo-router/drawer';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../../theme/ThemeProvider';

export default function DrawerLayout() {
	const { isDarkMode } = useAppTheme();

	// Anpassen des Drawer-Stils basierend auf dem Farbschema
	const drawerStyles = {
		backgroundColor: isDarkMode ? '#1C1C1E' : '#FFFFFF',
		contentOptions: {
			activeTintColor: '#0A84FF',
			inactiveTintColor: isDarkMode ? '#FFFFFF' : '#000000',
			activeBackgroundColor: isDarkMode ? '#2C2C2E' : '#E5E5EA',
		},
	};

	return (
		<Drawer
			screenOptions={{
				headerShown: false,
				drawerStyle: {
					backgroundColor: drawerStyles.backgroundColor,
				},
				drawerActiveTintColor: drawerStyles.contentOptions.activeTintColor,
				drawerInactiveTintColor: drawerStyles.contentOptions.inactiveTintColor,
				drawerActiveBackgroundColor: drawerStyles.contentOptions.activeBackgroundColor,
			}}
		>
			<Drawer.Screen
				name="index"
				options={{
					title: 'Chat',
					drawerIcon: ({ color, size }) => (
						<Ionicons name="chatbubbles-outline" size={size} color={color} />
					),
				}}
			/>
			<Drawer.Screen
				name="documents"
				options={{
					title: 'Dokumente',
					drawerIcon: ({ color, size }) => (
						<Ionicons name="document-text-outline" size={size} color={color} />
					),
				}}
			/>
			<Drawer.Screen
				name="archive"
				options={{
					title: 'Archiv',
					drawerIcon: ({ color, size }) => (
						<Ionicons name="archive-outline" size={size} color={color} />
					),
				}}
			/>
			<Drawer.Screen
				name="templates"
				options={{
					title: 'Vorlagen',
					drawerIcon: ({ color, size }) => (
						<Ionicons name="file-tray-full-outline" size={size} color={color} />
					),
				}}
			/>
			<Drawer.Screen
				name="profile"
				options={{
					title: 'Profil',
					drawerIcon: ({ color, size }) => (
						<Ionicons name="person-outline" size={size} color={color} />
					),
				}}
			/>
			<Drawer.Screen
				name="settings"
				options={{
					title: 'Einstellungen',
					drawerIcon: ({ color, size }) => (
						<Ionicons name="settings-outline" size={size} color={color} />
					),
				}}
			/>
		</Drawer>
	);
}
