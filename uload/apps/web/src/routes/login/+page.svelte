<script lang="ts">
	import { enhance } from '$app/forms';
	import type { ActionData, PageData } from './$types';
	import Navigation from '$lib/components/Navigation.svelte';
	import { page } from '$app/stores';
	import { trackAuth } from '$lib/analytics';
	import * as m from '$paraglide/messages';
	import { toastMessages, notify } from '$lib/services/toast';
	import { onMount } from 'svelte';

	let { form, data }: { form: ActionData; data: PageData } = $props();
	let isSubmitting = $state(false);

	// Check URL parameters for messages
	const justRegistered = $page.url.searchParams.get('registered') === 'true';
	const userEmail = $page.url.searchParams.get('email') || '';
	const emailVerified = $page.url.searchParams.get('verified') === 'true';
	const errorType = $page.url.searchParams.get('error');
	const note = $page.url.searchParams.get('note');
	const isAdditional = $derived(data?.isAdditional || false);

	// Show toasts for URL parameters
	onMount(() => {
		if (emailVerified) {
			if (note === 'already-verified') {
				notify.info(m.auth_email_already_verified_notify(), m.auth_email_already_verified_notify_desc());
			} else {
				toastMessages.emailVerified();
			}
		} else if (errorType === 'token-expired') {
			notify.warning(m.auth_token_expired_notify(), m.auth_token_expired_notify_desc());
		} else if (justRegistered) {
			toastMessages.registerSuccess();
		}
	});
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
						d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
					/>
				</svg>
				<h1 class="text-2xl font-bold text-theme-text">
					{isAdditional ? m.auth_add_account() : m.auth_welcome_back()}
				</h1>
				<p class="mt-2 text-theme-text-muted">
					{isAdditional ? m.auth_add_account_subtitle() : m.auth_welcome_back_subtitle()}
				</p>
			</div>

			{#if isAdditional}
				<div class="mb-6 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-4">
					<div class="flex items-start">
						<svg class="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
						</svg>
						<div class="flex-1">
							<h3 class="text-sm font-medium text-blue-800 dark:text-blue-200">{m.auth_add_account_info()}</h3>
							<p class="mt-1 text-sm text-blue-700 dark:text-blue-300">
								{m.auth_add_account_switch_info()}
							</p>
						</div>
					</div>
				</div>
			{:else if emailVerified}
				<div
					class="mb-4 rounded-lg border border-green-200 bg-green-50 p-4 text-green-800 dark:border-green-800 dark:bg-green-900/20 dark:text-green-400"
				>
					<div class="flex items-start">
						<svg
							class="mt-0.5 h-5 w-5 flex-shrink-0 text-green-400"
							viewBox="0 0 20 20"
							fill="currentColor"
						>
							<path
								fill-rule="evenodd"
								d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
								clip-rule="evenodd"
							/>
						</svg>
						<div class="ml-3">
							{#if note === 'already-verified'}
								<p class="text-sm font-medium">
									{m.auth_email_already_verified()}
								</p>
								<p class="mt-1 text-sm">
									{m.auth_email_already_verified_message()}
								</p>
							{:else}
								<p class="text-sm font-medium">
									{m.auth_email_verified()}
								</p>
								<p class="mt-1 text-sm">
									{m.auth_email_verified_message()}
								</p>
							{/if}
						</div>
					</div>
				</div>
			{:else if errorType === 'token-expired'}
				<div
					class="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-800 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-400"
				>
					<div class="flex items-start">
						<svg
							class="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-400"
							viewBox="0 0 20 20"
							fill="currentColor"
						>
							<path
								fill-rule="evenodd"
								d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
								clip-rule="evenodd"
							/>
						</svg>
						<div class="ml-3">
							<p class="text-sm font-medium">
								{m.auth_verification_link_expired()}
							</p>
							<p class="mt-1 text-sm">
								{m.auth_verification_link_expired_message()}
							</p>
						</div>
					</div>
				</div>
			{:else if errorType === 'invalid-token'}
				<div
					class="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-red-800 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400"
				>
					<div class="flex items-start">
						<svg
							class="mt-0.5 h-5 w-5 flex-shrink-0 text-red-400"
							viewBox="0 0 20 20"
							fill="currentColor"
						>
							<path
								fill-rule="evenodd"
								d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
								clip-rule="evenodd"
							/>
						</svg>
						<div class="ml-3">
							<p class="text-sm font-medium">
								{m.auth_invalid_verification_link()}
							</p>
							<p class="mt-1 text-sm">
								{m.auth_invalid_verification_link_message()}
							</p>
						</div>
					</div>
				</div>
			{:else if justRegistered}
				<div
					class="mb-4 rounded-lg border border-blue-200 bg-blue-50 p-4 text-blue-800 dark:border-blue-800 dark:bg-blue-900/20 dark:text-blue-400"
				>
					<div class="flex items-start">
						<svg
							class="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-400"
							viewBox="0 0 20 20"
							fill="currentColor"
						>
							<path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
							<path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
						</svg>
						<div class="ml-3">
							<p class="text-sm font-medium">
								{m.auth_registration_success()}
							</p>
							<p class="mt-1 text-sm">
								{m.auth_registration_success_message({ email: userEmail })}
							</p>
							<p class="mt-3 text-xs opacity-75">
								{m.auth_registration_tip()}
							</p>
						</div>
					</div>
				</div>
			{/if}

			<form
				method="POST"
				action="?/login{isAdditional ? '&additional=true' : ''}"
				use:enhance={() => {
					isSubmitting = true;
					return async ({ result, update }) => {
						if (result.type === 'redirect') {
							// Track successful login
							trackAuth('login', 'email');
							toastMessages.loginSuccess();
							// Reset submitting state before redirect
							isSubmitting = false;
							// Let the redirect happen
							await update();
						} else if (result.type === 'failure' && result.data?.error) {
							toastMessages.loginError(result.data.error);
							await update();
							isSubmitting = false;
						} else {
							await update();
							isSubmitting = false;
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
							class="w-full rounded-lg border border-theme-border bg-theme-surface px-3 py-2 text-theme-text placeholder-theme-text-muted focus:ring-2 focus:ring-theme-accent focus:outline-none"
						/>
					</div>

					<div>
						<div class="mb-1 flex items-center justify-between">
							<label for="password" class="block text-sm font-medium text-theme-text">
								{m.auth_password_label()}
							</label>
							<a
								href="/forgot-password"
								class="text-sm text-theme-accent hover:text-theme-accent-hover"
							>
								{m.auth_forgot_password()}
							</a>
						</div>
						<input
							type="password"
							id="password"
							name="password"
							required
							class="w-full rounded-lg border border-theme-border bg-theme-surface px-3 py-2 text-theme-text placeholder-theme-text-muted focus:ring-2 focus:ring-theme-accent focus:outline-none"
						/>
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
							{m.auth_login_button_loading()}
						{:else}
							{m.auth_login_button()}
						{/if}
					</button>
				</div>
			</form>

			<div class="mt-6 border-t border-theme-border pt-6 text-center">
				{#if isAdditional}
					<p class="text-sm text-theme-text-muted">
						Noch keinen Account?
						<a href="/register?additional=true" class="font-medium text-theme-accent hover:text-theme-accent-hover"
							>Neuen Account erstellen</a
						>
					</p>
					<p class="mt-2 text-sm text-theme-text-muted">
						<a href="/my" class="font-medium text-theme-accent hover:text-theme-accent-hover"
							>Zurück zu meinem Account</a
						>
					</p>
				{:else}
					<p class="text-sm text-theme-text-muted">
						{m.auth_no_account()}
						<a href="/register" class="font-medium text-theme-accent hover:text-theme-accent-hover"
							>{m.auth_create_account()}</a
						>
					</p>
				{/if}
			</div>
		</div>
	</div>
</div>
