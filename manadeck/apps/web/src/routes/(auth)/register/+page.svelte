<script lang="ts">
	import { goto } from '$app/navigation';
	import Button from '$lib/components/ui/Button.svelte';
	import Input from '$lib/components/ui/Input.svelte';
	import Card from '$lib/components/ui/Card.svelte';
	import { authService } from '$lib/services/authService';

	let email = $state('');
	let username = $state('');
	let password = $state('');
	let confirmPassword = $state('');
	let error = $state('');
	let loading = $state(false);

	async function handleSubmit() {
		if (!email || !password || !confirmPassword) {
			error = 'Please fill in all fields';
			return;
		}

		if (password !== confirmPassword) {
			error = 'Passwords do not match';
			return;
		}

		if (password.length < 6) {
			error = 'Password must be at least 6 characters';
			return;
		}

		loading = true;
		error = '';

		try {
			await authService.signUp(email, password, username || undefined);
			goto('/decks');
		} catch (err: any) {
			error = err.message || 'Sign up failed';
		} finally {
			loading = false;
		}
	}
</script>

<svelte:head>
	<title>Sign Up - Manadeck</title>
</svelte:head>

<div class="min-h-screen flex items-center justify-center bg-background px-4">
	<div class="w-full max-w-md">
		<div class="text-center mb-8">
			<h1 class="text-3xl font-bold mb-2">Create your account</h1>
			<p class="text-muted-foreground">Start building your knowledge decks</p>
		</div>

		<Card>
			<form onsubmit={(e) => { e.preventDefault(); handleSubmit(); }} class="space-y-4">
				<Input
					type="email"
					label="Email"
					bind:value={email}
					placeholder="you@example.com"
					autocomplete="email"
					required
				/>

				<Input
					type="text"
					label="Username (optional)"
					bind:value={username}
					placeholder="Choose a username"
					autocomplete="username"
				/>

				<Input
					type="password"
					label="Password"
					bind:value={password}
					placeholder="••••••••"
					autocomplete="new-password"
					required
				/>

				<Input
					type="password"
					label="Confirm Password"
					bind:value={confirmPassword}
					placeholder="••••••••"
					autocomplete="new-password"
					required
				/>

				{#if error}
					<div class="p-3 rounded-md bg-destructive/10 text-destructive text-sm">
						{error}
					</div>
				{/if}

				<Button type="submit" fullWidth {loading}>
					Create account
				</Button>
			</form>

			<div class="mt-6 text-center text-sm">
				<span class="text-muted-foreground">Already have an account?</span>
				<a href="/login" class="ml-2 text-primary hover:underline">
					Sign in
				</a>
			</div>
		</Card>
	</div>
</div>
