<script lang="ts">
	import { goto } from '$app/navigation';
</script>

<main
	class="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4"
>
	<div class="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
		<div class="mb-6">
			<div
				class="w-20 h-20 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full mx-auto flex items-center justify-center"
			>
				<span class="text-4xl">🥗</span>
			</div>
		</div>

		<h1 class="text-3xl font-bold text-gray-900 mb-2">Nutriphi</h1>
		<p class="text-gray-600 mb-8">KI-gestützter Ernährungs-Tracker mit Mahlzeit-Foto-Analyse</p>

		<div class="space-y-4">
			<button
				class="w-full py-3 px-6 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all shadow-lg hover:shadow-xl"
				onclick={() => goto('/login')}
			>
				Anmelden
			</button>

			<button
				class="w-full py-3 px-6 border-2 border-green-500 text-green-600 font-semibold rounded-xl hover:bg-green-50 transition-all"
				onclick={() => goto('/register')}
			>
				Registrieren
			</button>
		</div>

		<div class="mt-8 pt-6 border-t border-gray-200">
			<p class="text-sm text-gray-500">
				Teil des <span class="font-semibold text-green-600">Mana Core</span> Ökosystems
			</p>
		</div>
	</div>
</main>
