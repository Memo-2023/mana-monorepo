<script lang="ts">
	interface Props {
		isOn: boolean;
		onToggle: (value: boolean) => void;
		disabled?: boolean;
		size?: 'sm' | 'md';
	}

	let { isOn = false, onToggle, disabled = false, size = 'md' }: Props = $props();

	function handleToggle() {
		if (!disabled) {
			onToggle(!isOn);
		}
	}

	const sizeClasses = {
		sm: { track: 'h-6 w-10', thumb: 'h-4 w-4 top-1 left-1', translate: 'translate-x-4' },
		md: { track: 'h-8 w-14', thumb: 'h-6 w-6 top-1 left-1', translate: 'translate-x-6' },
	};
</script>

<button
	onclick={handleToggle}
	class="relative {sizeClasses[size].track} flex-shrink-0 rounded-full transition-colors {isOn
		? 'bg-primary'
		: 'bg-menu'} {disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}"
	role="switch"
	aria-checked={isOn}
	aria-label="Toggle"
	{disabled}
>
	<span
		class="absolute {sizeClasses[size]
			.thumb} rounded-full bg-white shadow-md transition-transform {isOn
			? sizeClasses[size].translate
			: 'translate-x-0'}"
	></span>
</button>
