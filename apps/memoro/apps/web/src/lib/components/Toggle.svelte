<script lang="ts">
	interface Props {
		isOn: boolean;
		onToggle: (value: boolean) => void;
		disabled?: boolean;
	}

	let { isOn = false, onToggle, disabled = false }: Props = $props();

	function handleToggle() {
		if (!disabled) {
			onToggle(!isOn);
		}
	}
</script>

<button
	onclick={handleToggle}
	class="relative h-8 w-14 flex-shrink-0 rounded-full transition-colors {isOn
		? 'bg-primary'
		: 'bg-menu'} {disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}"
	role="switch"
	aria-checked={isOn}
	{disabled}
>
	<span
		class="absolute top-1 left-1 h-6 w-6 rounded-full bg-white shadow-md transition-transform {isOn
			? 'translate-x-6'
			: 'translate-x-0'}"
	></span>
</button>
