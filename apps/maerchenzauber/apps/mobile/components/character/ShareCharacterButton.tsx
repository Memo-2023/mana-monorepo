import React, { useState } from 'react';
import { StyleSheet, TouchableOpacity, Share, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Text from '../atoms/Text';
import { fetchWithAuth } from '../../src/utils/api';

interface ShareCharacterButtonProps {
	characterId: string;
	characterName: string;
	shareCode?: string | null;
	onShareCodeGenerated?: (shareCode: string) => void;
}

export default function ShareCharacterButton({
	characterId,
	characterName,
	shareCode: initialShareCode,
	onShareCodeGenerated,
}: ShareCharacterButtonProps) {
	const [isLoading, setIsLoading] = useState(false);
	const [shareCode, setShareCode] = useState(initialShareCode);

	const generateShareCode = (): string => {
		// Generate a random 10-character share code
		return Math.random().toString(36).substring(2, 12);
	};

	const handleShare = async () => {
		try {
			setIsLoading(true);

			// If no share code exists, generate one and save it
			let currentShareCode = shareCode;
			if (!currentShareCode) {
				currentShareCode = generateShareCode();

				console.log('[ShareCharacter] Generating and saving share code:', currentShareCode);

				// Update character with share code
				const response = await fetchWithAuth(`/character/${characterId}`, {
					method: 'PUT',
					headers: {
						'Content-Type': 'application/json',
					},
					body: JSON.stringify({
						share_code: currentShareCode,
					}),
				});

				if (!response.ok) {
					const errorData = await response.text();
					console.error(
						'[ShareCharacter] Failed to save share code. Status:',
						response.status,
						'Error:',
						errorData
					);
					throw new Error(`Failed to generate share code: ${response.status}`);
				}

				const result = await response.json();
				console.log('[ShareCharacter] Share code saved successfully:', result);

				// Verify the share code was actually saved
				if (result.data && result.data.share_code !== currentShareCode) {
					console.error('[ShareCharacter] Warning: Saved share code mismatch!', {
						sent: currentShareCode,
						received: result.data.share_code,
					});
				}

				setShareCode(currentShareCode);
				onShareCodeGenerated?.(currentShareCode);
			} else {
				console.log('[ShareCharacter] Using existing share code:', currentShareCode);
			}

			// Create universal link (works in WhatsApp and other apps)
			const shareUrl = `https://märchen-zauber.de/character/${characterId}/${currentShareCode}`;
			const message = `Schau dir '${characterName}' an - ein magischer Charakter aus Märchenzauber! Tippe auf den Link, um ihn zu deiner Bibliothek hinzuzufügen: ${shareUrl}`;

			await Share.share({
				message,
				title: `Teile ${characterName}`,
				url: shareUrl, // iOS will use this for better sharing
			});

			console.log('[ShareCharacter] Character shared with URL:', shareUrl);
		} catch (error: any) {
			console.error('[ShareCharacter] Error sharing:', error);
			Alert.alert(
				'Fehler beim Teilen',
				'Der Charakter konnte nicht geteilt werden. Bitte versuche es erneut.'
			);
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<TouchableOpacity style={styles.shareButton} onPress={handleShare} disabled={isLoading}>
			{isLoading ? (
				<ActivityIndicator size="small" color="#FF6B9D" />
			) : (
				<Ionicons name="share-outline" size={24} color="#FF6B9D" />
			)}
			<Text style={styles.shareButtonText}>Charakter teilen</Text>
		</TouchableOpacity>
	);
}

const styles = StyleSheet.create({
	shareButton: {
		flexDirection: 'row',
		alignItems: 'center',
		backgroundColor: 'rgba(255, 107, 157, 0.1)',
		paddingVertical: 12,
		paddingHorizontal: 20,
		borderRadius: 12,
		borderWidth: 1,
		borderColor: '#FF6B9D',
		gap: 8,
	},
	shareButtonText: {
		color: '#FF6B9D',
		fontSize: 16,
		fontWeight: '600',
	},
});
