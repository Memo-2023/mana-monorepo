import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { getCurrentTokenBalance } from '../../services/tokenTransactionService';
import { useTheme, themeClasses } from '../../utils/theme/theme';
import { eventEmitter, EVENTS } from '../../utils/eventEmitter';

type TokenDisplayProps = {
	onPress?: () => void;
	showLabel?: boolean;
	size?: 'small' | 'medium' | 'large';
	estimatedCost?: number; // Geschätzter Tokenverbrauch für die aktuelle Anfrage
	onInfoPress?: () => void; // Callback für das Info-Icon
};

export const TokenDisplay: React.FC<TokenDisplayProps> = ({
	onPress,
	showLabel = true,
	size = 'medium',
	estimatedCost,
	onInfoPress,
}) => {
	const [tokenBalance, setTokenBalance] = useState<number | null>(null);
	const [loading, setLoading] = useState(true);
	const { isDark } = useTheme();

	// Größen basierend auf der size-Prop
	const fontSize = size === 'small' ? 12 : size === 'medium' ? 14 : 16;
	const iconSize = size === 'small' ? 14 : size === 'medium' ? 16 : 18;
	const paddingHorizontal = size === 'small' ? 6 : size === 'medium' ? 8 : 10;
	const paddingVertical = size === 'small' ? 2 : size === 'medium' ? 3 : 4;

	// Funktion zum Laden des Token-Guthabens
	const loadTokenBalance = useCallback(async () => {
		console.log('TokenDisplay: Lade Token-Guthaben...');
		try {
			const balance = await getCurrentTokenBalance();
			console.log('TokenDisplay: Neues Token-Guthaben geladen:', balance);
			setTokenBalance(balance);
		} catch (error) {
			console.error('Fehler beim Laden des Token-Guthabens:', error);
		} finally {
			setLoading(false);
		}
	}, []);

	// Event-Handler für Token-Balance-Updates
	const handleTokenBalanceUpdated = useCallback(() => {
		console.log('TokenDisplay: TOKEN_BALANCE_UPDATED Event empfangen, lade Guthaben neu');
		loadTokenBalance();
	}, [loadTokenBalance]);

	useEffect(() => {
		// Initial laden
		loadTokenBalance();

		// Event-Listener registrieren
		eventEmitter.on(EVENTS.TOKEN_BALANCE_UPDATED, handleTokenBalanceUpdated);

		// Aktualisiere das Guthaben alle 5 Minuten
		const intervalId = setInterval(loadTokenBalance, 5 * 60 * 1000);

		return () => {
			clearInterval(intervalId);
			// Event-Listener entfernen
			eventEmitter.off(EVENTS.TOKEN_BALANCE_UPDATED, handleTokenBalanceUpdated);
		};
	}, [loadTokenBalance, handleTokenBalanceUpdated]);

	// Formatiere das Token-Guthaben für die Anzeige
	const formattedBalance = tokenBalance !== null ? tokenBalance.toLocaleString() : '---';

	// Berechne das verbleibende Guthaben nach Abzug der geschätzten Kosten
	const remainingBalance =
		tokenBalance !== null && estimatedCost !== undefined
			? Math.max(0, tokenBalance - estimatedCost)
			: null;

	// Formatiere das verbleibende Guthaben für die Anzeige
	const formattedRemainingBalance =
		remainingBalance !== null ? remainingBalance.toLocaleString() : null;

	const containerStyle = {
		flexDirection: 'row' as const,
		alignItems: 'center' as const,
		backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
		paddingHorizontal,
		paddingVertical,
		borderRadius: 16,
		marginHorizontal: 4,
	};

	const textStyle = {
		color: isDark ? '#ffffff' : '#000000',
		fontSize,
		fontWeight: '500' as const,
		marginLeft: showLabel ? 4 : 0,
	};

	const labelStyle = {
		color: isDark ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)',
		fontSize: fontSize - 2,
		marginRight: 4,
	};

	const infoIconStyle = {
		marginLeft: 4,
		fontSize: iconSize,
		color: isDark ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)',
	};

	const estimatedCostStyle = {
		color: isDark ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)',
		fontSize: fontSize - 2,
		marginLeft: 4,
	};

	// Wenn onInfoPress vorhanden ist, machen wir den gesamten Bereich klickbar
	const tokenDisplayContent = (
		<>
			{showLabel && <Text style={labelStyle}>Tokens:</Text>}

			{/* Zeige das aktuelle Guthaben an */}
			<Text style={textStyle}>{formattedBalance}</Text>

			{/* Zeige den geschätzten Tokenverbrauch an, wenn vorhanden */}
			{estimatedCost !== undefined && formattedRemainingBalance !== null && (
				<Text style={estimatedCostStyle}>{` → ${formattedRemainingBalance}`}</Text>
			)}

			{/* Info-Icon, das die detaillierte Token-Schätzung öffnet */}
			{onInfoPress && <Text style={infoIconStyle}>ℹ️</Text>}
		</>
	);

	const content = (
		<View style={containerStyle}>
			{loading ? (
				<ActivityIndicator size="small" color={isDark ? '#ffffff' : '#000000'} />
			) : onInfoPress ? (
				<TouchableOpacity
					onPress={onInfoPress}
					style={{ flexDirection: 'row', alignItems: 'center' }}
				>
					{tokenDisplayContent}
				</TouchableOpacity>
			) : (
				tokenDisplayContent
			)}
		</View>
	);

	if (onPress) {
		return (
			<TouchableOpacity onPress={onPress} activeOpacity={0.7}>
				{content}
			</TouchableOpacity>
		);
	}

	return content;
};

export default TokenDisplay;
