/**
 * Contact Card component for mobile
 */

import React from 'react';
import { View, Text, TouchableOpacity, Linking } from 'react-native';
import type { ContactInfo } from '@manacore/shared-help-types';
import type { HelpTranslations } from '../types';

interface ContactCardProps {
	contact: ContactInfo | null;
	translations: Pick<HelpTranslations, 'contact'>;
}

export function ContactCard({ contact, translations }: ContactCardProps) {
	if (!contact) {
		return (
			<View className="py-8 items-center">
				<Text className="text-gray-500 dark:text-gray-400">{translations.contact.noInfo}</Text>
			</View>
		);
	}

	function handleEmailPress() {
		if (contact.supportEmail) {
			Linking.openURL(`mailto:${contact.supportEmail}`);
		}
	}

	// Strip HTML tags for mobile display
	const plainContent = contact.content.replace(/<[^>]*>/g, '').trim();

	return (
		<View>
			{plainContent && (
				<Text className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed mb-4">
					{plainContent}
				</Text>
			)}

			{contact.supportEmail && (
				<TouchableOpacity
					onPress={handleEmailPress}
					className="flex-row items-center bg-white dark:bg-gray-800 rounded-xl p-4 mb-3 border border-gray-200 dark:border-gray-700"
				>
					<View className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 items-center justify-center mr-3">
						<Text>✉️</Text>
					</View>
					<View className="flex-1">
						<Text className="font-medium text-gray-900 dark:text-gray-100">
							{translations.contact.email}
						</Text>
						<Text className="text-sm text-gray-600 dark:text-gray-400">{contact.supportEmail}</Text>
					</View>
				</TouchableOpacity>
			)}

			{contact.responseTime && (
				<View className="flex-row items-center bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
					<View className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 items-center justify-center mr-3">
						<Text>⏱️</Text>
					</View>
					<View className="flex-1">
						<Text className="font-medium text-gray-900 dark:text-gray-100">Response Time</Text>
						<Text className="text-sm text-gray-600 dark:text-gray-400">{contact.responseTime}</Text>
					</View>
				</View>
			)}
		</View>
	);
}
