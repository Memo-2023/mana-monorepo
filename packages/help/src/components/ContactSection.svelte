<script lang="ts">
	import type { ContactSectionProps } from '../ui-types';

	let { contact, translations }: ContactSectionProps = $props();
</script>

{#if !contact}
	<p class="py-8 text-center text-gray-500 dark:text-gray-400">
		{translations.contact.noInfo}
	</p>
{:else}
	<div class="space-y-6">
		<div class="prose prose-sm dark:prose-invert max-w-none">
			{@html contact.content}
		</div>

		<div class="grid gap-4 sm:grid-cols-2">
			{#if contact.supportEmail}
				<a
					href={`mailto:${contact.supportEmail}`}
					class="flex items-center gap-3 rounded-lg border border-gray-200 p-4 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
				>
					<div
						class="bg-primary-100 text-primary-600 dark:bg-primary-900 dark:text-primary-400 flex h-10 w-10 items-center justify-center rounded-full"
					>
						<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
							/>
						</svg>
					</div>
					<div>
						<p class="font-medium text-gray-900 dark:text-gray-100">
							{translations.contact.email}
						</p>
						<p class="text-sm text-gray-600 dark:text-gray-400">
							{contact.supportEmail}
						</p>
					</div>
				</a>
			{/if}

			{#if contact.responseTime}
				<div
					class="flex items-center gap-3 rounded-lg border border-gray-200 p-4 dark:border-gray-700"
				>
					<div
						class="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400"
					>
						<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
							/>
						</svg>
					</div>
					<div>
						<p class="font-medium text-gray-900 dark:text-gray-100">
							{translations.contact.responseTime}
						</p>
						<p class="text-sm text-gray-600 dark:text-gray-400">
							{contact.responseTime}
						</p>
					</div>
				</div>
			{/if}

			{#if contact.discordUrl}
				<a
					href={contact.discordUrl}
					target="_blank"
					rel="noopener noreferrer"
					class="flex items-center gap-3 rounded-lg border border-gray-200 p-4 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
				>
					<div
						class="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 text-indigo-600 dark:bg-indigo-900 dark:text-indigo-400"
					>
						<svg class="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
							<path
								d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 00-.041-.106 13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"
							/>
						</svg>
					</div>
					<div>
						<p class="font-medium text-gray-900 dark:text-gray-100">Discord</p>
						<p class="text-sm text-gray-600 dark:text-gray-400">Join our community</p>
					</div>
				</a>
			{/if}

			{#if contact.documentationUrl}
				<a
					href={contact.documentationUrl}
					target="_blank"
					rel="noopener noreferrer"
					class="flex items-center gap-3 rounded-lg border border-gray-200 p-4 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
				>
					<div
						class="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
					>
						<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
							/>
						</svg>
					</div>
					<div>
						<p class="font-medium text-gray-900 dark:text-gray-100">Documentation</p>
						<p class="text-sm text-gray-600 dark:text-gray-400">Read the docs</p>
					</div>
				</a>
			{/if}
		</div>
	</div>
{/if}
