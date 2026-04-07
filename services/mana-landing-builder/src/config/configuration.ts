export default () => ({
	port: parseInt(process.env.PORT || '3030', 10),
	cloudflare: {
		apiToken: process.env.CLOUDFLARE_API_TOKEN,
		accountId: process.env.CLOUDFLARE_ACCOUNT_ID,
	},
	orgLandingDomain: process.env.ORG_LANDING_DOMAIN || 'mana.how',
	manaAuthUrl: process.env.MANA_AUTH_URL || 'http://localhost:3001',
});
