<script lang="ts">
	import Button from '../ui/Button.svelte';
	import Input from '../ui/Input.svelte';
	import Card from '../ui/Card.svelte';
	import { supabase } from '$lib/supabase';
	import { goto } from '$app/navigation';

	let email = $state('');
	let password = $state('');
	let confirmPassword = $state('');
	let loading = $state(false);
	let error = $state('');
	let success = $state(false);

	async function handleSignup() {
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

		const { data, error: authError } = await supabase.auth.signUp({
			email,
			password,
			options: {
				emailRedirectTo: `${window.location.origin}/app/gallery`,
			},
		});

		loading = false;

		if (authError) {
			error = authError.message;
			return;
		}

		// Check if email confirmation is required
		if (data.user && !data.session) {
			success = true;
		} else if (data.session) {
			goto('/app/gallery');
		}
	}
</script>

<Card class="w-full max-w-md">
	<div class="mb-6 text-center">
		<h2 class="text-2xl font-bold text-gray-900">Create account</h2>
		<p class="mt-2 text-sm text-gray-600">Start generating AI images today</p>
	</div>

	{#if success}
		<div class="mb-4 rounded-md bg-green-50 p-4">
			<h3 class="text-sm font-medium text-green-800">Check your email</h3>
			<p class="mt-2 text-sm text-green-700">
				We've sent you a confirmation link. Please check your email to verify your account.
			</p>
		</div>
	{:else}
		{#if error}
			<div class="mb-4 rounded-md bg-red-50 p-3">
				<p class="text-sm text-red-800">{error}</p>
			</div>
		{/if}

		<form
			onsubmit={(e) => {
				e.preventDefault();
				handleSignup();
			}}
			class="space-y-4"
		>
			<div>
				<Input
					type="email"
					label="Email"
					placeholder="you@example.com"
					bind:value={email}
					required
					autocomplete="email"
				/>
			</div>

			<div>
				<Input
					type="password"
					label="Password"
					placeholder="••••••••"
					bind:value={password}
					required
					autocomplete="new-password"
				/>
			</div>

			<div>
				<Input
					type="password"
					label="Confirm Password"
					placeholder="••••••••"
					bind:value={confirmPassword}
					required
					autocomplete="new-password"
				/>
			</div>

			<Button type="submit" variant="primary" class="w-full" {loading}>Create account</Button>
		</form>

		<p class="mt-6 text-center text-sm text-gray-600">
			Already have an account?
			<a href="/auth/login" class="font-medium text-blue-600 hover:text-blue-500"> Sign in </a>
		</p>
	{/if}
</Card>
