<script lang="ts">
	import { goto } from '$app/navigation';
	import Button from '$lib/components/ui/Button.svelte';
	import Input from '$lib/components/ui/Input.svelte';
	import Card from '$lib/components/ui/Card.svelte';
	import { authService } from '$lib/services/authService';

	let email = $state('');
	let password = $state('');
	let error = $state('');
	let loading = $state(false);

	async function handleSubmit() {
		if (!email || !password) {
			error = 'Please fill in all fields';
			return;
		}

		loading = true;
		error = '';

		try {
			await authService.signIn(email, password);
			goto('/decks');
		} catch (err: any) {
			error = err.message || 'Sign in failed';
		} finally {
			loading = false;
		}
	}
</script>

<svelte:head>
	<title>Sign In - Manadeck</title>
</svelte:head>

<div class="min-h-screen flex items-center justify-center bg-background px-4">
	<div class="w-full max-w-md">
		<div class="text-center mb-8">
			<h1 class="text-3xl font-bold mb-2">Welcome back</h1>
			<p class="text-muted-foreground">Sign in to your Manadeck account</p>
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
					type="password"
					label="Password"
					bind:value={password}
					placeholder="••••••••"
					autocomplete="current-password"
					required
				/>

				{#if error}
					<div class="p-3 rounded-md bg-destructive/10 text-destructive text-sm">
						{error}
					</div>
				{/if}

				<Button type="submit" fullWidth {loading}>
					Sign in
				</Button>
			</form>

			<div class="mt-6 text-center text-sm">
				<span class="text-muted-foreground">Don't have an account?</span>
				<a href="/register" class="ml-2 text-primary hover:underline">
					Sign up
				</a>
			</div>
		</Card>
	</div>
</div>
