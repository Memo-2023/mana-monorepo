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
	<div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
		<div class="max-w-md w-full mx-4">
			<div class="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
				<div class="text-center mb-8">
					<div class="inline-flex items-center justify-center w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full mb-4">
						<svg class="w-8 h-8 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
						</svg>
					</div>
					<h1 class="text-2xl font-bold text-gray-900 dark:text-white mb-2">
						Passwortgeschützter Link
					</h1>
					{#if data.workspace}
						<p class="text-sm text-gray-600 dark:text-gray-400">
							Workspace: {data.workspace.name}
						</p>
					{/if}
					{#if data.link.title}
						<p class="text-gray-600 dark:text-gray-400 mt-2">
							{data.link.title}
						</p>
					{/if}
				</div>
				
				<form onsubmit={(e) => { e.preventDefault(); handlePasswordSubmit(); }} class="space-y-4">
					<div>
						<label for="password" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
							Passwort eingeben
						</label>
						<input
							type="password"
							id="password"
							bind:value={password}
							required
							autofocus
							class="w-full px-4 py-3 rounded-lg border {error ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
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
						class="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-lg transition-all duration-200 transform hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
					>
						Link öffnen →
					</button>
				</form>
				
				<div class="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
					<p class="text-xs text-center text-gray-500 dark:text-gray-400">
						Dieser Link ist passwortgeschützt. Geben Sie das korrekte Passwort ein, um fortzufahren.
					</p>
				</div>
			</div>
		</div>
	</div>
{:else}
	<!-- This shouldn't show as we redirect, but just in case -->
	<div class="min-h-screen flex items-center justify-center">
		<div class="text-center">
			<div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
			<p class="mt-4 text-gray-600 dark:text-gray-400">Weiterleitung...</p>
		</div>
	</div>
{/if}