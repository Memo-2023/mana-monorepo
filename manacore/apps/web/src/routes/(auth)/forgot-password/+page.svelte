<script lang="ts">
	import { enhance } from '$app/forms';
	import { Button, Input, Card } from '@manacore/shared-ui';

	let { form } = $props();
	let loading = $state(false);
</script>

<div>
	<div class="text-center">
		<h2 class="mb-2 text-3xl font-bold text-gray-900 dark:text-white">Forgot Password</h2>
		<p class="text-gray-600 dark:text-gray-400">
			Enter your email and we'll send you a link to reset your password
		</p>
	</div>

	<Card class="mt-8">
		<form
			method="POST"
			use:enhance={() => {
				loading = true;
				return async ({ update }) => {
					await update();
					loading = false;
				};
			}}
		>
			{#if form?.error}
				<div class="mb-4 rounded-lg bg-red-50 p-4 text-sm text-red-800 dark:bg-red-900/20 dark:text-red-400">
					{form.error}
				</div>
			{/if}

			{#if form?.success}
				<div class="mb-4 rounded-lg bg-green-50 p-4 text-sm text-green-800 dark:bg-green-900/20 dark:text-green-400">
					Password reset email sent! Check your inbox for instructions.
				</div>
			{/if}

			<div class="space-y-4">
				<div>
					<label for="email" class="mb-2 block text-sm font-medium text-gray-900 dark:text-gray-100">
						Email address
					</label>
					<Input
						type="email"
						name="email"
						id="email"
						autocomplete="email"
						placeholder="you@example.com"
						required
						value={form?.email ?? ''}
					/>
				</div>

				<div>
					<Button type="submit" {loading} class="w-full">
						{loading ? 'Sending...' : 'Send reset link'}
					</Button>
				</div>
			</div>
		</form>

		<div class="mt-6 text-center">
			<p class="text-sm text-gray-600 dark:text-gray-400">
				Remember your password?
				<a href="/login" class="font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400">
					Sign in
				</a>
			</p>
		</div>
	</Card>
</div>
