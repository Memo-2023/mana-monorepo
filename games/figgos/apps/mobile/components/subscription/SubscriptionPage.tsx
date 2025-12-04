import React, { useState } from 'react';
import { View, Text, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../../utils/ThemeContext';
import SubscriptionCard, { SubscriptionPlanProps } from './SubscriptionCard';
import PackageCard, { PackageProps } from './PackageCard';
import CostCard, { CostItem } from './CostCard';
import UsageCard, { UsageDataProps } from './UsageCard';
import BillingToggle from './BillingToggle';
import type { BillingCycle } from './BillingToggle';

// Importieren der Daten aus den JSON-Dateien
import subscriptionData from './subscriptionData.json';
import appCostsData from './appCosts.json';
import usageData from './usageData.json';

// Verwenden der Daten aus den JSON-Dateien
const subscriptionOptions: SubscriptionPlanProps[] =
	subscriptionData.subscriptions as SubscriptionPlanProps[];
const manaPackages: PackageProps[] = subscriptionData.packages as PackageProps[];

// Kosten für verschiedene Aktionen in der App aus der JSON-Datei laden
const appCosts: CostItem[] = appCostsData.costs as CostItem[];

// Nutzungsdaten aus der JSON-Datei laden
const usage: UsageDataProps = usageData.usage as UsageDataProps;

interface SubscriptionPageProps {
	onSubscribe?: (planId: string, billingCycle: BillingCycle) => void;
	onBuyPackage?: (packageId: string) => void;
}

const SubscriptionPage: React.FC<SubscriptionPageProps> = ({ onSubscribe, onBuyPackage }) => {
	const router = useRouter();
	const { theme } = useTheme();
	const [billingCycle, setBillingCycle] = useState<BillingCycle>('monthly');
	// In einer echten App würde dieser Wert aus dem Benutzerprofil oder der API kommen
	const [activeSubscription, setActiveSubscription] = useState<SubscriptionPlanProps>(
		subscriptionOptions[0]
	);

	const handleSubscribe = (planId: string) => {
		if (onSubscribe) {
			onSubscribe(planId, billingCycle);
		} else {
			// Fallback-Verhalten
			console.log(`Subscribing to plan: ${planId}, billing cycle: ${billingCycle}`);

			Alert.alert(
				'Erfolgreich abonniert!',
				`Du hast erfolgreich das ${subscriptionOptions.find((p) => p.id === planId)?.name} Abo abgeschlossen.`,
				[{ text: 'OK', onPress: () => router.back() }]
			);
		}
	};

	const handleBuyPackage = (packageId: string) => {
		if (onBuyPackage) {
			onBuyPackage(packageId);
		} else {
			// Fallback-Verhalten
			console.log(`Buying package: ${packageId}`);

			const selectedPkg = manaPackages.find((p) => p.id === packageId);
			Alert.alert(
				'Erfolgreich gekauft!',
				`Du hast erfolgreich das ${selectedPkg?.name} Paket mit ${selectedPkg?.manaAmount} Mana gekauft.`,
				[{ text: 'OK', onPress: () => router.back() }]
			);
		}
	};

	// Aktualisiere die Abonnement-Optionen basierend auf dem Abrechnungszyklus
	const getSubscriptionPlans = () => {
		// Filtere das kostenlose Abonnement heraus, da es bereits im Aktiv-Bereich angezeigt wird
		// Filtere auch nach dem ausgewählten Abrechnungszyklus
		const paidPlans = subscriptionOptions.filter(
			(plan) => plan.id !== 'free' && plan.billingCycle === billingCycle
		);

		return paidPlans.map((plan) => {
			// Füge die monatliche Preisberechnung für jährliche Abos hinzu
			if (billingCycle === 'yearly' && plan.monthlyEquivalent) {
				return {
					...plan,
					priceBreakdown: `(entspricht ${plan.monthlyEquivalent.toFixed(2).replace('.', ',')}€ pro Monat)`,
				};
			}
			return plan;
		});
	};

	const renderSubscriptionOptions = () => {
		const plans = getSubscriptionPlans();

		return (
			<View className="w-full">
				<BillingToggle
					billingCycle={billingCycle}
					onChange={setBillingCycle}
					yearlyDiscount="50%"
				/>

				<View className="flex-col md:flex-row md:flex-wrap gap-6 mb-6">
					{plans.map((plan) => (
						<View
							key={plan.id}
							className="w-full md:w-[calc(50%-12px)] lg:w-[calc(50%-12px)] xl:w-[calc(33.33%-16px)]"
						>
							<SubscriptionCard plan={plan} onSelect={handleSubscribe} />
						</View>
					))}
				</View>
			</View>
		);
	};

	const renderPackageOptions = () => {
		// Pakete in reguläre und Team-Pakete aufteilen
		const regularPackages = manaPackages.filter((pkg) => !pkg.isTeamPackage);
		const teamPackages = manaPackages.filter((pkg) => pkg.isTeamPackage);

		return (
			<View className="w-full">
				<Text className="text-white text-2xl font-bold mb-2">Mana-Pakete</Text>
				<Text className="text-[rgba(255,255,255,0.7)] text-base mb-6">
					Kaufe einmalig Mana, um mehr Figuren zu generieren.
				</Text>

				<View className="flex-col md:flex-row md:flex-wrap gap-6 mb-8">
					{regularPackages.map((pkg) => (
						<View key={pkg.id} className="w-full md:w-[calc(50%-12px)] lg:w-[calc(33.33%-16px)]">
							<PackageCard package={pkg} onSelect={handleBuyPackage} />
						</View>
					))}
				</View>

				{teamPackages.length > 0 && (
					<>
						<Text className="text-white text-xl font-bold mb-2 mt-8">Team-Pakete</Text>
						<Text className="text-[rgba(255,255,255,0.7)] text-base mb-6">
							Spezielle Pakete für Teams mit mehr Mana und zusätzlichen Funktionen.
						</Text>

						<View className="flex-col md:flex-row md:flex-wrap gap-6 mb-6">
							{teamPackages.map((pkg) => (
								<View
									key={pkg.id}
									className="w-full md:w-[calc(50%-12px)] lg:w-[calc(33.33%-16px)]"
								>
									<PackageCard package={pkg} onSelect={handleBuyPackage} />
								</View>
							))}
						</View>
					</>
				)}
			</View>
		);
	};

	// Filtert beliebte Abonnements und Pakete
	const getPopularItems = () => {
		const popularSubscriptions = subscriptionOptions.filter((sub) => sub.popular);
		const popularPackages = manaPackages.filter((pkg) => pkg.popular);
		return { popularSubscriptions, popularPackages };
	};

	// Render des "Beliebt"-Abschnitts
	const renderPopularSection = () => {
		const { popularSubscriptions, popularPackages } = getPopularItems();

		// Wenn keine beliebten Items vorhanden sind, zeige den Abschnitt nicht an
		if (popularSubscriptions.length === 0 && popularPackages.length === 0) {
			return null;
		}

		return (
			<View className="mb-10">
				<Text className="text-white text-2xl md:text-3xl font-bold mb-4 md:mb-6">Beliebt</Text>

				<View className="flex-col md:flex-row md:flex-wrap gap-6">
					{/* Beliebte Abonnements */}
					{popularSubscriptions.map((plan) => (
						<View key={plan.id} className="w-full md:w-[calc(50%-12px)] lg:w-[calc(33.33%-16px)]">
							<SubscriptionCard plan={{ ...plan, popular: true }} onSelect={handleSubscribe} />
						</View>
					))}

					{/* Beliebte Pakete */}
					{popularPackages.map((pkg) => (
						<View key={pkg.id} className="w-full md:w-[calc(50%-12px)] lg:w-[calc(33.33%-16px)]">
							<PackageCard package={{ ...pkg, popular: true }} onSelect={handleBuyPackage} />
						</View>
					))}
				</View>
			</View>
		);
	};

	// Render des aktiven Abonnements und der Kosten
	const renderActiveSection = () => {
		return (
			<View className="mb-10">
				<Text className="text-white text-2xl md:text-3xl font-bold mb-4 md:mb-6">Aktiv</Text>

				<View className="flex-col md:flex-row lg:flex-row gap-6">
					{/* Aktives Abonnement */}
					<View className="w-full md:w-1/3 lg:w-1/3">
						<SubscriptionCard plan={activeSubscription} onSelect={() => {}} />
					</View>

					{/* Nutzungs-Karte */}
					<View className="w-full md:w-1/3 lg:w-1/3 mt-6 md:mt-0">
						<UsageCard title="Mana-Nutzung" usageData={usage} />
					</View>

					{/* Kosten-Karte */}
					<View className="w-full md:w-1/3 lg:w-1/3 mt-6 md:mt-0">
						<CostCard title="Kosten in der App" costs={appCosts} />
					</View>
				</View>
			</View>
		);
	};

	return (
		<ScrollView
			className="flex-1"
			contentContainerClassName="p-4 pb-8 md:px-8 lg:px-12 xl:px-16 max-w-screen-2xl mx-auto"
		>
			{/* Aktiver Abschnitt */}
			{renderActiveSection()}

			{/* Beliebter Abschnitt */}
			<View className="pt-6 border-t border-t-[rgba(255,255,255,0.1)]">
				{renderPopularSection()}
			</View>

			{/* Abonnements-Abschnitt */}
			<View className="mb-10 pt-6 border-t border-t-[rgba(255,255,255,0.1)]">
				<Text className="text-white text-2xl md:text-3xl font-bold mb-4 md:mb-6">Abonnements</Text>
				{renderSubscriptionOptions()}
			</View>

			{/* Pakete-Abschnitt */}
			<View className="mt-6 pt-6 border-t border-t-[rgba(255,255,255,0.1)]">
				<Text className="text-white text-2xl md:text-3xl font-bold mb-4 md:mb-6">Pakete</Text>
				{renderPackageOptions()}
			</View>
		</ScrollView>
	);
};

export default SubscriptionPage;
