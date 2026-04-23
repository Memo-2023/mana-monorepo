<!--
  VisibilityPicker — one compact dropdown used in every module's detail
  view to toggle a record's visibility. The trigger is a lock/globe icon
  with the short label; opening it reveals all four levels with their
  descriptions.

  Stateless — the consumer owns the current level and the onChange
  callback. Keeps the component reusable across stores and encryption
  boundaries.
-->
<script lang="ts">
	import { Lock, UsersThree, LinkSimple, Globe, CaretDown } from '@mana/shared-icons';
	import type { Component } from 'svelte';
	import { VISIBILITY_LEVELS, VISIBILITY_METADATA, type VisibilityLevel } from './types';

	interface Props {
		level: VisibilityLevel;
		onChange: (next: VisibilityLevel) => void;
		/** Hide specific levels — e.g. a single-user space has no `space` option. */
		disabledLevels?: VisibilityLevel[];
		/** Show only the icon, not the label. For tight layouts. */
		compact?: boolean;
		/** Disable the whole control. */
		disabled?: boolean;
	}

	let { level, onChange, disabledLevels = [], compact = false, disabled = false }: Props = $props();

	const ICON_MAP: Record<VisibilityLevel, Component> = {
		private: Lock,
		space: UsersThree,
		unlisted: LinkSimple,
		public: Globe,
	};

	let open = $state(false);
	let triggerEl = $state<HTMLButtonElement | null>(null);

	const current = $derived(VISIBILITY_METADATA[level]);
	const CurrentIcon = $derived(ICON_MAP[level]);

	function toggle() {
		if (disabled) return;
		open = !open;
	}

	function select(next: VisibilityLevel) {
		open = false;
		if (next === level) return;
		onChange(next);
	}

	function onKeyDown(e: KeyboardEvent) {
		if (e.key === 'Escape' && open) {
			e.preventDefault();
			open = false;
			triggerEl?.focus();
		}
	}
</script>

<div class="vp" onkeydown={onKeyDown} role="presentation">
	<button
		bind:this={triggerEl}
		class="vp__trigger"
		class:vp__trigger--compact={compact}
		class:vp__trigger--open={open}
		onclick={toggle}
		{disabled}
		aria-haspopup="menu"
		aria-expanded={open}
		title={current.description}
	>
		<CurrentIcon size={14} weight="bold" />
		{#if !compact}
			<span class="vp__label">{current.label}</span>
			<span class="vp__caret"><CaretDown size={10} weight="bold" /></span>
		{/if}
	</button>

	{#if open}
		<!-- svelte-ignore a11y_click_events_have_key_events -->
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div class="vp__backdrop" onclick={() => (open = false)}></div>
		<div class="vp__menu" role="menu">
			{#each VISIBILITY_LEVELS as lvl (lvl)}
				{@const meta = VISIBILITY_METADATA[lvl]}
				{@const Icon = ICON_MAP[lvl]}
				{@const isDisabled = disabledLevels.includes(lvl)}
				<button
					class="vp__opt"
					class:vp__opt--active={lvl === level}
					disabled={isDisabled}
					role="menuitemradio"
					aria-checked={lvl === level}
					onclick={() => select(lvl)}
				>
					<span class="vp__opt-icon"><Icon size={16} weight="bold" /></span>
					<span class="vp__opt-text">
						<span class="vp__opt-label">{meta.label}</span>
						<span class="vp__opt-desc">{meta.description}</span>
					</span>
				</button>
			{/each}
		</div>
	{/if}
</div>

<style>
	.vp {
		position: relative;
		display: inline-flex;
	}
	.vp__trigger {
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
		padding: 0.25rem 0.55rem;
		background: transparent;
		border: 1px solid rgba(255, 255, 255, 0.12);
		border-radius: 0.375rem;
		color: inherit;
		font-size: 0.75rem;
		font-weight: 500;
		cursor: pointer;
		transition:
			background 0.15s,
			border-color 0.15s,
			opacity 0.15s;
	}
	.vp__trigger:hover:not(:disabled) {
		background: rgba(255, 255, 255, 0.06);
		border-color: rgba(255, 255, 255, 0.22);
	}
	.vp__trigger--open {
		background: rgba(99, 102, 241, 0.12);
		border-color: rgba(99, 102, 241, 0.4);
	}
	.vp__trigger:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}
	.vp__trigger--compact {
		padding: 0.25rem 0.35rem;
	}
	.vp__label {
		line-height: 1;
	}
	.vp__caret {
		display: inline-flex;
		opacity: 0.6;
	}

	.vp__backdrop {
		position: fixed;
		inset: 0;
		z-index: 50;
		background: transparent;
	}
	.vp__menu {
		position: absolute;
		top: calc(100% + 0.35rem);
		right: 0;
		z-index: 60;
		display: flex;
		flex-direction: column;
		min-width: 16rem;
		padding: 0.25rem;
		border-radius: 0.5rem;
		background: rgb(20, 24, 32);
		border: 1px solid rgba(255, 255, 255, 0.12);
		box-shadow: 0 8px 24px rgba(0, 0, 0, 0.35);
	}
	.vp__opt {
		display: flex;
		align-items: flex-start;
		gap: 0.55rem;
		padding: 0.5rem 0.625rem;
		background: transparent;
		border: none;
		border-radius: 0.375rem;
		color: inherit;
		cursor: pointer;
		text-align: left;
		transition: background 0.1s;
	}
	.vp__opt:hover:not(:disabled) {
		background: rgba(255, 255, 255, 0.04);
	}
	.vp__opt--active {
		background: rgba(99, 102, 241, 0.12);
	}
	.vp__opt:disabled {
		opacity: 0.35;
		cursor: not-allowed;
	}
	.vp__opt-icon {
		display: inline-flex;
		align-items: center;
		margin-top: 0.1rem;
		flex: 0 0 auto;
	}
	.vp__opt-text {
		display: flex;
		flex-direction: column;
		gap: 0.1rem;
		min-width: 0;
	}
	.vp__opt-label {
		font-size: 0.8125rem;
		font-weight: 600;
	}
	.vp__opt-desc {
		font-size: 0.7rem;
		opacity: 0.6;
		line-height: 1.3;
	}
</style>
