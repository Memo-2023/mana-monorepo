import React, { useState, useEffect } from 'react';
import {
	View,
	Text,
	ScrollView,
	TouchableOpacity,
	ActivityIndicator,
	Alert,
	Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import RevenueCat from '~/services/RevenueCat';
import usePremiumStore from '~/store/premiumStore';
// Remove direct import since we handle it conditionally in RevenueCat service

export default function PaywallScreen() {
	const [packages, setPackages] = useState<any[]>([]);
	const [selectedPackage, setSelectedPackage] = useState<any>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [isPurchasing, setIsPurchasing] = useState(false);
	const { setPremium } = usePremiumStore();

	useEffect(() => {
		loadOfferings();
	}, []);

	const loadOfferings = async () => {
		setIsLoading(true);
		console.log('[Paywall] Loading offerings...');
		try {
			const offerings = await RevenueCat.getOfferings();
			console.log('[Paywall] Offerings received:', offerings);

			if (offerings && offerings.availablePackages) {
				console.log('[Paywall] Available packages:', offerings.availablePackages.length);
				offerings.availablePackages.forEach((pkg: any) => {
					console.log(`[Paywall] Package: ${pkg.identifier}, Price: ${pkg.product?.priceString}`);
				});

				setPackages(offerings.availablePackages);
				// Standardmäßig Yearly auswählen (meist in der Mitte)
				const yearlyPackage = offerings.availablePackages.find(
					(p: any) => p.identifier.includes('yearly') || p.packageType === 'ANNUAL'
				);
				setSelectedPackage(yearlyPackage || offerings.availablePackages[0]);
				console.log(
					'[Paywall] Selected package:',
					yearlyPackage?.identifier || offerings.availablePackages[0]?.identifier
				);
			} else {
				console.log('[Paywall] No packages found in offerings');
				Alert.alert('Fehler', 'Keine Abos verfügbar. Bitte versuche es später erneut.');
			}
		} catch (error) {
			console.error('[Paywall] Error loading offerings:', error);
			Alert.alert('Fehler', 'Konnte Abos nicht laden. Bitte versuche es später erneut.');
		} finally {
			setIsLoading(false);
		}
	};

	const handlePurchase = async () => {
		if (!selectedPackage) {
			console.log('[Paywall] No package selected');
			return;
		}

		console.log('[Paywall] Starting purchase for:', selectedPackage.identifier);
		setIsPurchasing(true);
		try {
			const success = await RevenueCat.purchasePackage(selectedPackage);
			console.log('[Paywall] Purchase result:', success);

			if (success) {
				setPremium(true);
				Alert.alert('Erfolgreich!', 'Willkommen bei Zitare Premium! 🎉', [
					{ text: 'OK', onPress: () => router.back() },
				]);
			} else {
				console.log('[Paywall] Purchase failed or was cancelled');
				Alert.alert('Abgebrochen', 'Der Kauf wurde nicht abgeschlossen.');
			}
		} catch (error: any) {
			console.error('[Paywall] Purchase error:', error);
			if (!error.userCancelled) {
				Alert.alert(
					'Fehler',
					`Kauf konnte nicht abgeschlossen werden.\n${error.message || 'Unbekannter Fehler'}`
				);
			}
		} finally {
			setIsPurchasing(false);
		}
	};

	const handleRestore = async () => {
		setIsPurchasing(true);
		try {
			const success = await RevenueCat.restorePurchases();
			if (success) {
				setPremium(true);
				Alert.alert('Wiederhergestellt!', 'Deine Premium-Mitgliedschaft wurde wiederhergestellt.', [
					{ text: 'OK', onPress: () => router.back() },
				]);
			} else {
				Alert.alert('Keine Käufe gefunden', 'Es wurden keine früheren Käufe gefunden.');
			}
		} catch (error) {
			Alert.alert('Fehler', 'Wiederherstellung fehlgeschlagen.');
		} finally {
			setIsPurchasing(false);
		}
	};

	const getPackageDetails = (pkg: any) => {
		const identifier = pkg.identifier.toLowerCase();
		const product = pkg.product;

		if (identifier.includes('lifetime')) {
			return {
				title: 'Lifetime',
				subtitle: 'Einmalig, für immer',
				price: product.priceString,
				badge: 'BEST VALUE',
				gradient: ['#FFD700', '#FFA500'],
			};
		} else if (identifier.includes('yearly') || pkg.packageType === 'ANNUAL') {
			const monthlyPrice = (product.price / 12).toFixed(2);
			return {
				title: 'Jährlich',
				subtitle: `Nur ${monthlyPrice}€/Monat`,
				price: product.priceString + '/Jahr',
				badge: 'SPARE 33%',
				gradient: ['#8B5CF6', '#6366F1'],
			};
		} else {
			return {
				title: 'Monatlich',
				subtitle: 'Flexibel kündbar',
				price: product.priceString + '/Monat',
				badge: null,
				gradient: ['#10B981', '#059669'],
			};
		}
	};

	if (isLoading) {
		return (
			<SafeAreaView className="flex-1 bg-gray-50">
				<View className="flex-1 items-center justify-center">
					<ActivityIndicator size="large" color="#6366F1" />
				</View>
			</SafeAreaView>
		);
	}

	return (
		<SafeAreaView className="flex-1 bg-white">
			<ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
				{/* Header */}
				<View className="px-6 pt-4 pb-2">
					<TouchableOpacity onPress={() => router.back()} className="self-start p-2 -ml-2">
						<Ionicons name="close" size={28} color="#000" />
					</TouchableOpacity>
				</View>

				{/* Title */}
				<View className="px-6 pb-6">
					<Text className="text-3xl font-bold text-center mb-2">Zitare Premium</Text>
					<Text className="text-lg text-gray-600 text-center">Unbegrenzte Inspiration wartet</Text>
				</View>

				{/* Features */}
				<View className="px-6 pb-4">
					<FeatureRow icon="heart" text="Unlimited Favoriten" subtext="statt 5/Tag" />
					<FeatureRow icon="folder" text="Unlimited Sammlungen" subtext="statt 1/Woche" />
					<FeatureRow icon="color-palette" text="50+ Premium Themes" />
					<FeatureRow icon="flash" text="Keine Wartezeiten" />
					<FeatureRow icon="share-social" text="Premium Sharing" />
					<FeatureRow icon="stats-chart" text="Persönliche Statistiken" />
				</View>

				{/* Price Options */}
				<View className="px-6 pb-4">
					{packages.map((pkg, index) => {
						const details = getPackageDetails(pkg);
						const isSelected = selectedPackage?.identifier === pkg.identifier;

						return (
							<TouchableOpacity
								key={pkg.identifier}
								onPress={() => setSelectedPackage(pkg)}
								className={`mb-2.5 rounded-2xl overflow-hidden ${
									isSelected ? 'border-2 border-indigo-500' : 'border border-gray-200'
								}`}
							>
								<LinearGradient
									colors={isSelected ? details.gradient : ['#FFFFFF', '#FFFFFF']}
									className="p-4"
								>
									<View className="flex-row items-center justify-between">
										<View className="flex-1">
											<View className="flex-row items-center">
												<Text
													className={`text-lg font-semibold ${
														isSelected ? 'text-white' : 'text-gray-900'
													}`}
												>
													{details.title}
												</Text>
												{details.badge && (
													<View
														className={`ml-2 px-2 py-1 rounded-full ${
															isSelected ? 'bg-white/20' : 'bg-indigo-100'
														}`}
													>
														<Text
															className={`text-xs font-bold ${
																isSelected ? 'text-white' : 'text-indigo-600'
															}`}
														>
															{details.badge}
														</Text>
													</View>
												)}
											</View>
											<Text
												className={`text-sm mt-1 ${isSelected ? 'text-white/80' : 'text-gray-500'}`}
											>
												{details.subtitle}
											</Text>
										</View>
										<View className="items-end">
											<Text
												className={`text-xl font-bold ${
													isSelected ? 'text-white' : 'text-gray-900'
												}`}
											>
												{details.price}
											</Text>
										</View>
										<View className="ml-3">
											<View
												className={`w-6 h-6 rounded-full border-2 ${
													isSelected ? 'border-white bg-white' : 'border-gray-300'
												}`}
											>
												{isSelected && <View className="flex-1 m-1 rounded-full bg-indigo-500" />}
											</View>
										</View>
									</View>
								</LinearGradient>
							</TouchableOpacity>
						);
					})}
				</View>

				{/* Purchase Button */}
				<View className="px-6 pb-4">
					<TouchableOpacity
						onPress={handlePurchase}
						disabled={isPurchasing || !selectedPackage}
						className="bg-indigo-600 rounded-2xl py-4 shadow-lg"
						style={{ opacity: isPurchasing ? 0.5 : 1 }}
					>
						{isPurchasing ? (
							<ActivityIndicator color="white" />
						) : (
							<Text className="text-white text-center text-lg font-semibold">
								Weiter mit Premium
							</Text>
						)}
					</TouchableOpacity>
				</View>

				{/* Restore & Terms */}
				<View className="px-6 pb-6">
					<TouchableOpacity onPress={handleRestore} disabled={isPurchasing} className="py-2">
						<Text className="text-center text-indigo-600 font-medium">Käufe wiederherstellen</Text>
					</TouchableOpacity>

					<Text className="text-center text-xs text-gray-400 mt-4">
						Mit dem Kauf stimmst du unseren AGB und Datenschutzbestimmungen zu.
						{'\n'}Abos verlängern sich automatisch, können aber jederzeit gekündigt werden.
					</Text>
				</View>
			</ScrollView>
		</SafeAreaView>
	);
}

function FeatureRow({ icon, text, subtext }: { icon: string; text: string; subtext?: string }) {
	return (
		<View className="flex-row items-center py-2">
			<View className="w-9 h-9 rounded-full bg-indigo-100 items-center justify-center mr-3">
				<Ionicons name={icon as any} size={18} color="#6366F1" />
			</View>
			<View className="flex-1">
				<Text className="text-sm font-medium text-gray-900">{text}</Text>
				{subtext && <Text className="text-xs text-gray-500">{subtext}</Text>}
			</View>
			<Ionicons name="checkmark-circle" size={22} color="#10B981" />
		</View>
	);
}
