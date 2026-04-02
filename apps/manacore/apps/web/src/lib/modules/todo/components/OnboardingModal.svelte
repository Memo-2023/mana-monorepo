<script lang="ts">
	import { _ } from 'svelte-i18n';
	import { CheckCircle, ListChecks, Columns, Sparkle } from '@manacore/shared-icons';

	interface Props {
		open: boolean;
		onClose: () => void;
	}

	let { open, onClose }: Props = $props();

	let step = $state(0);

	let steps = $derived([
		{
			icon: Sparkle,
			title: $_('todo.onboarding.welcome'),
			desc: $_('todo.onboarding.intro'),
		},
		{
			icon: ListChecks,
			title: $_('todo.onboarding.step1Title'),
			desc: $_('todo.onboarding.step1'),
		},
		{
			icon: Columns,
			title: $_('todo.onboarding.step2Title'),
			desc: $_('todo.onboarding.step2'),
		},
		{
			icon: CheckCircle,
			title: $_('todo.onboarding.step3Title'),
			desc: $_('todo.onboarding.step3'),
		},
	]);

	function next() {
		if (step < steps.length - 1) {
			step++;
		} else {
			finish();
		}
	}

	function finish() {
		try {
			localStorage.setItem('todo-onboarding-done', 'true');
		} catch {}
		onClose();
	}
</script>

{#if open}
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		class="fixed inset-0 z-[9997] flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm"
		onclick={(e) => e.target === e.currentTarget && finish()}
	>
		<div class="w-full max-w-sm rounded-2xl border border-border bg-card shadow-2xl">
			<div class="flex flex-col items-center p-8 text-center">
				<div class="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
					<svelte:component this={steps[step].icon} size={32} class="text-primary" />
				</div>

				<h2 class="mb-2 text-xl font-bold text-foreground">{steps[step].title}</h2>
				<p class="mb-6 text-sm text-muted-foreground">{steps[step].desc}</p>

				<!-- Progress dots -->
				<div class="mb-6 flex gap-1.5">
					{#each steps as _, i}
						<div
							class="h-1.5 rounded-full transition-all {i === step
								? 'w-6 bg-primary'
								: i < step
									? 'w-1.5 bg-primary/40'
									: 'w-1.5 bg-muted'}"
						></div>
					{/each}
				</div>

				<div class="flex gap-2">
					{#if step < steps.length - 1}
						<button
							onclick={finish}
							class="rounded-lg px-4 py-2 text-sm text-muted-foreground hover:text-foreground"
						>
							{$_('common.cancel')}
						</button>
					{/if}
					<button
						onclick={next}
						class="rounded-lg bg-primary px-6 py-2 text-sm font-medium text-primary-foreground"
					>
						{step < steps.length - 1 ? $_('todo.onboarding.next') : $_('todo.onboarding.letsGo')}
					</button>
				</div>
			</div>
		</div>
	</div>
{/if}
