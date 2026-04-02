<script lang="ts">
	import { ReminderPicker } from '@manacore/shared-ui';

	interface Props {
		value: number | null;
		onChange: (minutes: number | null) => void;
		disabled?: boolean;
	}

	let { value, onChange, disabled = false }: Props = $props();
</script>

<ReminderPicker {value} {onChange} {disabled} />
