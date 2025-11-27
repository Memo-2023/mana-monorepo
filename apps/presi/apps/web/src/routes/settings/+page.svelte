<script lang="ts">
	import { goto } from '$app/navigation';
	import { auth } from '$lib/stores/auth.svelte';
	import { User, Mail, Shield, LogOut, Sun, Moon, Monitor } from 'lucide-svelte';
	import { onMount } from 'svelte';

	type ThemeMode = 'light' | 'dark' | 'system';
	let themeMode = $state<ThemeMode>('system');

	onMount(() => {
		const saved = localStorage.getItem('theme') as ThemeMode | null;
		if (saved === 'light' || saved === 'dark') {
			themeMode = saved;
		} else {
			themeMode = 'system';
		}
	});

	function setTheme(mode: ThemeMode) {
		themeMode = mode;
		if (mode === 'system') {
			localStorage.removeItem('theme');
			const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
			document.documentElement.classList.toggle('dark', prefersDark);
		} else {
			localStorage.setItem('theme', mode);
			document.documentElement.classList.toggle('dark', mode === 'dark');
		}
	}

	function handleLogout() {
		auth.logout();
		goto('/login');
	}
</script>

<svelte:head>
	<title>Settings - Presi</title>
</svelte:head>

<div class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
	<h1 class="text-2xl font-bold text-slate-900 dark:text-white mb-8">Settings</h1>

	<div class="space-y-6">
		<!-- Account Section -->
		<div
			class="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden"
		>
			<div class="p-4 border-b border-slate-200 dark:border-slate-700">
				<h2 class="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
					<User class="w-5 h-5 text-slate-400" />
					Account
				</h2>
			</div>
			<div class="p-4 space-y-4">
				<div class="flex items-center justify-between py-2">
					<div class="flex items-center gap-3">
						<Mail class="w-5 h-5 text-slate-400" />
						<div>
							<p class="text-sm font-medium text-slate-700 dark:text-slate-300">Email</p>
							<p class="text-sm text-slate-500 dark:text-slate-400">{auth.user?.email}</p>
						</div>
					</div>
				</div>
				<div class="flex items-center justify-between py-2">
					<div class="flex items-center gap-3">
						<Shield class="w-5 h-5 text-slate-400" />
						<div>
							<p class="text-sm font-medium text-slate-700 dark:text-slate-300">User ID</p>
							<p class="text-sm text-slate-500 dark:text-slate-400 font-mono">{auth.user?.id}</p>
						</div>
					</div>
				</div>
			</div>
		</div>

		<!-- Appearance Section -->
		<div
			class="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden"
		>
			<div class="p-4 border-b border-slate-200 dark:border-slate-700">
				<h2 class="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
					<Sun class="w-5 h-5 text-slate-400" />
					Appearance
				</h2>
			</div>
			<div class="p-4">
				<p class="text-sm text-slate-600 dark:text-slate-400 mb-4">Choose your preferred theme</p>
				<div class="grid grid-cols-3 gap-3">
					<button
						onclick={() => setTheme('light')}
						class="flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-colors {themeMode ===
						'light'
							? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30'
							: 'border-slate-200 dark:border-slate-600'}"
					>
						<Sun class="w-6 h-6 text-amber-500" />
						<span class="text-sm font-medium text-slate-700 dark:text-slate-300">Light</span>
					</button>
					<button
						onclick={() => setTheme('dark')}
						class="flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-colors {themeMode ===
						'dark'
							? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30'
							: 'border-slate-200 dark:border-slate-600'}"
					>
						<Moon class="w-6 h-6 text-indigo-500" />
						<span class="text-sm font-medium text-slate-700 dark:text-slate-300">Dark</span>
					</button>
					<button
						onclick={() => setTheme('system')}
						class="flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-colors {themeMode ===
						'system'
							? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30'
							: 'border-slate-200 dark:border-slate-600'}"
					>
						<Monitor class="w-6 h-6 text-slate-500" />
						<span class="text-sm font-medium text-slate-700 dark:text-slate-300">System</span>
					</button>
				</div>
			</div>
		</div>

		<!-- Danger Zone -->
		<div
			class="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-red-200 dark:border-red-900/50 overflow-hidden"
		>
			<div class="p-4 border-b border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-900/20">
				<h2 class="text-lg font-semibold text-red-700 dark:text-red-400">Danger Zone</h2>
			</div>
			<div class="p-4">
				<div class="flex items-center justify-between">
					<div>
						<p class="text-sm font-medium text-slate-700 dark:text-slate-300">Sign out</p>
						<p class="text-sm text-slate-500 dark:text-slate-400">
							Sign out of your account on this device
						</p>
					</div>
					<button
						onclick={handleLogout}
						class="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors"
					>
						<LogOut class="w-4 h-4" />
						Sign out
					</button>
				</div>
			</div>
		</div>
	</div>
</div>
