<script lang="ts">
	import { SubscriptionPage } from '@manacore/shared-subscription-ui';
	import { toastStore } from '@manacore/shared-ui';

	function handleSubscribe(planId: string) {
		console.log('Subscribe to plan:', planId);
		toastStore.show(`Abo "${planId}" ausgewählt. Bezahlsystem wird noch integriert.`, 'info', 5000);
	}

	function handleBuyPackage(packageId: string) {
		console.log('Buy package:', packageId);
		toastStore.show(
			`Paket "${packageId}" ausgewählt. Bezahlsystem wird noch integriert.`,
			'info',
			5000
		);
	}
</script>

<svelte:head>
	<title>Mana - Picture</title>
</svelte:head>

<div class="min-h-screen p-4 md:p-8" style="background-color: hsl(var(--color-background));">
	<div class="mx-auto max-w-6xl">
		<SubscriptionPage
			appName="Picture"
			onSubscribe={handleSubscribe}
			onBuyPackage={handleBuyPackage}
			currentPlanId="free"
			pageTitle="Wähle dein Abo"
			subscriptionsTitle="Abonnements"
			packagesTitle="Einmal-Pakete"
			yearlyDiscount="2 Monate gratis"
		/>
	</div>
</div>
