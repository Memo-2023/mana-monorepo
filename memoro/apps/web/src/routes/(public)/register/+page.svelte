<script lang="ts">
	import { goto } from '$app/navigation';
	import { RegisterPage } from '@manacore/shared-auth-ui';
	import MemoroLogo from '$lib/components/MemoroLogo.svelte';
	import { auth } from '$lib/stores/auth';

	async function handleSignUp(email: string, password: string) {
		return auth.signUp(email, password);
	}
</script>

<RegisterPage
	appName="Memoro"
	logo={MemoroLogo}
	primaryColor="#f8d62b"
	onSignUp={handleSignUp}
	goto={goto}
	successRedirect="/dashboard"
	loginPath="/login"
	lightBackground="#dddddd"
	darkBackground="#101010"
/>
