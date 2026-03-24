<script lang="ts">
	import { HelpModal } from '../help';
	import { COMMON_SHORTCUTS, COMMON_SYNTAX, DEFAULT_LIVE_EXAMPLE } from '../help';
	import type { HelpModalConfig, SyntaxGroup } from '../help';

	interface Props {
		open: boolean;
		onClose: () => void;
		mode?: 'shortcuts' | 'syntax';
		/** App-specific syntax patterns (shown before common patterns) */
		appSyntax?: SyntaxGroup[];
		/** Override the live example */
		liveExample?: HelpModalConfig['liveExample'];
	}

	let { open, onClose, mode = 'shortcuts', appSyntax, liveExample }: Props = $props();

	// Build the config for HelpModal: app-specific syntax first, then common
	const config = $derived<HelpModalConfig>({
		shortcuts: COMMON_SHORTCUTS,
		syntax: [...(appSyntax || []), ...COMMON_SYNTAX],
		defaultTab: mode,
		liveExample: liveExample || DEFAULT_LIVE_EXAMPLE,
	});
</script>

<HelpModal {open} {onClose} {config} />
