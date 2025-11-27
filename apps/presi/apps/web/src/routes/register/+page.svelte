<script lang="ts">
	import { goto } from '$app/navigation';
	import { auth } from '$lib/stores/auth.svelte';
	import { Presentation, Mail, Lock, AlertCircle } from 'lucide-svelte';

	let email = $state('');
	let password = $state('');
	let confirmPassword = $state('');
	let error = $state('');
	let isLoading = $state(false);

	async function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		error = '';

		if (password !== confirmPassword) {
			error = 'Passwords do not match';
			return;
		}

		if (password.length < 6) {
			error = 'Password must be at least 6 characters';
			return;
		}

		isLoading = true;

		try {
			await auth.register(email, password);
			goto('/');
		} catch (e) {
			error = e instanceof Error ? e.message : 'Registration failed';
		} finally {
			isLoading = false;
		}
	}
</script>

<svelte:head>
	<title>Register - Presi</title>
</svelte:head>

<div class="min-h-screen flex items-center justify-center px-4">
	<div class="w-full max-w-md">
		<div class="text-center mb-8">
			<div class="flex justify-center mb-4">
				<div class="p-3 bg-primary-100 dark:bg-primary-900/30 rounded-xl">
					<Presentation class="w-10 h-10 text-primary-600 dark:text-primary-400" />
				</div>
			</div>
			<h1 class="text-2xl font-bold text-slate-900 dark:text-white">Create account</h1>
			<p class="text-slate-600 dark:text-slate-400 mt-1">Start creating amazing presentations</p>
		</div>

		<form
			onsubmit={handleSubmit}
			class="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 space-y-4"
		>
			{#if error}
				<div
					class="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 text-sm"
				>
					<AlertCircle class="w-4 h-4 flex-shrink-0" />
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

			<div>
				<label
					for="password"
					class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
				>
					Password
				</label>
				<div class="relative">
					<Lock class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
					<input
						type="password"
						id="password"
						bind:value={password}
						required
						class="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
						placeholder="••••••••"
					/>
				</div>
			</div>

			<div>
				<label
					for="confirmPassword"
					class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
				>
					Confirm Password
				</label>
				<div class="relative">
					<Lock class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
					<input
						type="password"
						id="confirmPassword"
						bind:value={confirmPassword}
						required
						class="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
						placeholder="••••••••"
					/>
				</div>
			</div>

			<button
				type="submit"
				disabled={isLoading}
				class="w-full py-2 px-4 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
			>
				{isLoading ? 'Creating account...' : 'Create account'}
			</button>

			<p class="text-center text-sm text-slate-600 dark:text-slate-400">
				Already have an account?
				<a href="/login" class="text-primary-600 hover:text-primary-700 font-medium">Sign in</a>
			</p>
		</form>
	</div>
</div>
