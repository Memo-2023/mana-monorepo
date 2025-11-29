<script lang="ts">
	import { goto } from '$app/navigation';
	import { auth } from '$lib/stores/auth.svelte';
	import { theme } from '$lib/stores/theme';
	import { User, Mail, Shield, LogOut, Sun, Moon, Monitor } from 'lucide-svelte';

	function handleLogout() {
		auth.logout();
		goto('/login');
	}
</script>

<svelte:head>
	<title>Settings - Presi</title>
</svelte:head>

<div class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
	<h1 class="text-2xl font-bold text-foreground mb-8">Settings</h1>

	<div class="space-y-6">
		<!-- Account Section -->
		<div
			class="bg-surface rounded-xl shadow-sm border border-border overflow-hidden"
		>
			<div class="p-4 border-b border-border">
				<h2 class="text-lg font-semibold text-foreground flex items-center gap-2">
					<User class="w-5 h-5 text-muted-foreground" />
					Account
				</h2>
			</div>
			<div class="p-4 space-y-4">
				<div class="flex items-center justify-between py-2">
					<div class="flex items-center gap-3">
						<Mail class="w-5 h-5 text-muted-foreground" />
						<div>
							<p class="text-sm font-medium text-foreground">Email</p>
							<p class="text-sm text-muted-foreground">{auth.user?.email}</p>
						</div>
					</div>
				</div>
				<div class="flex items-center justify-between py-2">
					<div class="flex items-center gap-3">
						<Shield class="w-5 h-5 text-muted-foreground" />
						<div>
							<p class="text-sm font-medium text-foreground">User ID</p>
							<p class="text-sm text-muted-foreground font-mono">{auth.user?.id}</p>
						</div>
					</div>
				</div>
			</div>
		</div>

		<!-- Appearance Section -->
		<div
			class="bg-surface rounded-xl shadow-sm border border-border overflow-hidden"
		>
			<div class="p-4 border-b border-border">
				<h2 class="text-lg font-semibold text-foreground flex items-center gap-2">
					<Sun class="w-5 h-5 text-muted-foreground" />
					Appearance
				</h2>
			</div>
			<div class="p-4">
				<p class="text-sm text-muted-foreground mb-4">Choose your preferred theme</p>
				<div class="grid grid-cols-3 gap-3">
					<button
						onclick={() => theme.setMode('light')}
						class="flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-colors {theme.mode ===
						'light'
							? 'border-primary bg-primary/10'
							: 'border-border'}"
					>
						<Sun class="w-6 h-6 text-amber-500" />
						<span class="text-sm font-medium text-foreground">Light</span>
					</button>
					<button
						onclick={() => theme.setMode('dark')}
						class="flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-colors {theme.mode ===
						'dark'
							? 'border-primary bg-primary/10'
							: 'border-border'}"
					>
						<Moon class="w-6 h-6 text-indigo-500" />
						<span class="text-sm font-medium text-foreground">Dark</span>
					</button>
					<button
						onclick={() => theme.setMode('system')}
						class="flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-colors {theme.mode ===
						'system'
							? 'border-primary bg-primary/10'
							: 'border-border'}"
					>
						<Monitor class="w-6 h-6 text-muted-foreground" />
						<span class="text-sm font-medium text-foreground">System</span>
					</button>
				</div>
			</div>
		</div>

		<!-- Danger Zone -->
		<div
			class="bg-surface rounded-xl shadow-sm border border-red-300 dark:border-red-900/50 overflow-hidden"
		>
			<div class="p-4 border-b border-red-300 dark:border-red-900/50 bg-red-50 dark:bg-red-900/20">
				<h2 class="text-lg font-semibold text-red-700 dark:text-red-400">Danger Zone</h2>
			</div>
			<div class="p-4">
				<div class="flex items-center justify-between">
					<div>
						<p class="text-sm font-medium text-foreground">Sign out</p>
						<p class="text-sm text-muted-foreground">
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
