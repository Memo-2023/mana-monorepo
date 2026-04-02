<script lang="ts">
	import { goto } from '$app/navigation';
	import { LoginPage } from '@manacore/shared-auth-ui';
	import NewsLogo from '$lib/components/NewsLogo.svelte';
	import { authStore } from '$lib/stores/auth.svelte';

	async function handleSignIn(email: string, password: string) {
		return authStore.signIn(email, password);
	}
</script>

<LoginPage
	appName="News Hub"
	logo={NewsLogo}
	primaryColor="#10b981"
	onSignIn={handleSignIn}
	onResendVerification={(email) => authStore.resendVerificationEmail(email)}
	passkeyAvailable={authStore.isPasskeyAvailable()}
	onSignInWithPasskey={() => authStore.signInWithPasskey()}
	onVerifyTwoFactor={(code, trust) => authStore.verifyTwoFactor(code, trust)}
	onVerifyBackupCode={(code) => authStore.verifyBackupCode(code)}
	onSendMagicLink={(email) => authStore.sendMagicLink(email)}
	{goto}
	successRedirect="/feed"
	registerPath="/auth/register"
	forgotPasswordPath="/auth/forgot-password"
/>
