<script lang="ts">
	import { Button, Input } from '@manacore/shared-ui';
	import {
		SettingsPage,
		SettingsSection,
		SettingsCard,
		SettingsRow,
		SettingsDangerZone,
		SettingsDangerButton,
	} from '@manacore/shared-ui';
	import { enhance } from '$app/forms';

	let { data, form } = $props();
	let loading = $state(false);
</script>

<SettingsPage title="Settings" subtitle="Manage your account settings and preferences.">
	<!-- Profile Section -->
	<SettingsSection title="Profile Information">
		{#snippet icon()}
			<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
				/>
			</svg>
		{/snippet}

		<SettingsCard>
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
				class="p-5"
			>
				{#if form?.success}
					<div
						class="mb-4 rounded-lg bg-green-50 p-4 text-sm text-green-800 dark:bg-green-900/20 dark:text-green-400"
					>
						Profile updated successfully!
					</div>
				{/if}

				{#if form?.error}
					<div
						class="mb-4 rounded-lg bg-red-50 p-4 text-sm text-red-800 dark:bg-red-900/20 dark:text-red-400"
					>
						{form.error}
					</div>
				{/if}

				<div class="space-y-4">
					<div>
						<label
							for="email"
							class="mb-2 block text-sm font-medium text-[hsl(var(--foreground))]"
						>
							Email
						</label>
						<Input
							type="email"
							id="email"
							value={data.session?.user?.email || ''}
							disabled
							class="bg-[hsl(var(--muted))]"
						/>
						<p class="mt-1 text-xs text-[hsl(var(--muted-foreground))]">Email cannot be changed</p>
					</div>

					<div>
						<label
							for="firstName"
							class="mb-2 block text-sm font-medium text-[hsl(var(--foreground))]"
						>
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
						<label
							for="lastName"
							class="mb-2 block text-sm font-medium text-[hsl(var(--foreground))]"
						>
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
		</SettingsCard>
	</SettingsSection>

	<!-- Account Info Section -->
	<SettingsSection title="Account Information">
		{#snippet icon()}
			<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
				/>
			</svg>
		{/snippet}

		<SettingsCard>
			<SettingsRow label="Available Credits">
				{#snippet icon()}
					<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
						/>
					</svg>
				{/snippet}
				<span class="text-2xl font-bold text-[hsl(var(--primary))]">
					{data.profile?.credits || 0}
				</span>
			</SettingsRow>

			<SettingsRow label="Subscription Plan">
				{#snippet icon()}
					<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
						/>
					</svg>
				{/snippet}
				<span class="rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-800 dark:bg-blue-900/20 dark:text-blue-400">
					{data.profile?.subscription_plan_id || 'Free'}
				</span>
			</SettingsRow>

			<SettingsRow label="Subscription Status">
				{#snippet icon()}
					<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
						/>
					</svg>
				{/snippet}
				<span
					class="rounded-full px-3 py-1 text-xs font-medium
						{data.profile?.subscription_status === 'active'
						? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
						: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400'}"
				>
					{data.profile?.subscription_status || 'inactive'}
				</span>
			</SettingsRow>

			<SettingsRow label="Member Since" border={false}>
				{#snippet icon()}
					<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
						/>
					</svg>
				{/snippet}
				<span class="text-sm text-[hsl(var(--foreground))]">
					{data.profile?.created_at
						? new Date(data.profile.created_at).toLocaleDateString()
						: 'N/A'}
				</span>
			</SettingsRow>
		</SettingsCard>
	</SettingsSection>

	<!-- Danger Zone -->
	<SettingsDangerZone title="Danger Zone">
		<SettingsDangerButton
			label="Delete Account"
			description="Once you delete your account, there is no going back. Please be certain."
			buttonText="Delete Account"
			onclick={() => {}}
			disabled
			border={false}
		>
			{#snippet icon()}
				<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
					/>
				</svg>
			{/snippet}
		</SettingsDangerButton>
	</SettingsDangerZone>
</SettingsPage>
