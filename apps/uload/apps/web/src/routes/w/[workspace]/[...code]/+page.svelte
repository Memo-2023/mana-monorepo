<script lang="ts">
	import { page } from '$app/stores';
	import { enhance } from '$app/forms';

	interface Props {
		data: {
			link?: any;
			requiresPassword?: boolean;
			workspace?: any;
		};
	}

	let { data }: Props = $props();

	let password = $state('');
	let error = $state(false);

	function handlePasswordSubmit() {
		const url = new URL($page.url);
		url.searchParams.set('pwd', password);
		window.location.href = url.toString();
	}
</script>

{#if data.requiresPassword && data.link}
	<div
		class="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800"
	>
		<div class="mx-4 w-full max-w-md">
			<div class="rounded-2xl bg-white p-8 shadow-xl dark:bg-gray-800">
				<div class="mb-8 text-center">
					<div
						class="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900"
					>
						<svg
							class="h-8 w-8 text-blue-600 dark:text-blue-400"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
							></path>
						</svg>
					</div>
					<h1 class="mb-2 text-2xl font-bold text-gray-900 dark:text-white">
						Passwortgeschützter Link
					</h1>
					{#if data.workspace}
						<p class="text-sm text-gray-600 dark:text-gray-400">
							Workspace: {data.workspace.name}
						</p>
					{/if}
					{#if data.link.title}
						<p class="mt-2 text-gray-600 dark:text-gray-400">
							{data.link.title}
						</p>
					{/if}
				</div>

				<form
					onsubmit={(e) => {
						e.preventDefault();
						handlePasswordSubmit();
					}}
					class="space-y-4"
				>
					<div>
						<label
							for="password"
							class="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
						>
							Passwort eingeben
						</label>
						<input
							type="password"
							id="password"
							bind:value={password}
							required
							autofocus
							class="w-full rounded-lg border px-4 py-3 {error
								? 'border-red-500'
								: 'border-gray-300 dark:border-gray-600'} bg-white text-gray-900 transition-colors focus:border-transparent focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
							placeholder="••••••••"
						/>
						{#if error}
							<p class="mt-2 text-sm text-red-600 dark:text-red-400">
								Falsches Passwort. Bitte versuchen Sie es erneut.
							</p>
						{/if}
					</div>

					<button
						type="submit"
						class="w-full transform rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-3 font-semibold text-white transition-all duration-200 hover:scale-[1.02] hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
					>
						Link öffnen →
					</button>
				</form>

				<div class="mt-6 border-t border-gray-200 pt-6 dark:border-gray-700">
					<p class="text-center text-xs text-gray-500 dark:text-gray-400">
						Dieser Link ist passwortgeschützt. Geben Sie das korrekte Passwort ein, um fortzufahren.
					</p>
				</div>
			</div>
		</div>
	</div>
{:else}
	<!-- This shouldn't show as we redirect, but just in case -->
	<div class="flex min-h-screen items-center justify-center">
		<div class="text-center">
			<div class="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600"></div>
			<p class="mt-4 text-gray-600 dark:text-gray-400">Weiterleitung...</p>
		</div>
	</div>
{/if}
