<script lang="ts">
	import { Card, Button, Input } from '@manacore/shared-ui';
	import { enhance } from '$app/forms';

	let { data, form } = $props();
	let loading = $state(false);
</script>

<div>
	<div class="mb-8">
		<h1 class="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>
		<p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
			Manage your account settings and preferences
		</p>
	</div>

	<div class="grid gap-6 lg:grid-cols-2">
		<!-- Profile Settings -->
		<Card>
			<h2 class="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Profile Information</h2>

			<form
				method="POST"
				action="?/updateProfile"
				use:enhance={() => {
					loading = true;
					return async ({ update }) => {
						await update();
						loading = false;
					};
				}}
			>
				{#if form?.success}
					<div class="mb-4 rounded-lg bg-green-50 p-4 text-sm text-green-800 dark:bg-green-900/20 dark:text-green-400">
						Profile updated successfully!
					</div>
				{/if}

				{#if form?.error}
					<div class="mb-4 rounded-lg bg-red-50 p-4 text-sm text-red-800 dark:bg-red-900/20 dark:text-red-400">
						{form.error}
					</div>
				{/if}

				<div class="space-y-4">
					<div>
						<label for="email" class="mb-2 block text-sm font-medium text-gray-900 dark:text-gray-100">
							Email
						</label>
						<Input
							type="email"
							id="email"
							value={data.session?.user?.email || ''}
							disabled
							class="bg-gray-50 dark:bg-gray-900"
						/>
						<p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
							Email cannot be changed
						</p>
					</div>

					<div>
						<label for="firstName" class="mb-2 block text-sm font-medium text-gray-900 dark:text-gray-100">
							First Name
						</label>
						<Input
							type="text"
							id="firstName"
							name="firstName"
							placeholder="John"
							value={data.profile?.first_name || ''}
						/>
					</div>

					<div>
						<label for="lastName" class="mb-2 block text-sm font-medium text-gray-900 dark:text-gray-100">
							Last Name
						</label>
						<Input
							type="text"
							id="lastName"
							name="lastName"
							placeholder="Doe"
							value={data.profile?.last_name || ''}
						/>
					</div>

					<Button type="submit" {loading} class="w-full">
						{loading ? 'Saving...' : 'Save Changes'}
					</Button>
				</div>
			</form>
		</Card>

		<!-- Account Stats -->
		<Card>
			<h2 class="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Account Information</h2>

			<div class="space-y-4">
				<div>
					<div class="mb-1 flex items-center justify-between">
						<span class="text-sm font-medium text-gray-600 dark:text-gray-400">Available Credits</span>
						<span class="text-2xl font-bold text-primary-600 dark:text-primary-400">
							{data.profile?.credits || 0}
						</span>
					</div>
				</div>

				<div class="border-t border-gray-200 pt-4 dark:border-gray-700">
					<div class="flex items-center justify-between">
						<span class="text-sm font-medium text-gray-600 dark:text-gray-400">Subscription Plan</span>
						<span class="rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-800 dark:bg-blue-900/20 dark:text-blue-400">
							{data.profile?.subscription_plan_id || 'Free'}
						</span>
					</div>
				</div>

				<div class="flex items-center justify-between">
					<span class="text-sm font-medium text-gray-600 dark:text-gray-400">Subscription Status</span>
					<span class="rounded-full {data.profile?.subscription_status === 'active' ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400'} px-3 py-1 text-xs font-medium">
						{data.profile?.subscription_status || 'inactive'}
					</span>
				</div>

				<div class="flex items-center justify-between">
					<span class="text-sm font-medium text-gray-600 dark:text-gray-400">Member Since</span>
					<span class="text-sm text-gray-900 dark:text-white">
						{data.profile?.created_at ? new Date(data.profile.created_at).toLocaleDateString() : 'N/A'}
					</span>
				</div>
			</div>
		</Card>

		<!-- Danger Zone -->
		<Card class="border-red-200 dark:border-red-800">
			<h2 class="mb-4 text-lg font-semibold text-red-900 dark:text-red-400">Danger Zone</h2>

			<div class="space-y-4">
				<div>
					<h3 class="mb-2 font-medium text-gray-900 dark:text-white">Delete Account</h3>
					<p class="mb-4 text-sm text-gray-600 dark:text-gray-400">
						Once you delete your account, there is no going back. Please be certain.
					</p>
					<Button variant="danger" disabled>
						Delete Account
					</Button>
				</div>
			</div>
		</Card>
	</div>
</div>
