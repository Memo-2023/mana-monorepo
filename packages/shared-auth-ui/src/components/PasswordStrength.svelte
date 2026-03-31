<script lang="ts">
	let initialized = false;
	let zxcvbnFn: any = null;

	interface Props {
		password: string;
		primaryColor?: string;
		locale?: 'de' | 'en';
	}

	let { password, primaryColor = '#6366f1', locale = 'de' }: Props = $props();

	let score = $state(0);
	let feedback = $state('');
	let debounceTimer: ReturnType<typeof setTimeout>;

	async function initZxcvbn() {
		if (initialized) return;
		const [{ zxcvbn, zxcvbnOptions }, common, de] = await Promise.all([
			import('@zxcvbn-ts/core'),
			import('@zxcvbn-ts/language-common'),
			import('@zxcvbn-ts/language-de'),
		]);
		zxcvbnOptions.setOptions({
			translations: de.translations,
			graphs: common.adjacencyGraphs,
			dictionary: { ...common.dictionary, ...de.dictionary },
		});
		zxcvbnFn = zxcvbn;
		initialized = true;
	}

	const labelsDE = ['Sehr schwach', 'Schwach', 'OK', 'Stark', 'Sehr stark'];
	const labelsEN = ['Very weak', 'Weak', 'OK', 'Strong', 'Very strong'];
	const labels = $derived(locale === 'en' ? labelsEN : labelsDE);
	const colors = ['#ef4444', '#f97316', '#eab308', '#84cc16', '#22c55e'];

	$effect(() => {
		if (!password) {
			score = 0;
			feedback = '';
			return;
		}

		clearTimeout(debounceTimer);
		debounceTimer = setTimeout(async () => {
			await initZxcvbn();
			if (zxcvbnFn && password) {
				const result = zxcvbnFn(password);
				score = result.score;
				const suggestions = result.feedback.suggestions || [];
				const warning = result.feedback.warning || '';
				feedback = warning || suggestions[0] || '';
			}
		}, 150);
	});
</script>

{#if password}
	<div class="strength-container">
		<div class="strength-bar">
			{#each [0, 1, 2, 3] as i}
				<div
					class="strength-segment"
					style:background-color={i <= score - 1 ? colors[score] : 'rgba(128,128,128,0.2)'}
				></div>
			{/each}
		</div>
		<span class="strength-label" style:color={colors[score]}>{labels[score]}</span>
		{#if feedback}
			<p class="strength-feedback">{feedback}</p>
		{/if}
	</div>
{/if}

<style>
	.strength-container {
		margin-top: 0.5rem;
		margin-bottom: 0.5rem;
	}

	.strength-bar {
		display: flex;
		gap: 4px;
		height: 4px;
		margin-bottom: 0.375rem;
	}

	.strength-segment {
		flex: 1;
		border-radius: 2px;
		transition: background-color 0.3s;
	}

	.strength-label {
		font-size: 0.75rem;
		font-weight: 600;
	}

	.strength-feedback {
		font-size: 0.75rem;
		color: rgba(156, 163, 175, 0.8);
		margin-top: 0.25rem;
	}
</style>
