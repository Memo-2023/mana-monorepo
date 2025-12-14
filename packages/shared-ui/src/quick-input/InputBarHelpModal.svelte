<script lang="ts">
	import { HelpModal } from '../help';
	import { COMMON_SHORTCUTS, COMMON_SYNTAX, DEFAULT_LIVE_EXAMPLE } from '../help';
	import type { HelpModalConfig } from '../help';

	interface Props {
		open: boolean;
		onClose: () => void;
		mode?: 'shortcuts' | 'syntax';
	}

	let { open, onClose, mode = 'shortcuts' }: Props = $props();

	// Build the config for HelpModal using common defaults
	const config: HelpModalConfig = {
		shortcuts: COMMON_SHORTCUTS,
		syntax: COMMON_SYNTAX,
		defaultTab: mode,
		liveExample: DEFAULT_LIVE_EXAMPLE,
	};
</script>

<HelpModal {open} {onClose} {config} />
