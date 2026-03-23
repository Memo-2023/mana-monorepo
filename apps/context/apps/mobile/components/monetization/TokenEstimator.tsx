import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { estimateCostForPrompt } from '../../services/tokenCountingService';
import { getCurrentTokenBalance } from '../../services/tokenTransactionService';
import { useTheme } from '../../utils/theme/theme';

type TokenEstimatorProps = {
	estimate: any; // Die bereits berechnete Token-Schätzung
	estimatedCompletionLength?: number;
	onClose?: () => void; // Optional: Callback zum Schließen der Vorschau
	isLoading?: boolean;
};

export const TokenEstimator: React.FC<TokenEstimatorProps> = ({
	estimate,
	estimatedCompletionLength = 500,
	onClose,
	isLoading = false,
}) => {
	// Wir verwenden jetzt die übergebene Schätzung direkt
	const [balance, setBalance] = useState<number | null>(null);
	const [loading, setLoading] = useState(true);
	const { isDark } = useTheme();

	useEffect(() => {
		const loadEstimate = async () => {
			try {
				setLoading(true);

				// Hole das aktuelle Token-Guthaben (backend identifies user from JWT)
				const tokenBalance = await getCurrentTokenBalance();
				setBalance(tokenBalance);
			} catch (error) {
				console.error('Fehler beim Laden der Token-Schätzung:', error);
			} finally {
				setLoading(false);
			}
		};

		// Nur das Token-Guthaben laden, wenn wir bereits eine Schätzung haben
		loadEstimate();
	}, []);

	// Bestimme, ob genügend Tokens vorhanden sind
	const hasEnoughTokens = balance !== null && estimate && balance >= estimate.appTokens;

	// Container-Stil
	const containerStyle = {
		backgroundColor: isDark ? 'rgba(0, 0, 0, 0.5)' : 'rgba(240, 240, 240, 0.9)',
		borderRadius: 8,
		padding: 12,
		marginVertical: 8,
		borderWidth: 1,
		borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
	};

	// Text-Stil
	const textStyle = {
		color: isDark ? '#ffffff' : '#000000',
		fontSize: 14,
		marginBottom: 4,
	};

	// Hervorgehobener Text-Stil
	const highlightTextStyle = {
		...textStyle,
		fontWeight: '600' as const,
	};

	// Button-Container-Stil
	const buttonContainerStyle = {
		flexDirection: 'row' as const,
		justifyContent: 'flex-end' as const,
		marginTop: 12,
	};

	// Button-Stil
	const buttonStyle = {
		paddingHorizontal: 16,
		paddingVertical: 8,
		borderRadius: 4,
		marginLeft: 8,
	};

	// Abbrechen-Button-Stil
	const cancelButtonStyle = {
		...buttonStyle,
		backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
	};

	// Senden-Button-Stil
	const submitButtonStyle = {
		...buttonStyle,
		backgroundColor: hasEnoughTokens
			? isDark
				? '#3b82f6'
				: '#2563eb'
			: isDark
				? '#6b7280'
				: '#9ca3af',
	};

	// Button-Text-Stil
	const buttonTextStyle = {
		color: isDark ? '#ffffff' : '#000000',
		fontSize: 14,
		fontWeight: '500' as const,
	};

	// Senden-Button-Text-Stil
	const submitButtonTextStyle = {
		...buttonTextStyle,
		color: '#ffffff',
	};

	// Warnungs-Stil
	const warningStyle = {
		...textStyle,
		color: isDark ? '#f87171' : '#dc2626',
		fontWeight: '600' as const,
	};

	if (loading) {
		return (
			<View style={containerStyle}>
				<ActivityIndicator size="small" color={isDark ? '#ffffff' : '#000000'} />
				<Text style={textStyle}>Schätze Token-Kosten...</Text>
			</View>
		);
	}

	return (
		<View style={containerStyle}>
			<Text style={textStyle}>Geschätzte Token-Kosten:</Text>

			{estimate && (
				<>
					<Text style={textStyle}>
						<Text style={highlightTextStyle}>Input:</Text> {estimate.inputTokens.toLocaleString()}{' '}
						Tokens
					</Text>
					{estimate.basePromptTokens !== undefined && (
						<Text style={textStyle}>
							<Text style={highlightTextStyle}>Basis-Prompt:</Text>{' '}
							{estimate.basePromptTokens.toLocaleString()} Tokens
						</Text>
					)}
					{estimate.documentTokens !== undefined && estimate.documentTokens > 0 && (
						<Text style={textStyle}>
							<Text style={highlightTextStyle}>Referenzierte Dokumente:</Text>{' '}
							{estimate.documentTokens.toLocaleString()} Tokens
							{(estimate as any).referencedDocCount > 0 &&
								` (${(estimate as any).referencedDocCount} Dokumente)`}
						</Text>
					)}
					<Text style={textStyle}>
						<Text style={highlightTextStyle}>Output (geschätzt):</Text>{' '}
						{estimatedCompletionLength.toLocaleString()} Tokens
					</Text>
					<Text style={textStyle}>
						<Text style={highlightTextStyle}>Gesamt:</Text>{' '}
						{(estimate.inputTokens + estimatedCompletionLength).toLocaleString()} Tokens
					</Text>
					<Text style={highlightTextStyle}>
						Kosten: {estimate.appTokens.toLocaleString()} App-Tokens
					</Text>

					{balance !== null && (
						<Text style={textStyle}>
							<Text style={highlightTextStyle}>Aktuelles Guthaben:</Text> {balance.toLocaleString()}{' '}
							Tokens
						</Text>
					)}

					{!hasEnoughTokens && (
						<Text style={warningStyle}>
							Nicht genügend Tokens! Sie benötigen{' '}
							{Math.max(0, estimate.appTokens - (balance || 0)).toLocaleString()} weitere Tokens.
						</Text>
					)}
				</>
			)}

			{onClose && (
				<View style={buttonContainerStyle}>
					<TouchableOpacity
						style={{
							...buttonStyle,
							backgroundColor: isDark ? '#4b5563' : '#d1d5db',
						}}
						onPress={onClose}
					>
						<Text style={buttonTextStyle}>Schließen</Text>
					</TouchableOpacity>
				</View>
			)}
		</View>
	);
};

export default TokenEstimator;
