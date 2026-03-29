<script lang="ts">
	import { goto } from '$app/navigation';
	import { LoginPage } from '@manacore/shared-auth-ui';
	import WisekeepLogo from '$lib/components/WisekeepLogo.svelte';
	import { authStore } from '$lib/stores/auth.svelte';
</script>

<LoginPage
	appName="Wisekeep"
	logo={WisekeepLogo}
	primaryColor="#8b5cf6"
	onSignIn={(email, password) => authStore.signIn(email, password)}
	onResendVerification={(email) => authStore.resendVerificationEmail(email)}
	passkeyAvailable={authStore.isPasskeyAvailable()}
	onSignInWithPasskey={() => authStore.signInWithPasskey()}
	onVerifyTwoFactor={(code, trust) => authStore.verifyTwoFactor(code, trust)}
	onVerifyBackupCode={(code) => authStore.verifyBackupCode(code)}
	onSendMagicLink={(email) => authStore.sendMagicLink(email)}
	{goto}
	successRedirect="/transcribe"
	registerPath="/auth/register"
/>
