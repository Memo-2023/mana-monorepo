<script lang="ts">
	import { SubscriptionPage } from '@manacore/shared-subscription-ui';

	function handleSubscribe(planId: string) {
		console.log('Subscribe to plan:', planId);
		alert(`Abo "${planId}" ausgewählt. Bezahlsystem wird noch integriert.`);
	}

	function handleBuyPackage(packageId: string) {
		console.log('Buy package:', packageId);
		alert(`Paket "${packageId}" ausgewählt. Bezahlsystem wird noch integriert.`);
	}
</script>

<svelte:head>
	<title>Mana - ManaChat</title>
</svelte:head>

<div class="min-h-screen p-4 md:p-8" style="background-color: hsl(var(--color-background));">
	<div class="mx-auto max-w-6xl">
		<SubscriptionPage
			appName="ManaChat"
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
