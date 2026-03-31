<script lang="ts">
	import { goto } from '$app/navigation';
	import { _ } from 'svelte-i18n';
	import { authStore } from '$lib/stores/auth.svelte';
	import { Clock } from '@manacore/shared-icons';
	import { getPillAppItems } from '@manacore/shared-branding';

	let email = $state('');
	let password = $state('');
	let error = $state('');
	let isLoading = $state(false);
	let showRegister = $state(false);
	let showForgotPassword = $state(false);
	let show2FA = $state(false);
	let twoFactorCode = $state('');
	let verificationSent = $state(false);

	async function handleLogin() {
		if (!email || !password) return;
		isLoading = true;
		error = '';
		try {
			const result = await authStore.signIn(email, password);
			if (result.success) {
				goto('/');
			} else if (result.error?.includes('two-factor') || result.error?.includes('2FA')) {
				show2FA = true;
			} else {
				error = result.error || 'Login fehlgeschlagen';
			}
		} catch {
			error = 'Ein Fehler ist aufgetreten';
		} finally {
			isLoading = false;
		}
	}

	async function handleRegister() {
		if (!email || !password) return;
		isLoading = true;
		error = '';
		try {
			const result = await authStore.signUp(email, password);
			if (result.success && !result.needsVerification) {
				goto('/');
			} else if (result.needsVerification) {
				verificationSent = true;
			} else {
				error = result.error || 'Registrierung fehlgeschlagen';
			}
		} catch {
			error = 'Ein Fehler ist aufgetreten';
		} finally {
			isLoading = false;
		}
	}

	async function handleForgotPassword() {
		if (!email) {
			error = 'Bitte E-Mail eingeben';
			return;
		}
		isLoading = true;
		error = '';
		const result = await authStore.resetPassword(email);
		if (result.success) {
			verificationSent = true;
		} else {
			error = result.error || 'Fehler beim Zurücksetzen';
		}
		isLoading = false;
	}

	async function handle2FA() {
		if (!twoFactorCode) return;
		isLoading = true;
		const result = await authStore.verifyTwoFactor(twoFactorCode, true);
		if (result.success) {
			goto('/');
		} else {
			error = 'Ungültiger Code';
		}
		isLoading = false;
	}

	async function handlePasskey() {
		isLoading = true;
		error = '';
		const result = await authStore.signInWithPasskey();
		if (result.success) {
			goto('/');
		} else {
			error = result.error || 'Passkey fehlgeschlagen';
		}
		isLoading = false;
	}
</script>

<svelte:head>
	<title>{showRegister ? $_('auth.register') : $_('auth.login')} | Times</title>
</svelte:head>

<div class="flex min-h-screen items-center justify-center bg-[hsl(var(--background))] p-4">
	<div class="w-full max-w-sm">
		<!-- Logo -->
		<div class="mb-8 text-center">
			<div
				class="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-[hsl(var(--primary))]"
			>
				<Clock size={32} class="text-white" />
			</div>
			<h1 class="text-2xl font-bold text-[hsl(var(--foreground))]">Times</h1>
			<p class="mt-1 text-sm text-[hsl(var(--muted-foreground))]">Zeiterfassung</p>
		</div>

		{#if verificationSent}
			<div
				class="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6 text-center"
			>
				<p class="text-[hsl(var(--foreground))]">
					{showForgotPassword ? 'Link zum Zurücksetzen gesendet!' : 'Bestätigungsmail gesendet!'}
				</p>
				<p class="mt-2 text-sm text-[hsl(var(--muted-foreground))]">Bitte prüfe dein Postfach.</p>
				<button
					onclick={() => {
						verificationSent = false;
						showForgotPassword = false;
						showRegister = false;
					}}
					class="mt-4 text-sm text-[hsl(var(--primary))]"
				>
					Zurück zum Login
				</button>
			</div>
		{:else if show2FA}
			<div class="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6">
				<h2 class="mb-4 text-lg font-semibold text-[hsl(var(--foreground))]">
					Zwei-Faktor-Authentifizierung
				</h2>
				<input
					type="text"
					bind:value={twoFactorCode}
					placeholder="Code eingeben"
					class="w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--input))] px-4 py-3 text-[hsl(var(--foreground))]"
					onkeydown={(e) => e.key === 'Enter' && handle2FA()}
				/>
				{#if error}<p class="mt-2 text-sm text-red-500">{error}</p>{/if}
				<button
					onclick={handle2FA}
					disabled={isLoading}
					class="mt-4 w-full rounded-lg bg-[hsl(var(--primary))] py-3 font-medium text-[hsl(var(--primary-foreground))] disabled:opacity-50"
				>
					{isLoading ? 'Prüfe...' : 'Bestätigen'}
				</button>
			</div>
		{:else}
			<div class="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6">
				<h2 class="mb-4 text-lg font-semibold text-[hsl(var(--foreground))]">
					{showForgotPassword
						? 'Passwort zurücksetzen'
						: showRegister
							? $_('auth.register')
							: $_('auth.login')}
				</h2>

				<div class="space-y-3">
					<input
						type="email"
						bind:value={email}
						placeholder={$_('auth.email')}
						class="w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--input))] px-4 py-3 text-[hsl(var(--foreground))]"
					/>
					{#if !showForgotPassword}
						<input
							type="password"
							bind:value={password}
							placeholder={$_('auth.password')}
							class="w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--input))] px-4 py-3 text-[hsl(var(--foreground))]"
							onkeydown={(e) =>
								e.key === 'Enter' && (showRegister ? handleRegister() : handleLogin())}
						/>
					{/if}
				</div>

				{#if error}<p class="mt-2 text-sm text-red-500">{error}</p>{/if}

				<button
					onclick={showForgotPassword
						? handleForgotPassword
						: showRegister
							? handleRegister
							: handleLogin}
					disabled={isLoading}
					class="mt-4 w-full rounded-lg bg-[hsl(var(--primary))] py-3 font-medium text-[hsl(var(--primary-foreground))] disabled:opacity-50"
				>
					{isLoading
						? $_('common.loading')
						: showForgotPassword
							? 'Link senden'
							: showRegister
								? $_('auth.register')
								: $_('auth.login')}
				</button>

				{#if !showForgotPassword && authStore.isPasskeyAvailable()}
					<button
						onclick={handlePasskey}
						disabled={isLoading}
						class="mt-2 w-full rounded-lg border border-[hsl(var(--border))] py-3 text-sm text-[hsl(var(--foreground))]"
					>
						Mit Passkey anmelden
					</button>
				{/if}

				<div class="mt-4 flex justify-between text-sm">
					{#if showForgotPassword}
						<button
							onclick={() => {
								showForgotPassword = false;
								error = '';
							}}
							class="text-[hsl(var(--primary))]"
						>
							Zurück zum Login
						</button>
					{:else}
						<button
							onclick={() => {
								showForgotPassword = true;
								error = '';
							}}
							class="text-[hsl(var(--muted-foreground))]"
						>
							{$_('auth.forgotPassword')}
						</button>
						<button
							onclick={() => {
								showRegister = !showRegister;
								error = '';
							}}
							class="text-[hsl(var(--primary))]"
						>
							{showRegister ? $_('auth.login') : $_('auth.register')}
						</button>
					{/if}
				</div>
			</div>
		{/if}

		<!-- App switcher -->
		<div class="mt-6 flex flex-wrap justify-center gap-2">
			{#each getPillAppItems() as app}
				{#if app.id !== 'times'}
					<a
						href={app.url}
						class="rounded-full border border-[hsl(var(--border))] px-3 py-1 text-xs text-[hsl(var(--muted-foreground))] transition-colors hover:bg-[hsl(var(--accent))] hover:text-[hsl(var(--accent-foreground))]"
					>
						{app.name}
					</a>
				{/if}
			{/each}
		</div>
	</div>
</div>
