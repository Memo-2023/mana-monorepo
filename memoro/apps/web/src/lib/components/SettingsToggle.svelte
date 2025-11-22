<script lang="ts">
	import Toggle from './Toggle.svelte';

	interface Props {
		title: string;
		description?: string;
		type: 'toggle' | 'button';
		isOn?: boolean;
		onToggle?: (value: boolean) => void;
		onPress?: () => void;
		secondaryText?: string;
		icon?: string;
	}

	let { title, description, type, isOn = false, onToggle, onPress, secondaryText, icon }: Props =
		$props();

	function handlePress() {
		if (type === 'button' && onPress) {
			onPress();
		}
	}

	function handleToggle(value: boolean) {
		if (type === 'toggle' && onToggle) {
			onToggle(value);
		}
	}
</script>

<div
	onclick={type === 'button' ? handlePress : undefined}
	class="w-full rounded-2xl border border-theme bg-content text-left transition-colors {type ===
	'button'
		? 'cursor-pointer bg-content-hover'
		: ''}"
	role={type === 'button' ? 'button' : undefined}
	tabindex={type === 'button' ? 0 : undefined}
>
	<div class="px-4 py-6">
		<!-- Title Row with Toggle/Icon -->
		<div class="mb-4 flex items-center justify-between">
			<h3 class="mr-2 flex-1 text-base font-semibold text-theme">
				{title}
			</h3>

			{#if type === 'toggle' && onToggle}
				<div>
					<Toggle {isOn} onToggle={handleToggle} />
				</div>
			{:else if type === 'button'}
				<div class="flex items-center">
					{#if secondaryText}
						<span class="mr-2 text-sm text-theme-secondary">{secondaryText}</span>
					{/if}
					{#if icon}
						<svg
							class="h-5 w-5 text-theme-secondary"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
						>
							{#if icon === 'mail-outline'}
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
								/>
							{:else if icon === 'star-outline'}
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
								/>
							{/if}
						</svg>
					{/if}
					<svg
						class="ml-2 h-5 w-5 text-theme"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
					>
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
					</svg>
				</div>
			{/if}
		</div>

		<!-- Description -->
		{#if description}
			<p class="text-sm leading-[26px] text-theme-secondary">
				{description}
			</p>
		{/if}
	</div>
</div>
