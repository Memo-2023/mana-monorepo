import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Text from '~/components/atoms/Text';
import { useTheme } from '~/features/theme/ThemeProvider';
import { useTranslation } from 'react-i18next';

interface AddressInfo {
	street?: string;
	streetNumber?: string;
	postalCode?: string;
	city?: string;
	district?: string;
	region?: string;
	country?: string;
	name?: string;
	formattedAddress?: string;
}

interface LocationData {
	latitude?: number;
	longitude?: number;
	address?: AddressInfo;
	memoId?: string; // ID des zugehörigen Memos
}

interface MemoLocationProps {
	location: LocationData;
	showLabel?: boolean;
	fullOpacity?: boolean;
}

/**
 * Komponente zur Anzeige von Standortdaten in einem Memo
 */
const MemoLocation: React.FC<MemoLocationProps> = ({
	location,
	showLabel = true,
	fullOpacity = false,
}) => {
	const { isDark } = useTheme();
	const { t } = useTranslation();

	console.log('[MemoLocation] Received location prop:', location);

	if (!location) {
		console.log('[MemoLocation] No location data, returning null');
		return null;
	}

	const { latitude, longitude, address } = location;
	console.log('[MemoLocation] Extracted data:', { latitude, longitude, address });

	const screenWidth = Dimensions.get('window').width;

	const styles = StyleSheet.create({
		container: {
			flexDirection: 'row',
			alignItems: 'flex-start',
			marginTop: 0,
			paddingVertical: 0,
		},
		addressText: {
			fontSize: 14,
			color: fullOpacity
				? isDark
					? '#FFFFFF'
					: '#000000'
				: isDark
					? 'rgba(255, 255, 255, 0.7)'
					: 'rgba(0, 0, 0, 0.7)',
			lineHeight: 20,
			flex: 1,
			flexWrap: 'wrap',
		},
	});

	// Formatiere die Adresse für die Anzeige
	const getFormattedAddress = () => {
		if (!address) return null;

		if (address.formattedAddress) {
			return address.formattedAddress;
		}

		const addressParts = [];

		// Straße und Hausnummer
		if (address.street) {
			const streetPart = address.streetNumber
				? `${address.street} ${address.streetNumber}`
				: address.street;
			addressParts.push(streetPart);
		}

		// PLZ und Stadt
		if (address.city) {
			const cityPart = address.postalCode ? `${address.postalCode} ${address.city}` : address.city;
			addressParts.push(cityPart);
		}

		// Land
		if (address.country) {
			addressParts.push(address.country);
		}

		return addressParts.join(', ');
	};

	const formattedAddress = getFormattedAddress();
	console.log('[MemoLocation] Formatted address:', formattedAddress);

	// If no address, show coordinates as fallback
	const displayText =
		formattedAddress ||
		(latitude && longitude ? `${latitude.toFixed(6)}, ${longitude.toFixed(6)}` : null);

	if (!displayText) {
		console.log('[MemoLocation] No location data to display, returning null');
		return null;
	}

	return (
		<View style={styles.container}>
			<Text style={styles.addressText}>{displayText}</Text>
		</View>
	);
};

export default MemoLocation;
