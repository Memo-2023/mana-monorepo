<script lang="ts">
	import { enhance } from '$app/forms';
	import type { ActionData, PageData } from './$types';
	import Navigation from '$lib/components/Navigation.svelte';
	import { page } from '$app/stores';
	import { trackAuth } from '$lib/analytics';
	import * as m from '$paraglide/messages';

	let { form, data }: { form: ActionData; data: PageData } = $props();
	let isSubmitting = $state(false);
	let isAdditionalAccount = $derived($page.url.searchParams.get('additional') === 'true');
</script>

<Navigation user={null} currentPath={$page.url.pathname} />

<div class="flex min-h-screen items-center justify-center bg-theme-background p-4">
	<div class="w-full max-w-md">
		<div class="rounded-xl border border-theme-border bg-theme-surface p-8 shadow-xl">
			<div class="mb-6 text-center">
				<svg
					class="mx-auto mb-4 h-12 w-12 text-theme-primary"
					fill="none"
					stroke="currentColor"
					viewBox="0 0 24 24"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
					/>
				</svg>
				<h1 class="text-2xl font-bold text-theme-text">{m.auth_create_account_title()}</h1>
				<p class="mt-2 text-theme-text-muted">{m.auth_create_account_subtitle()}</p>
			</div>

			{#if isAdditionalAccount}
				<div class="mb-6 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-4">
					<div class="flex items-start">
						<svg class="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
						</svg>
						<div class="flex-1">
							<h3 class="text-sm font-medium text-blue-800 dark:text-blue-200">Zusätzlichen Account erstellen</h3>
							<p class="mt-1 text-sm text-blue-700 dark:text-blue-300">
								Du erstellst einen zusätzlichen Account. Nach der Registrierung kannst du zwischen deinen Accounts wechseln.
							</p>
						</div>
					</div>
				</div>
			{:else if data?.invitation}
				<div class="mb-6 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-4">
					<div class="flex items-start">
						<svg class="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
						</svg>
						<div class="flex-1">
							<h3 class="text-sm font-medium text-green-800 dark:text-green-200">Team Invitation</h3>
							<p class="mt-1 text-sm text-green-700 dark:text-green-300">
								{data.invitation.inviterName} has invited you to join their team. Create your account to accept.
							</p>
						</div>
					</div>
				</div>
			{/if}

			<form
				method="POST"
				action="?/register{isAdditionalAccount ? '&additional=true' : ''}"
				use:enhance={() => {
					isSubmitting = true;
					console.log('[CLIENT] Starting registration submission');
					return async ({ result, update }) => {
						console.log('[CLIENT] Registration result:', result);
						console.log('[CLIENT] Result type:', result.type);
						if (result.type === 'failure') {
							console.error('[CLIENT] Registration failed with status:', result.status);
							console.error('[CLIENT] Error data:', result.data);
							if (result.data?.error) {
								console.error('[CLIENT] Error message:', result.data.error);
							}
							// Log all properties of result.data
							console.error('[CLIENT] All error properties:', JSON.stringify(result.data, null, 2));
						}
						await update();
						isSubmitting = false;
						// Track successful signup
						if (result.type === 'redirect') {
							console.log('[CLIENT] Registration successful, redirecting');
							trackAuth('signup', 'email');
						}
					};
				}}
			>
				<div class="space-y-4">
					<div>
						<label for="email" class="mb-1 block text-sm font-medium text-theme-text">
							{m.auth_email_label()}
						</label>
						<input
							type="email"
							id="email"
							name="email"
							required
							value={data?.invitation?.email || ''}
							readonly={!!data?.invitation?.email}
							class="w-full rounded-lg border border-theme-border bg-theme-surface px-3 py-2 text-theme-text placeholder-theme-text-muted focus:ring-2 focus:ring-theme-accent focus:outline-none {data?.invitation?.email ? 'bg-gray-100 dark:bg-gray-800' : ''}"
						/>
						{#if data?.invitation?.token}
							<input type="hidden" name="inviteToken" value={data.invitation.token} />
						{/if}
					</div>

					<div>
						<label for="password" class="mb-1 block text-sm font-medium text-theme-text">
							{m.auth_password_label()}
						</label>
						<input
							type="password"
							id="password"
							name="password"
							required
							minlength="8"
							class="w-full rounded-lg border border-theme-border bg-theme-surface px-3 py-2 text-theme-text placeholder-theme-text-muted focus:ring-2 focus:ring-theme-accent focus:outline-none"
						/>
					</div>

					<div>
						<label for="passwordConfirm" class="mb-1 block text-sm font-medium text-theme-text">
							{m.auth_password_confirm_label()}
						</label>
						<input
							type="password"
							id="passwordConfirm"
							name="passwordConfirm"
							required
							minlength="8"
							class="w-full rounded-lg border border-theme-border bg-theme-surface px-3 py-2 text-theme-text placeholder-theme-text-muted focus:ring-2 focus:ring-theme-accent focus:outline-none"
						/>
						<p class="mt-1 text-xs text-theme-text-muted">
							{m.auth_username_auto()}
						</p>
					</div>

					{#if form?.error}
						<div
							class="animate-fade-in rounded-lg border border-red-400 bg-red-50 p-3 text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400"
						>
							⚠️ {form.error}
						</div>
					{/if}

					<button
						type="submit"
						disabled={isSubmitting}
						class="flex w-full items-center justify-center rounded-lg bg-theme-primary px-4 py-3 font-medium text-theme-background transition duration-200 hover:bg-theme-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
					>
						{#if isSubmitting}
							<svg class="mr-2 h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
								<circle
									class="opacity-25"
									cx="12"
									cy="12"
									r="10"
									stroke="currentColor"
									stroke-width="4"
								></circle>
								<path
									class="opacity-75"
									fill="currentColor"
									d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
								></path>
							</svg>
							{m.auth_register_button_loading()}
						{:else}
							{m.auth_register_button()}
						{/if}
					</button>
				</div>
			</form>

			<div class="mt-6 border-t border-theme-border pt-6 text-center">
				{#if !isAdditionalAccount}
					<p class="text-sm text-theme-text-muted">
						{m.auth_have_account()}
						<a href="/login" class="font-medium text-theme-accent hover:text-theme-accent-hover"
							>{m.auth_sign_in()}</a
						>
					</p>
				{:else}
					<p class="text-sm text-theme-text-muted">
						<a href="/my" class="font-medium text-theme-accent hover:text-theme-accent-hover"
							>Zurück zu meinem Account</a
						>
					</p>
				{/if}
			</div>
		</div>
	</div>
</div>
