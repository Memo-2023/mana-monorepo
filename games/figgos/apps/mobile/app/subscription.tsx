import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView, Alert } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Stack, useRouter } from 'expo-router';
import { useTheme } from '../utils/ThemeContext';
import { Button } from '../components/Button';
import { supabase } from '../utils/supabase';
import SubscriptionPage from '../components/subscription/SubscriptionPage';

function SubscriptionScreen() {
	const { theme } = useTheme();

	return (
		<View className="flex-1 bg-[#121212]">
			<StatusBar style="light" />
			<Stack.Screen
				options={{
					title: 'Mana',
					headerStyle: {
						backgroundColor: theme.colors.background,
					},
					headerTintColor: theme.colors.text,
					headerTitleStyle: {
						fontWeight: 'bold',
					},
				}}
			/>

			<SubscriptionPage />
		</View>
	);
}

export default SubscriptionScreen;
