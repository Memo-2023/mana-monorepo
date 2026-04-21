/**
 * Tiny helper to pull the configured mail domain without threading the
 * full Config object through every DNS call. Config.loadConfig() runs
 * at boot, so MAIL_DOMAIN is always defined by the time these helpers
 * run — we just read it from process.env directly.
 */
export function getMailDomain(): string {
	return process.env.MAIL_DOMAIN || 'mana.how';
}
