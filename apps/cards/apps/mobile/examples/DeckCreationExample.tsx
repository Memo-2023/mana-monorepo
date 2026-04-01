/**
 * Example: How to integrate credit system into deck creation
 *
 * This is a reference implementation showing how to:
 * 1. Handle credit errors when creating a deck
 * 2. Show insufficient credits modal
 * 3. Display user's credit balance
 *
 * Copy this pattern to your actual deck creation screens.
 */

import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import { post } from '../utils/apiClient';
import { InsufficientCreditsModal } from '../components/InsufficientCreditsModal';
import { useInsufficientCredits } from '../hooks/useInsufficientCredits';
import { creditService } from '../services/creditService';

const BASE_API_URL =
	process.env.EXPO_PUBLIC_API_URL || 'https://manadeck-backend-111768794939.europe-west3.run.app';

export function DeckCreationExample() {
	const [deckName, setDeckName] = useState('');
	const [deckDescription, setDeckDescription] = useState('');
	const [loading, setLoading] = useState(false);
	const [creditBalance, setCreditBalance] = useState<number>(0);

	// Hook to manage insufficient credits modal
	const insufficientCredits = useInsufficientCredits();

	// Load credit balance on mount
	useEffect(() => {
		loadCreditBalance();
	}, []);

	const loadCreditBalance = async () => {
		try {
			const balance = await creditService.getBalance();
			setCreditBalance(balance);
		} catch (error) {
			console.error('Failed to load credit balance:', error);
		}
	};

	const handleCreateDeck = async () => {
		if (!deckName.trim()) {
			Alert.alert('Error', 'Please enter a deck name');
			return;
		}

		setLoading(true);

		try {
			const response = await post(`${BASE_API_URL}/v1/api/decks`, {
				name: deckName,
				description: deckDescription,
			});

			// Success!
			Alert.alert('Success', `Deck created successfully! ${response.creditsUsed} mana used.`, [
				{
					text: 'OK',
					onPress: () => {
						// Refresh credit balance
						loadCreditBalance();
						// Reset form
						setDeckName('');
						setDeckDescription('');
					},
				},
			]);
		} catch (error: any) {
			// Check if this is a credit error
			const isCreditError = insufficientCredits.handleCreditError(error);

			if (!isCreditError) {
				// Handle other errors
				console.error('Deck creation error:', error);
				Alert.alert('Error', error.message || 'Failed to create deck. Please try again.');
			}
		} finally {
			setLoading(false);
		}
	};

	const handlePurchaseCredits = () => {
		// Close modal
		insufficientCredits.hideInsufficientCredits();

		// Navigate to purchase screen or open purchase flow
		Alert.alert('Purchase Credits', 'This would navigate to the credit purchase screen');
		// In real implementation:
		// navigation.navigate('PurchaseCredits');
	};

	return (
		<View style={styles.container}>
			{/* Credit Balance Display */}
			<View style={styles.creditBanner}>
				<Text style={styles.creditLabel}>Your Mana:</Text>
				<Text style={styles.creditValue}>{creditBalance} ⚡</Text>
			</View>

			{/* Form */}
			<View style={styles.form}>
				<Text style={styles.label}>Deck Name</Text>
				<TextInput
					style={styles.input}
					value={deckName}
					onChangeText={setDeckName}
					placeholder="Enter deck name"
					editable={!loading}
				/>

				<Text style={styles.label}>Description (Optional)</Text>
				<TextInput
					style={[styles.input, styles.textArea]}
					value={deckDescription}
					onChangeText={setDeckDescription}
					placeholder="Enter deck description"
					multiline
					numberOfLines={4}
					editable={!loading}
				/>

				{/* Cost Info */}
				<View style={styles.costInfo}>
					<Text style={styles.costLabel}>Cost:</Text>
					<Text style={styles.costValue}>10 mana ⚡</Text>
				</View>

				{/* Create Button */}
				<TouchableOpacity
					style={[styles.button, loading && styles.buttonDisabled]}
					onPress={handleCreateDeck}
					disabled={loading}
				>
					<Text style={styles.buttonText}>{loading ? 'Creating...' : 'Create Deck'}</Text>
				</TouchableOpacity>
			</View>

			{/* Insufficient Credits Modal */}
			<InsufficientCreditsModal
				visible={insufficientCredits.visible}
				requiredCredits={insufficientCredits.requiredCredits}
				availableCredits={insufficientCredits.availableCredits}
				operation={insufficientCredits.operation}
				onClose={insufficientCredits.hideInsufficientCredits}
				onPurchase={handlePurchaseCredits}
			/>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		padding: 16,
		backgroundColor: '#f5f5f5',
	},
	creditBanner: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		backgroundColor: '#3b82f6',
		padding: 16,
		borderRadius: 12,
		marginBottom: 20,
	},
	creditLabel: {
		fontSize: 16,
		color: 'white',
		fontWeight: '500',
	},
	creditValue: {
		fontSize: 20,
		color: 'white',
		fontWeight: '700',
	},
	form: {
		backgroundColor: 'white',
		borderRadius: 12,
		padding: 16,
	},
	label: {
		fontSize: 14,
		fontWeight: '600',
		color: '#374151',
		marginBottom: 8,
		marginTop: 12,
	},
	input: {
		borderWidth: 1,
		borderColor: '#d1d5db',
		borderRadius: 8,
		padding: 12,
		fontSize: 16,
		backgroundColor: 'white',
	},
	textArea: {
		height: 100,
		textAlignVertical: 'top',
	},
	costInfo: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		backgroundColor: '#f3f4f6',
		padding: 12,
		borderRadius: 8,
		marginTop: 16,
	},
	costLabel: {
		fontSize: 14,
		color: '#6b7280',
		fontWeight: '500',
	},
	costValue: {
		fontSize: 16,
		color: '#1f2937',
		fontWeight: '700',
	},
	button: {
		backgroundColor: '#3b82f6',
		padding: 16,
		borderRadius: 8,
		alignItems: 'center',
		marginTop: 20,
	},
	buttonDisabled: {
		backgroundColor: '#9ca3af',
	},
	buttonText: {
		color: 'white',
		fontSize: 16,
		fontWeight: '600',
	},
});
