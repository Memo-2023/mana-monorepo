<script lang="ts">
	import { authStore } from '$lib/stores/auth.svelte';
	import { theme } from '$lib/stores/theme';
	import { ArrowLeft, User, Moon, Sun, Desktop, Bell, Shield, Trash } from '@manacore/shared-icons';

	let currentTheme = $state(theme.current);
	let deleteConfirm = $state(false);

	function setTheme(newTheme: 'light' | 'dark' | 'system') {
		theme.set(newTheme);
		currentTheme = newTheme;
	}

	const themeOptions = [
		{ value: 'light', label: 'Light', icon: Sun },
		{ value: 'dark', label: 'Dark', icon: Moon },
		{ value: 'system', label: 'System', icon: Desktop },
	] as const;
</script>

<div class="mx-auto max-w-2xl p-6">
	<!-- Header -->
	<div class="mb-8">
		<a
			href="/"
			class="mb-4 inline-flex items-center gap-2 text-muted-foreground hover:text-foreground"
		>
			<ArrowLeft class="h-4 w-4" />
			Back to questions
		</a>
		<h1 class="text-2xl font-bold text-foreground">Settings</h1>
	</div>

	<!-- Account Section -->
	<section class="mb-8">
		<h2 class="mb-4 flex items-center gap-2 text-lg font-semibold text-foreground">
			<User class="h-5 w-5" />
			Account
		</h2>
		<div class="rounded-xl border border-border bg-card p-6">
			<div class="space-y-4">
				<div>
					<label class="text-sm text-muted-foreground">Email</label>
					<p class="font-medium text-foreground">{authStore.user?.email || 'Not signed in'}</p>
				</div>
				<div>
					<label class="text-sm text-muted-foreground">User ID</label>
					<p class="font-mono text-sm text-foreground">{authStore.user?.id || '-'}</p>
				</div>
			</div>
		</div>
	</section>

	<!-- Appearance Section -->
	<section class="mb-8">
		<h2 class="mb-4 flex items-center gap-2 text-lg font-semibold text-foreground">
			<Moon class="h-5 w-5" />
			Appearance
		</h2>
		<div class="rounded-xl border border-border bg-card p-6">
			<label class="mb-3 block text-sm font-medium text-foreground">Theme</label>
			<div class="grid grid-cols-3 gap-3">
				{#each themeOptions as option}
					<button
						onclick={() => setTheme(option.value)}
						class="flex flex-col items-center gap-2 rounded-lg border-2 p-4 transition-all {currentTheme ===
						option.value
							? 'border-primary bg-primary/5'
							: 'border-border hover:border-primary/50'}"
					>
						<svelte:component this={option.icon} class="h-6 w-6" />
						<span class="text-sm font-medium">{option.label}</span>
					</button>
				{/each}
			</div>
		</div>
	</section>

	<!-- Notifications Section -->
	<section class="mb-8">
		<h2 class="mb-4 flex items-center gap-2 text-lg font-semibold text-foreground">
			<Bell class="h-5 w-5" />
			Notifications
		</h2>
		<div class="rounded-xl border border-border bg-card p-6">
			<div class="space-y-4">
				<label class="flex items-center justify-between">
					<div>
						<p class="font-medium text-foreground">Research Complete</p>
						<p class="text-sm text-muted-foreground">Get notified when research is finished</p>
					</div>
					<input
						type="checkbox"
						checked
						class="h-5 w-5 rounded border-border text-primary focus:ring-primary"
					/>
				</label>

				<label class="flex items-center justify-between">
					<div>
						<p class="font-medium text-foreground">Weekly Summary</p>
						<p class="text-sm text-muted-foreground">Receive a weekly summary of your questions</p>
					</div>
					<input
						type="checkbox"
						class="h-5 w-5 rounded border-border text-primary focus:ring-primary"
					/>
				</label>
			</div>
		</div>
	</section>

	<!-- Privacy Section -->
	<section class="mb-8">
		<h2 class="mb-4 flex items-center gap-2 text-lg font-semibold text-foreground">
			<Shield class="h-5 w-5" />
			Privacy & Data
		</h2>
		<div class="rounded-xl border border-border bg-card p-6">
			<div class="space-y-4">
				<div>
					<p class="font-medium text-foreground">Export Data</p>
					<p class="mb-2 text-sm text-muted-foreground">
						Download all your questions and research data
					</p>
					<button
						class="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-secondary"
					>
						Export as JSON
					</button>
				</div>

				<hr class="border-border" />

				<div>
					<p class="font-medium text-destructive">Delete Account</p>
					<p class="mb-2 text-sm text-muted-foreground">
						Permanently delete your account and all data
					</p>
					{#if deleteConfirm}
						<div class="flex gap-2">
							<button
								class="rounded-lg bg-destructive px-4 py-2 text-sm font-medium text-destructive-foreground hover:bg-destructive/90"
							>
								Confirm Delete
							</button>
							<button
								onclick={() => (deleteConfirm = false)}
								class="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-secondary"
							>
								Cancel
							</button>
						</div>
					{:else}
						<button
							onclick={() => (deleteConfirm = true)}
							class="flex items-center gap-2 rounded-lg border border-destructive px-4 py-2 text-sm font-medium text-destructive hover:bg-destructive/10"
						>
							<Trash class="h-4 w-4" />
							Delete Account
						</button>
					{/if}
				</div>
			</div>
		</div>
	</section>

	<!-- About Section -->
	<section class="mb-8">
		<div class="rounded-xl border border-border bg-card p-6 text-center">
			<p class="text-sm text-muted-foreground">
				Questions App v1.0.0
				<br />
				Powered by mana-search
			</p>
		</div>
	</section>
</div>
