import React, { useEffect, useState } from 'react';
import {
	View,
	Text,
	StyleSheet,
	ActivityIndicator,
	Alert,
	ScrollView,
	TouchableOpacity,
	Platform,
} from 'react-native';
import { PurchasesPackage, PACKAGE_TYPE } from 'react-native-purchases';
import {
	getOfferings,
	purchasePackage,
	getCurrentTokenBalance,
	TOKEN_AMOUNTS,
	ENTITLEMENTS,
} from '../../services/revenueCatService';
import { themeClasses, useColorModeValue } from '../../utils/theme/theme';

type TokenStoreProps = {
	onClose?: () => void;
	onPurchaseComplete?: () => void;
};

export const TokenStore: React.FC<TokenStoreProps> = ({ onClose, onPurchaseComplete }) => {
	const [packages, setPackages] = useState<PurchasesPackage[]>([]);
	const [loading, setLoading] = useState(true);
	const [purchasing, setPurchasing] = useState(false);
	const [tokenBalance, setTokenBalance] = useState<number | null>(null);
	const [activeTab, setActiveTab] = useState<'subscription' | 'onetime'>('subscription');

	const bgColor = useColorModeValue('white', 'gray.800');
	const textColor = useColorModeValue('gray.800', 'white');
	const cardBgColor = useColorModeValue('gray.50', 'gray.700');
	const accentColor = useColorModeValue('blue.500', 'blue.300');

	useEffect(() => {
		const loadData = async () => {
			try {
				setLoading(true);

				// Angebote laden
				const offerings = await getOfferings();
				if (offerings) {
					setPackages(offerings);
				}

				// Token-Guthaben laden
				const balance = await getCurrentTokenBalance();
				setTokenBalance(balance);
			} catch (error) {
				console.error('Fehler beim Laden der Store-Daten:', error);
				Alert.alert('Fehler', 'Beim Laden der Angebote ist ein Fehler aufgetreten.');
			} finally {
				setLoading(false);
			}
		};

		loadData();
	}, []);

	const handlePurchase = async (pkg: PurchasesPackage) => {
		try {
			setPurchasing(true);

			// Kaufe das Paket
			const success = await purchasePackage(pkg);

			if (success) {
				// Aktualisiere das Token-Guthaben
				const newBalance = await getCurrentTokenBalance();
				setTokenBalance(newBalance);

				// Benachrichtige den Benutzer
				Alert.alert('Kauf erfolgreich', 'Dein Credit-Guthaben wurde aktualisiert.', [
					{ text: 'OK', onPress: () => onPurchaseComplete?.() },
				]);
			} else {
				// Fehlerbehandlung
				Alert.alert('Kauf fehlgeschlagen', 'Ein unbekannter Fehler ist aufgetreten.');
			}
		} catch (error) {
			console.error('Fehler beim Kauf:', error);
			Alert.alert('Kauf fehlgeschlagen', 'Ein unerwarteter Fehler ist aufgetreten.');
		} finally {
			setPurchasing(false);
		}
	};

	// Diese Funktion wird nicht mehr verwendet, da wir jetzt getCreditsForPackage verwenden

	if (loading) {
		return (
			<View style={[styles.container, { backgroundColor: bgColor }]}>
				<ActivityIndicator size="large" color={accentColor} />
				<Text style={[styles.loadingText, { color: textColor }]}>Angebote werden geladen...</Text>
			</View>
		);
	}

	// Filtere Pakete nach Typ (Abonnement oder Einmalkauf)
	const subscriptionPackages = packages.filter(
		(pkg) => pkg.packageType === PACKAGE_TYPE.MONTHLY || pkg.packageType === PACKAGE_TYPE.ANNUAL
	);

	const onetimePackages = packages.filter(
		(pkg) => pkg.packageType === PACKAGE_TYPE.CUSTOM || pkg.packageType === PACKAGE_TYPE.LIFETIME
	);

	// Formatiere Credits in Millionen
	const formatCredits = (credits: number) => {
		const millions = credits / 1000000;
		return millions.toFixed(1).replace(/\.0$/, '') + ' Mio';
	};

	// Bestimme den Pakettyp basierend auf der Produkt-ID
	const getPackageType = (pkg: PurchasesPackage) => {
		const productId = pkg.product.identifier.toLowerCase();
		if (productId.includes('mini') || productId.includes('plus') || productId.includes('pro')) {
			return 'subscription';
		}
		return 'onetime';
	};

	// Bestimme die Anzahl der Credits basierend auf der Produkt-ID
	const getCreditsForPackage = (pkg: PurchasesPackage): number => {
		const productId = pkg.product.identifier;

		// Abonnements
		if (productId.includes('Mini_5E')) return TOKEN_AMOUNTS[ENTITLEMENTS.MINI_SUB];
		if (productId.includes('Plus_11E')) return TOKEN_AMOUNTS[ENTITLEMENTS.PLUS_SUB];
		if (productId.includes('Pro_18E')) return TOKEN_AMOUNTS[ENTITLEMENTS.PRO_SUB];

		// Einmalkäufe
		if (productId.includes('Small_5E')) return TOKEN_AMOUNTS[ENTITLEMENTS.SMALL_TOKENS];
		if (productId.includes('Medium_10E')) return TOKEN_AMOUNTS[ENTITLEMENTS.MEDIUM_TOKENS];
		if (productId.includes('Large_20E')) return TOKEN_AMOUNTS[ENTITLEMENTS.LARGE_TOKENS];

		return 0;
	};

	return (
		<View style={[styles.container, { backgroundColor: bgColor }]}>
			<Text style={[styles.title, { color: textColor }]}>Credits kaufen</Text>

			{tokenBalance !== null && (
				<View style={styles.balanceContainer}>
					<Text style={[styles.balanceText, { color: textColor }]}>
						Aktuelles Guthaben:{' '}
						<Text style={styles.balanceAmount}>{tokenBalance.toLocaleString()} Credits</Text>
					</Text>
				</View>
			)}

			{/* Tabs für Abonnements und Einmalkäufe */}
			<View style={styles.tabContainer}>
				<TouchableOpacity
					style={[styles.tabButton, activeTab === 'subscription' && styles.activeTabButton]}
					onPress={() => setActiveTab('subscription')}
				>
					<Text
						style={[
							styles.tabButtonText,
							activeTab === 'subscription' && styles.activeTabButtonText,
						]}
					>
						Abonnements
					</Text>
				</TouchableOpacity>
				<TouchableOpacity
					style={[styles.tabButton, activeTab === 'onetime' && styles.activeTabButton]}
					onPress={() => setActiveTab('onetime')}
				>
					<Text
						style={[styles.tabButtonText, activeTab === 'onetime' && styles.activeTabButtonText]}
					>
						Einmalkäufe
					</Text>
				</TouchableOpacity>
			</View>

			<ScrollView style={styles.packagesContainer}>
				{packages.length === 0 ? (
					<Text style={[styles.noPackagesText, { color: textColor }]}>
						Keine Angebote verfügbar. Bitte versuche es später erneut.
					</Text>
				) : activeTab === 'subscription' ? (
					// Abonnements anzeigen
					subscriptionPackages.length > 0 ? (
						subscriptionPackages.map((pkg, index) => (
							<TouchableOpacity
								key={index}
								style={[styles.packageCard, { backgroundColor: cardBgColor }]}
								onPress={() => handlePurchase(pkg)}
								disabled={purchasing}
							>
								<View style={styles.packageInfo}>
									<Text style={[styles.packageTitle, { color: textColor }]}>
										{pkg.product.title}
									</Text>
									<Text style={[styles.packageDescription, { color: textColor }]}>
										{formatCredits(getCreditsForPackage(pkg))} Credits monatlich
									</Text>
									<Text style={[styles.packagePrice, { color: accentColor }]}>
										{pkg.product.priceString} / Monat
									</Text>
								</View>
								<View style={styles.buyButtonContainer}>
									<TouchableOpacity
										style={[styles.buyButton, { backgroundColor: accentColor }]}
										onPress={() => handlePurchase(pkg)}
										disabled={purchasing}
									>
										{purchasing ? (
											<ActivityIndicator size="small" color="white" />
										) : (
											<Text style={styles.buyButtonText}>Abonnieren</Text>
										)}
									</TouchableOpacity>
								</View>
							</TouchableOpacity>
						))
					) : (
						<Text style={[styles.noPackagesText, { color: textColor }]}>
							Keine Abonnements verfügbar. Bitte versuche es später erneut.
						</Text>
					)
				) : // Einmalkäufe anzeigen
				onetimePackages.length > 0 ? (
					onetimePackages.map((pkg, index) => (
						<TouchableOpacity
							key={index}
							style={[styles.packageCard, { backgroundColor: cardBgColor }]}
							onPress={() => handlePurchase(pkg)}
							disabled={purchasing}
						>
							<View style={styles.packageInfo}>
								<Text style={[styles.packageTitle, { color: textColor }]}>{pkg.product.title}</Text>
								<Text style={[styles.packageDescription, { color: textColor }]}>
									{formatCredits(getCreditsForPackage(pkg))} Credits
								</Text>
								<Text style={[styles.packagePrice, { color: accentColor }]}>
									{pkg.product.priceString}
								</Text>
							</View>
							<View style={styles.buyButtonContainer}>
								<TouchableOpacity
									style={[styles.buyButton, { backgroundColor: accentColor }]}
									onPress={() => handlePurchase(pkg)}
									disabled={purchasing}
								>
									{purchasing ? (
										<ActivityIndicator size="small" color="white" />
									) : (
										<Text style={styles.buyButtonText}>Kaufen</Text>
									)}
								</TouchableOpacity>
							</View>
						</TouchableOpacity>
					))
				) : (
					<Text style={[styles.noPackagesText, { color: textColor }]}>
						Keine Einmalkäufe verfügbar. Bitte versuche es später erneut.
					</Text>
				)}
			</ScrollView>

			<TouchableOpacity style={styles.closeButton} onPress={onClose}>
				<Text style={[styles.closeButtonText, { color: textColor }]}>Schließen</Text>
			</TouchableOpacity>
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
		padding: 16,
	},
	title: {
		fontSize: 24,
		fontWeight: 'bold',
		marginBottom: 16,
		textAlign: 'center',
	},
	loadingText: {
		marginTop: 16,
		textAlign: 'center',
	},
	balanceContainer: {
		marginBottom: 24,
		padding: 12,
		borderRadius: 8,
		borderWidth: 1,
		borderColor: '#ddd',
	},
	balanceText: {
		fontSize: 16,
		textAlign: 'center',
	},
	balanceAmount: {
		fontWeight: 'bold',
	},
	tabContainer: {
		flexDirection: 'row',
		marginBottom: 16,
		borderRadius: 8,
		overflow: 'hidden',
		borderWidth: 1,
		borderColor: '#ddd',
	},
	tabButton: {
		flex: 1,
		paddingVertical: 12,
		alignItems: 'center',
		backgroundColor: '#f5f5f5',
	},
	activeTabButton: {
		backgroundColor: '#3b82f6',
	},
	tabButtonText: {
		fontWeight: '600',
		color: '#666',
	},
	activeTabButtonText: {
		color: 'white',
	},
	packagesContainer: {
		flex: 1,
	},
	noPackagesText: {
		textAlign: 'center',
		marginTop: 24,
	},
	packageCard: {
		flexDirection: 'row',
		borderRadius: 8,
		marginBottom: 16,
		padding: 16,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.1,
		shadowRadius: 4,
		elevation: 2,
	},
	packageInfo: {
		flex: 1,
	},
	packageTitle: {
		fontSize: 18,
		fontWeight: 'bold',
		marginBottom: 4,
	},
	packageDescription: {
		fontSize: 14,
		marginBottom: 8,
	},
	packagePrice: {
		fontSize: 16,
		fontWeight: 'bold',
	},
	buyButtonContainer: {
		justifyContent: 'center',
	},
	buyButton: {
		paddingHorizontal: 16,
		paddingVertical: 8,
		borderRadius: 4,
	},
	buyButtonText: {
		color: 'white',
		fontWeight: 'bold',
	},
	closeButton: {
		marginTop: 16,
		padding: 12,
		alignItems: 'center',
	},
	closeButtonText: {
		fontSize: 16,
	},
});

export default TokenStore;
