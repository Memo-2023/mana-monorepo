/**
 * Feature flag utilities
 */

/**
 * Feature flag configuration
 */
export interface FeatureFlag {
	/** Feature key */
	key: string;
	/** Default enabled state */
	defaultEnabled: boolean;
	/** Description */
	description?: string;
	/** Environment variable to override */
	envVar?: string;
}

/**
 * Create a feature flag manager
 */
export function createFeatureFlags<T extends Record<string, FeatureFlag>>(
	flags: T,
	env: NodeJS.ProcessEnv = process.env
) {
	type FlagKey = keyof T;

	/**
	 * Check if a feature is enabled
	 */
	function isEnabled(key: FlagKey): boolean {
		const flag = flags[key];

		if (!flag) {
			return false;
		}

		// Check environment variable override
		if (flag.envVar) {
			const envValue = env[flag.envVar];
			if (envValue !== undefined) {
				return ['true', '1', 'yes', 'on'].includes(envValue.toLowerCase());
			}
		}

		// Check generic feature flag env var
		const genericEnvVar = `FEATURE_${String(key).toUpperCase()}`;
		const genericValue = env[genericEnvVar];
		if (genericValue !== undefined) {
			return ['true', '1', 'yes', 'on'].includes(genericValue.toLowerCase());
		}

		return flag.defaultEnabled;
	}

	/**
	 * Get all enabled features
	 */
	function getEnabledFeatures(): FlagKey[] {
		return (Object.keys(flags) as FlagKey[]).filter(isEnabled);
	}

	/**
	 * Get all disabled features
	 */
	function getDisabledFeatures(): FlagKey[] {
		return (Object.keys(flags) as FlagKey[]).filter((key) => !isEnabled(key));
	}

	/**
	 * Get feature configuration
	 */
	function getFlag(key: FlagKey): FeatureFlag | undefined {
		return flags[key];
	}

	/**
	 * Get all flags with their current state
	 */
	function getAllFlags(): Record<string, boolean> {
		const result: Record<string, boolean> = {};
		for (const key of Object.keys(flags) as FlagKey[]) {
			result[String(key)] = isEnabled(key);
		}
		return result;
	}

	return {
		isEnabled,
		getEnabledFeatures,
		getDisabledFeatures,
		getFlag,
		getAllFlags,
	};
}

/**
 * Simple feature check using environment variable
 */
export function isFeatureEnabled(
	featureName: string,
	defaultValue = false,
	env: NodeJS.ProcessEnv = process.env
): boolean {
	const envVar = `FEATURE_${featureName.toUpperCase().replace(/[^A-Z0-9]/g, '_')}`;
	const value = env[envVar];

	if (value === undefined) {
		return defaultValue;
	}

	return ['true', '1', 'yes', 'on'].includes(value.toLowerCase());
}

/**
 * App metadata configuration
 */
export interface AppMetadata {
	/** App name */
	name: string;
	/** App version */
	version: string;
	/** App description */
	description?: string;
	/** Build number */
	buildNumber?: string;
	/** Git commit hash */
	commitHash?: string;
	/** Build timestamp */
	buildTime?: string;
	/** Environment */
	environment?: string;
}

/**
 * Create app metadata from environment
 */
export function createAppMetadata(
	config: {
		name: string;
		version: string;
		description?: string;
	},
	env: NodeJS.ProcessEnv = process.env
): AppMetadata {
	return {
		name: config.name,
		version: config.version,
		description: config.description,
		buildNumber: env.BUILD_NUMBER || env.VITE_BUILD_NUMBER,
		commitHash: env.COMMIT_HASH || env.VITE_COMMIT_HASH || env.GIT_COMMIT,
		buildTime: env.BUILD_TIME || env.VITE_BUILD_TIME,
		environment: env.NODE_ENV || 'development',
	};
}

/**
 * Format version string with build info
 */
export function formatVersion(metadata: AppMetadata): string {
	let version = metadata.version;

	if (metadata.buildNumber) {
		version += ` (${metadata.buildNumber})`;
	}

	if (metadata.commitHash) {
		const shortHash = metadata.commitHash.substring(0, 7);
		version += ` [${shortHash}]`;
	}

	return version;
}
