<script lang="ts">
  import { user } from '$lib/stores/auth';

  // Placeholder subscription data
  let currentPlan = $state('free');
  let manaCredits = $state(150);
  let dailyMana = $state(5);
</script>

<div class="mx-auto max-w-4xl space-y-6">
  <!-- Header -->
  <div>
    <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Mana Credits</h1>
    <p class="text-gray-600 dark:text-gray-400">
      Verwalte deine Mana Credits und Abonnement
    </p>
  </div>

  <!-- Current Balance -->
  <div class="rounded-2xl bg-gradient-to-r from-green-500 to-emerald-600 p-6 text-white">
    <div class="flex items-center justify-between">
      <div>
        <p class="text-green-100">Aktuelles Guthaben</p>
        <p class="text-4xl font-bold">{manaCredits} Mana</p>
        <p class="mt-1 text-green-200">+{dailyMana} Mana täglich</p>
      </div>
      <div class="text-6xl">✨</div>
    </div>
  </div>

  <!-- Usage Info -->
  <div class="rounded-2xl bg-white p-6 shadow-lg dark:bg-gray-800">
    <h2 class="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Mana-Kosten</h2>
    <div class="space-y-3">
      <div class="flex items-center justify-between rounded-xl bg-gray-50 p-3 dark:bg-gray-700">
        <div class="flex items-center gap-3">
          <span class="text-2xl">📸</span>
          <div>
            <p class="font-medium text-gray-900 dark:text-white">Foto-Analyse</p>
            <p class="text-sm text-gray-600 dark:text-gray-400">KI analysiert deine Mahlzeit</p>
          </div>
        </div>
        <span class="font-semibold text-green-600">5 Mana</span>
      </div>
      <div class="flex items-center justify-between rounded-xl bg-gray-50 p-3 dark:bg-gray-700">
        <div class="flex items-center gap-3">
          <span class="text-2xl">📝</span>
          <div>
            <p class="font-medium text-gray-900 dark:text-white">Text-Analyse</p>
            <p class="text-sm text-gray-600 dark:text-gray-400">Beschreibung analysieren</p>
          </div>
        </div>
        <span class="font-semibold text-green-600">3 Mana</span>
      </div>
    </div>
  </div>

  <!-- Subscription Plans -->
  <div>
    <h2 class="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Abonnements</h2>
    <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <!-- Free -->
      <div class="rounded-2xl bg-white p-6 shadow-lg dark:bg-gray-800 {currentPlan === 'free' ? 'ring-2 ring-green-500' : ''}">
        <p class="text-sm text-gray-600 dark:text-gray-400">Kostenlos</p>
        <p class="text-2xl font-bold text-gray-900 dark:text-white">Free</p>
        <p class="mt-2 text-3xl font-bold text-gray-900 dark:text-white">€0</p>
        <p class="text-sm text-gray-500">/Monat</p>
        <ul class="mt-4 space-y-2 text-sm">
          <li class="text-gray-600 dark:text-gray-400">✓ 150 Mana Start</li>
          <li class="text-gray-600 dark:text-gray-400">✓ +5 Mana/Tag</li>
          <li class="text-gray-600 dark:text-gray-400">✓ Basis-Analysen</li>
        </ul>
        {#if currentPlan === 'free'}
          <div class="mt-4 rounded-lg bg-green-100 py-2 text-center text-sm font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400">
            Aktueller Plan
          </div>
        {/if}
      </div>

      <!-- Stream -->
      <div class="rounded-2xl bg-white p-6 shadow-lg dark:bg-gray-800">
        <p class="text-sm text-gray-600 dark:text-gray-400">Stream</p>
        <p class="text-2xl font-bold text-gray-900 dark:text-white">Basic</p>
        <p class="mt-2 text-3xl font-bold text-gray-900 dark:text-white">€5.99</p>
        <p class="text-sm text-gray-500">/Monat</p>
        <ul class="mt-4 space-y-2 text-sm">
          <li class="text-gray-600 dark:text-gray-400">✓ 500 Mana/Monat</li>
          <li class="text-gray-600 dark:text-gray-400">✓ +10 Mana/Tag</li>
          <li class="text-gray-600 dark:text-gray-400">✓ Erweiterte Analysen</li>
        </ul>
        <button class="mt-4 w-full rounded-lg bg-green-500 py-2 text-sm font-medium text-white hover:bg-green-600">
          Upgrade
        </button>
      </div>

      <!-- River -->
      <div class="rounded-2xl bg-white p-6 shadow-lg dark:bg-gray-800">
        <p class="text-sm text-gray-600 dark:text-gray-400">River</p>
        <p class="text-2xl font-bold text-gray-900 dark:text-white">Standard</p>
        <p class="mt-2 text-3xl font-bold text-gray-900 dark:text-white">€14.99</p>
        <p class="text-sm text-gray-500">/Monat</p>
        <ul class="mt-4 space-y-2 text-sm">
          <li class="text-gray-600 dark:text-gray-400">✓ 1500 Mana/Monat</li>
          <li class="text-gray-600 dark:text-gray-400">✓ +20 Mana/Tag</li>
          <li class="text-gray-600 dark:text-gray-400">✓ Prioritäts-Support</li>
        </ul>
        <button class="mt-4 w-full rounded-lg bg-green-500 py-2 text-sm font-medium text-white hover:bg-green-600">
          Upgrade
        </button>
      </div>

      <!-- Lake -->
      <div class="rounded-2xl border-2 border-green-500 bg-white p-6 shadow-lg dark:bg-gray-800">
        <div class="mb-2 inline-block rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400">
          Beliebt
        </div>
        <p class="text-sm text-gray-600 dark:text-gray-400">Lake</p>
        <p class="text-2xl font-bold text-gray-900 dark:text-white">Premium</p>
        <p class="mt-2 text-3xl font-bold text-gray-900 dark:text-white">€29.99</p>
        <p class="text-sm text-gray-500">/Monat</p>
        <ul class="mt-4 space-y-2 text-sm">
          <li class="text-gray-600 dark:text-gray-400">✓ 4000 Mana/Monat</li>
          <li class="text-gray-600 dark:text-gray-400">✓ +50 Mana/Tag</li>
          <li class="text-gray-600 dark:text-gray-400">✓ Alle Features</li>
        </ul>
        <button class="mt-4 w-full rounded-lg bg-gradient-to-r from-green-500 to-emerald-600 py-2 text-sm font-medium text-white hover:from-green-600 hover:to-emerald-700">
          Upgrade
        </button>
      </div>
    </div>
  </div>
</div>
