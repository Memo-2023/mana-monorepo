<script lang="ts">
	import { authStore } from '$lib/stores/auth.svelte';
	import { goto } from '$app/navigation';
	import Card from '$lib/components/ui/Card.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import ThemePicker from '$lib/components/settings/ThemePicker.svelte';

	let isLoggingOut = $state(false);

	async function handleLogout() {
		isLoggingOut = true;
		try {
			await authStore.signOut();
			goto('/');
		} catch (error) {
			console.error('Error logging out:', error);
			alert('Failed to log out');
		} finally {
			isLoggingOut = false;
		}
	}

	function formatDate(dateString: string | undefined) {
		if (!dateString) return 'Unknown';
		const date = new Date(dateString);
		return new Intl.DateTimeFormat('de-DE', {
			day: '2-digit',
			month: 'long',
			year: 'numeric',
		}).format(date);
	}
</script>

<svelte:head>
	<title>Profile - Picture</title>
</svelte:head>

<div class="container mx-auto px-4 py-8">
	<div class="mb-8">
		<h1 class="text-3xl font-bold text-gray-900 dark:text-gray-100">Profile</h1>
		<p class="mt-2 text-gray-600 dark:text-gray-400">Manage your account settings</p>
	</div>

	<div class="mx-auto max-w-3xl space-y-6">
		<!-- Account Information -->
		<Card>
			<div class="p-6">
				<h2 class="mb-6 text-xl font-semibold text-gray-900 dark:text-gray-100">
					Account Information
				</h2>

				<div class="space-y-4">
					<!-- Email -->
					<div
						class="flex items-center justify-between border-b border-gray-200 pb-4 dark:border-gray-700"
					>
						<div>
							<h3 class="text-sm font-medium text-gray-500 dark:text-gray-400">Email</h3>
							<p class="mt-1 text-gray-900 dark:text-gray-100">{authStore.user?.email || 'Not available'}</p>
						</div>
						{#if authStore.user?.email}
							<span class="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-800">
								Verified
							</span>
						{:else}
							<span
								class="rounded-full bg-yellow-100 px-3 py-1 text-xs font-medium text-yellow-800"
							>
								Not verified
							</span>
						{/if}
					</div>

					<!-- User ID -->
					<div class="flex items-center justify-between border-b border-gray-200 pb-4">
						<div>
							<h3 class="text-sm font-medium text-gray-500">User ID</h3>
							<p class="mt-1 font-mono text-sm text-gray-900">{authStore.user?.id || 'Not available'}</p>
						</div>
					</div>

					<!-- Created At -->
					<div class="flex items-center justify-between">
						<div>
							<h3 class="text-sm font-medium text-gray-500">Member Since</h3>
							<p class="mt-1 text-gray-900">-</p>
						</div>
					</div>
				</div>
			</div>
		</Card>

		<!-- Theme Settings -->
		<div>
			<h2 class="mb-4 text-xl font-semibold text-gray-900 dark:text-gray-100">Appearance</h2>
			<ThemePicker />
		</div>

		<!-- Settings -->
		<Card>
			<div class="p-6">
				<h2 class="mb-6 text-xl font-semibold text-gray-900 dark:text-gray-100">Settings</h2>

				<div class="space-y-4">
					<!-- Language -->
					<div class="flex items-center justify-between">
						<div>
							<h3 class="text-sm font-medium text-gray-700 dark:text-gray-300">Language</h3>
							<p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
								Select your preferred language
							</p>
						</div>
						<select
							class="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
						>
							<option value="de">Deutsch</option>
							<option value="en">English</option>
						</select>
					</div>
				</div>
			</div>
		</Card>

		<!-- Statistics -->
		<Card>
			<div class="p-6">
				<h2 class="mb-6 text-xl font-semibold text-gray-900">Statistics</h2>

				<div class="grid grid-cols-2 gap-4 sm:grid-cols-3">
					<div class="rounded-lg bg-blue-50 p-4">
						<p class="text-sm font-medium text-blue-600">Total Images</p>
						<p class="mt-2 text-2xl font-bold text-blue-900">-</p>
					</div>
					<div class="rounded-lg bg-green-50 p-4">
						<p class="text-sm font-medium text-green-600">Generated</p>
						<p class="mt-2 text-2xl font-bold text-green-900">-</p>
					</div>
					<div class="rounded-lg bg-purple-50 p-4">
						<p class="text-sm font-medium text-purple-600">Archived</p>
						<p class="mt-2 text-2xl font-bold text-purple-900">-</p>
					</div>
				</div>
				<p class="mt-4 text-sm text-gray-500">Statistics coming soon...</p>
			</div>
		</Card>

		<!-- Danger Zone -->
		<Card>
			<div class="p-6">
				<h2 class="mb-6 text-xl font-semibold text-red-600">Danger Zone</h2>

				<div class="space-y-4">
					<div
						class="flex items-center justify-between rounded-lg border border-red-200 bg-red-50 p-4"
					>
						<div>
							<h3 class="font-medium text-red-900">Log Out</h3>
							<p class="mt-1 text-sm text-red-700">Sign out of your account</p>
						</div>
						<Button variant="danger" onclick={handleLogout} loading={isLoggingOut}>
							{isLoggingOut ? 'Logging out...' : 'Log Out'}
						</Button>
					</div>

					<div
						class="flex items-center justify-between rounded-lg border border-red-200 bg-red-50 p-4"
					>
						<div>
							<h3 class="font-medium text-red-900">Delete Account</h3>
							<p class="mt-1 text-sm text-red-700">Permanently delete your account and all data</p>
						</div>
						<Button
							variant="danger"
							onclick={() => alert('Account deletion is not yet implemented')}
						>
							Delete Account
						</Button>
					</div>
				</div>
			</div>
		</Card>
	</div>
</div>
