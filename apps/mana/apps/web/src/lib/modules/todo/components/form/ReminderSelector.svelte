<script lang="ts">
	import { ReminderPicker } from '@mana/shared-ui';

	interface Props {
		value: number | null;
		onChange: (minutes: number | null) => void;
		disabled?: boolean;
	}

	let { value, onChange, disabled = false }: Props = $props();
</script>

<ReminderPicker {value} {onChange} {disabled} />
