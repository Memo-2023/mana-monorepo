<script lang="ts">
	import { goto } from '$app/navigation';
	import { loginWithPassword, discoverHomeserver, checkHomeserver, matrixStore } from '$lib/matrix';
	import { Eye, EyeOff, Loader2, Server, User, Lock, AlertCircle } from 'lucide-svelte';

	// Form state
	let homeserver = $state('matrix.mana.how');
	let username = $state('');
	let password = $state('');
	let showPassword = $state(false);

	// UI state
	let loading = $state(false);
	let checkingServer = $state(false);
	let error = $state<string | null>(null);
	let serverValid = $state<boolean | null>(null);

	// Auto-discover homeserver when username looks like a full Matrix ID
	let discoverTimeout: ReturnType<typeof setTimeout>;

	function handleUsernameInput() {
		if (username.includes(':')) {
			clearTimeout(discoverTimeout);
			discoverTimeout = setTimeout(async () => {
				const discovered = await discoverHomeserver(username);
				if (discovered) {
					homeserver = discovered.replace(/^https?:\/\//, '');
					await validateServer();
				}
			}, 500);
		}
	}

	async function validateServer() {
		if (!homeserver.trim()) {
			serverValid = null;
			return;
		}

		checkingServer = true;
		const result = await checkHomeserver(homeserver);
		serverValid = result.ok;
		checkingServer = false;

		if (!result.ok) {
			error = `Server check failed: ${result.error}`;
		} else {
			error = null;
		}
	}

	async function handleLogin(e: Event) {
		e.preventDefault();

		if (!username.trim() || !password.trim()) {
			error = 'Please enter username and password';
			return;
		}

		loading = true;
		error = null;

		const result = await loginWithPassword(homeserver, username, password);

		if (result.success && result.credentials) {
			const initialized = await matrixStore.initialize(result.credentials);

			if (initialized) {
				goto('/chat');
			} else {
				error = matrixStore.error || 'Failed to initialize Matrix client';
			}
		} else {
			error = result.error || 'Login failed';
		}

		loading = false;
	}
</script>

<div class="card w-full max-w-md bg-base-200 shadow-xl">
	<div class="card-body">
		<!-- Header -->
		<div class="mb-4 text-center">
			<h1 class="text-2xl font-bold">Mana Matrix</h1>
			<p class="text-sm text-base-content/60">Sign in to your Matrix account</p>
		</div>

		<!-- Error Alert -->
		{#if error}
			<div class="alert alert-error mb-4">
				<AlertCircle class="h-5 w-5" />
				<span>{error}</span>
			</div>
		{/if}

		<!-- Login Form -->
		<form onsubmit={handleLogin} class="space-y-4">
			<!-- Homeserver -->
			<div class="form-control">
				<label class="label" for="homeserver">
					<span class="label-text flex items-center gap-2">
						<Server class="h-4 w-4" />
						Homeserver
					</span>
					{#if checkingServer}
						<span class="label-text-alt">
							<Loader2 class="h-4 w-4 animate-spin" />
						</span>
					{:else if serverValid === true}
						<span class="label-text-alt text-success">Connected</span>
					{:else if serverValid === false}
						<span class="label-text-alt text-error">Unreachable</span>
					{/if}
				</label>
				<input
					id="homeserver"
					type="text"
					bind:value={homeserver}
					onblur={validateServer}
					class="input input-bordered"
					class:input-success={serverValid === true}
					class:input-error={serverValid === false}
					placeholder="matrix.org"
					disabled={loading}
				/>
			</div>

			<!-- Username -->
			<div class="form-control">
				<label class="label" for="username">
					<span class="label-text flex items-center gap-2">
						<User class="h-4 w-4" />
						Username
					</span>
				</label>
				<input
					id="username"
					type="text"
					bind:value={username}
					oninput={handleUsernameInput}
					class="input input-bordered"
					placeholder="@user:matrix.org or username"
					disabled={loading}
					autocomplete="username"
				/>
			</div>

			<!-- Password -->
			<div class="form-control">
				<label class="label" for="password">
					<span class="label-text flex items-center gap-2">
						<Lock class="h-4 w-4" />
						Password
					</span>
				</label>
				<div class="relative">
					<input
						id="password"
						type={showPassword ? 'text' : 'password'}
						bind:value={password}
						class="input input-bordered w-full pr-12"
						placeholder="Your password"
						disabled={loading}
						autocomplete="current-password"
					/>
					<button
						type="button"
						class="absolute right-3 top-1/2 -translate-y-1/2 text-base-content/50 hover:text-base-content"
						onclick={() => (showPassword = !showPassword)}
						tabindex={-1}
					>
						{#if showPassword}
							<EyeOff class="h-5 w-5" />
						{:else}
							<Eye class="h-5 w-5" />
						{/if}
					</button>
				</div>
			</div>

			<!-- Submit Button -->
			<button type="submit" class="btn btn-primary w-full" disabled={loading}>
				{#if loading}
					<Loader2 class="h-5 w-5 animate-spin" />
					Signing in...
				{:else}
					Sign In
				{/if}
			</button>
		</form>

		<!-- Footer -->
		<div class="mt-4 text-center text-sm text-base-content/60">
			<p>
				Don't have an account?
				<a href="/register" class="link link-primary">Register</a>
			</p>
		</div>
	</div>
</div>
