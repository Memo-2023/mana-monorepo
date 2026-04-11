<script lang="ts">
	import { onMount } from 'svelte';
	import { PasskeyManager, TwoFactorSetup, AuditLog, SessionManager } from '@mana/shared-auth-ui';
	import { authStore } from '$lib/stores/auth.svelte';
	import SettingsPanel from '../SettingsPanel.svelte';

	let passkeys = $state<any[]>([]);
	let sessions = $state<any[]>([]);
	let sessionsLoading = $state(false);
	let securityEvents = $state<any[]>([]);
	let securityEventsLoading = $state(false);

	onMount(async () => {
		if (!authStore.isAuthenticated) return;
		try {
			passkeys = await authStore.listPasskeys();
			sessionsLoading = true;
			sessions = await authStore.listSessions();
			sessionsLoading = false;
			securityEventsLoading = true;
			securityEvents = await authStore.getSecurityEvents();
			securityEventsLoading = false;
		} catch (e) {
			console.error('SecuritySection load failed:', e);
			sessionsLoading = false;
			securityEventsLoading = false;
		}
	});
</script>

<SettingsPanel id="passkeys">
	<PasskeyManager
		{passkeys}
		passkeyAvailable={authStore.isPasskeyAvailable()}
		onRegister={(name) => authStore.registerPasskey(name)}
		onDelete={(id) => authStore.deletePasskey(id)}
		onRename={(id, name) => authStore.renamePasskey(id, name)}
		onRefresh={async () => {
			passkeys = await authStore.listPasskeys();
		}}
		primaryColor="#6366f1"
	/>
</SettingsPanel>

<SettingsPanel id="sessions">
	<SessionManager
		{sessions}
		loading={sessionsLoading}
		onRevoke={(id) => authStore.revokeSession(id)}
		onRefresh={async () => {
			sessionsLoading = true;
			sessions = await authStore.listSessions();
			sessionsLoading = false;
		}}
		primaryColor="#6366f1"
	/>
</SettingsPanel>

<SettingsPanel id="two-factor">
	<TwoFactorSetup
		enabled={!!authStore.user?.twoFactorEnabled}
		onEnable={(password) => authStore.enableTwoFactor(password)}
		onDisable={(password) => authStore.disableTwoFactor(password)}
		onGenerateBackupCodes={(password) => authStore.generateBackupCodes(password)}
		primaryColor="#6366f1"
	/>
</SettingsPanel>

<SettingsPanel id="security-log">
	<AuditLog
		events={securityEvents}
		loading={securityEventsLoading}
		onRefresh={async () => {
			securityEventsLoading = true;
			securityEvents = await authStore.getSecurityEvents();
			securityEventsLoading = false;
		}}
		primaryColor="#6366f1"
	/>
</SettingsPanel>
