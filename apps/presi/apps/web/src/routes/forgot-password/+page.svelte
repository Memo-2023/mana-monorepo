<script lang="ts">
	import { goto } from '$app/navigation';
	import { Presentation, Mail, ArrowLeft, CheckCircle } from 'lucide-svelte';
	import { PUBLIC_MANA_CORE_AUTH_URL } from '$env/static/public';

	let email = $state('');
	let error = $state('');
	let isLoading = $state(false);
	let resetSent = $state(false);

	const AUTH_URL = PUBLIC_MANA_CORE_AUTH_URL || 'http://localhost:3001';

	async function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		error = '';

		if (!email.trim()) {
			error = 'Please enter your email address';
			return;
		}

		isLoading = true;

		try {
			const response = await fetch(`${AUTH_URL}/auth/forgot-password`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email }),
			});

			if (!response.ok) {
				const data = await response.json();
				throw new Error(data.message || 'Failed to send reset email');
			}

			resetSent = true;
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to send reset email';
		} finally {
			isLoading = false;
		}
	}
</script>

<svelte:head>
	<title>Forgot Password - Presi</title>
</svelte:head>

<div class="min-h-screen flex items-center justify-center px-4">
	<div class="w-full max-w-md">
		<div class="text-center mb-8">
			<div class="flex justify-center mb-4">
				<div class="p-3 bg-primary-100 dark:bg-primary-900/30 rounded-xl">
					<Presentation class="w-10 h-10 text-primary-600 dark:text-primary-400" />
				</div>
			</div>
			<h1 class="text-2xl font-bold text-slate-900 dark:text-white">
				{resetSent ? 'Check your email' : 'Reset password'}
			</h1>
			<p class="text-slate-600 dark:text-slate-400 mt-1">
				{resetSent
					? `We've sent reset instructions to ${email}`
					: 'Enter your email to receive reset instructions'}
			</p>
		</div>

		{#if resetSent}
			<div class="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 text-center">
				<div class="flex justify-center mb-4">
					<div class="p-3 bg-green-100 dark:bg-green-900/30 rounded-full">
						<CheckCircle class="w-8 h-8 text-green-600 dark:text-green-400" />
					</div>
				</div>
				<p class="text-slate-600 dark:text-slate-400 mb-6">
					If an account exists with this email, you'll receive password reset instructions shortly.
				</p>
				<a
					href="/login"
					class="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors"
				>
					<ArrowLeft class="w-4 h-4" />
					Back to login
				</a>
			</div>
		{:else}
			<form
				onsubmit={handleSubmit}
				class="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 space-y-4"
			>
				{#if error}
					<div
						class="p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 text-sm"
					>
						{error}
					</div>
				{/if}

				<div>
					<label
						for="email"
						class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
					>
						Email
					</label>
					<div class="relative">
						<Mail class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
						<input
							type="email"
							id="email"
							bind:value={email}
							required
							class="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
							placeholder="you@example.com"
						/>
					</div>
				</div>

				<button
					type="submit"
					disabled={isLoading}
					class="w-full py-2 px-4 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
				>
					{isLoading ? 'Sending...' : 'Send reset instructions'}
				</button>

				<p class="text-center text-sm text-slate-600 dark:text-slate-400">
					<a href="/login" class="text-primary-600 hover:text-primary-700 font-medium"
						>Back to login</a
					>
				</p>
			</form>
		{/if}
	</div>
</div>
