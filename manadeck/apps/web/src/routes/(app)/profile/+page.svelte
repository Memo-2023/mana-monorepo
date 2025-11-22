<script lang="ts">
	import { authStore } from '$lib/stores/authStore.svelte';
	import Card from '$lib/components/ui/Card.svelte';
	import Button from '$lib/components/ui/Button.svelte';

	let credits = $state<number | null>(null);
	let loadingCredits = $state(false);

	async function loadCredits() {
		loadingCredits = true;
		try {
			const { authService } = await import('$lib/services/authService');
			const balance = await authService.getCreditBalance();
			credits = balance.credits;
		} catch (error) {
			console.error('Failed to load credits:', error);
		} finally {
			loadingCredits = false;
		}
	}
</script>

<svelte:head>
	<title>Profile - Manadeck</title>
</svelte:head>

<div class="space-y-6">
	<div>
		<h1 class="text-3xl font-bold">Profile</h1>
		<p class="text-muted-foreground mt-1">
			Manage your account and settings
		</p>
	</div>

	<!-- User Info -->
	<Card>
		<div class="space-y-4">
			<div class="flex items-center space-x-4">
				<div class="h-16 w-16 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-2xl font-bold">
					{authStore.user?.email?.[0].toUpperCase() || 'U'}
				</div>
				<div>
					<h2 class="text-xl font-semibold">{authStore.user?.email || 'User'}</h2>
					<p class="text-sm text-muted-foreground">Member since {new Date().toLocaleDateString()}</p>
				</div>
			</div>
		</div>
	</Card>

	<!-- Credits -->
	<Card>
		<div class="flex items-center justify-between">
			<div>
				<h3 class="text-lg font-semibold mb-1">Mana Credits</h3>
				<p class="text-sm text-muted-foreground">
					Use credits for AI features
				</p>
			</div>
			<div class="text-right">
				{#if loadingCredits}
					<div class="text-2xl font-bold">...</div>
				{:else if credits !== null}
					<div class="text-2xl font-bold">⚡ {credits}</div>
				{:else}
					<Button size="sm" onclick={loadCredits}>Load Balance</Button>
				{/if}
			</div>
		</div>
	</Card>

	<!-- Settings -->
	<Card>
		<h3 class="text-lg font-semibold mb-4">Settings</h3>
		<div class="space-y-3 text-sm text-muted-foreground">
			<div class="flex items-center justify-between py-2 border-b border-border">
				<span>Theme</span>
				<span>System</span>
			</div>
			<div class="flex items-center justify-between py-2 border-b border-border">
				<span>Notifications</span>
				<span>Enabled</span>
			</div>
			<div class="flex items-center justify-between py-2">
				<span>Study Reminders</span>
				<span>Daily</span>
			</div>
		</div>
	</Card>
</div>
