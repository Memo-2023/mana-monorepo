<script lang="ts">
	import { goto } from '$app/navigation';
	import { LoginPage } from '@manacore/shared-auth-ui';
	import MoodlitLogo from '$lib/components/MoodlitLogo.svelte';
	import { authStore } from '$lib/stores/auth.svelte';
</script>

<LoginPage
	appName="Moodlit"
	logo={MoodlitLogo}
	primaryColor="#7c3aed"
	onSignIn={(e, p) => authStore.signIn(e, p)}
	onResendVerification={(e) => authStore.resendVerificationEmail(e)}
	passkeyAvailable={authStore.isPasskeyAvailable()}
	onSignInWithPasskey={() => authStore.signInWithPasskey()}
	onVerifyTwoFactor={(c, t) => authStore.verifyTwoFactor(c, t)}
	onVerifyBackupCode={(c) => authStore.verifyBackupCode(c)}
	onSendMagicLink={(e) => authStore.sendMagicLink(e)}
	{goto}
	successRedirect="/moods"
	registerPath="/auth/register"
/>
