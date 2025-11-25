<script lang="ts">
	import { enhance } from '$app/forms';
	import type { ActionData } from './$types';
	import Navigation from '$lib/components/Navigation.svelte';
	import { page } from '$app/stores';
	import * as m from '$paraglide/messages';

	let { form }: { form: ActionData } = $props();
	let isSubmitting = $state(false);
	let emailSent = $state(false);
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
						d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
					/>
				</svg>
				<h1 class="text-2xl font-bold text-theme-text">{m.auth_reset_password_title()}</h1>
				<p class="mt-2 text-theme-text-muted">
					{m.auth_reset_password_subtitle()}
				</p>
			</div>

			{#if emailSent || form?.success}
				<div
					class="rounded-lg bg-green-50 p-4 text-green-800 dark:bg-green-900/20 dark:text-green-400"
				>
					<div class="flex">
						<svg class="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
							<path
								fill-rule="evenodd"
								d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
								clip-rule="evenodd"
							/>
						</svg>
						<div class="ml-3">
							<p class="text-sm font-medium">{m.auth_reset_email_sent_title()}</p>
							<p class="mt-1 text-sm">
								{m.auth_reset_email_sent_message()}
							</p>
						</div>
					</div>
				</div>

				<div class="mt-6 text-center">
					<a href="/login" class="text-sm text-theme-accent hover:text-theme-accent-hover">
						{m.auth_back_to_login()}
					</a>
				</div>
			{:else}
				<form
					method="POST"
					action="?/requestReset"
					use:enhance={() => {
						isSubmitting = true;
						return async ({ result, update }) => {
							await update();
							isSubmitting = false;
							if (result.type === 'success') {
								emailSent = true;
							}
						};
					}}
				>
					<div class="space-y-4">
						<div>
							<label for="email" class="mb-1 block text-sm font-medium text-theme-text">
								{m.auth_email_address_label()}
							</label>
							<input
								type="email"
								id="email"
								name="email"
								required
								placeholder={m.auth_email_placeholder()}
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
							class="flex w-full items-center justify-center rounded-lg bg-theme-primary px-4 py-3 font-medium text-white transition duration-200 hover:bg-theme-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
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
								{m.auth_send_reset_button_loading()}
							{:else}
								{m.auth_send_reset_button()}
							{/if}
						</button>
					</div>
				</form>

				<div class="mt-6 border-t border-theme-border pt-6 text-center">
					<p class="text-sm text-theme-text-muted">
						{m.auth_remember_password()}
						<a href="/login" class="font-medium text-theme-accent hover:text-theme-accent-hover">
							{m.auth_back_to_login()}
						</a>
					</p>
				</div>
			{/if}
		</div>
	</div>
</div>
