/**
 * Landing Page API Service
 *
 * Handles saving landing config to org metadata and triggering builds.
 */

import { fetchWithRetry, type ApiResult } from '../base-client';
import { getManaAuthUrl } from '../config';
import type { LandingPageConfig } from '@mana/shared-types';

const BUILDER_URL = 'http://localhost:3030';

interface BuildResult {
	success: boolean;
	url?: string;
	duration?: number;
}

/**
 * Fetch organization details including metadata
 */
export async function getOrganization(orgId: string): Promise<ApiResult<any>> {
	const authUrl = getManaAuthUrl();
	return fetchWithRetry(`${authUrl}/api/v1/auth/organizations/${orgId}`);
}

/**
 * Save landing page config to organization metadata
 */
export async function saveLandingConfig(
	orgId: string,
	config: LandingPageConfig,
	existingMetadata: Record<string, unknown> = {}
): Promise<ApiResult<any>> {
	const authUrl = getManaAuthUrl();
	return fetchWithRetry(`${authUrl}/api/v1/auth/organizations/${orgId}`, {
		method: 'PUT',
		body: JSON.stringify({
			metadata: {
				...existingMetadata,
				landingPage: config,
			},
		}),
	});
}

/**
 * Trigger a build of the landing page
 */
export async function publishLanding(
	orgId: string,
	slug: string,
	config: LandingPageConfig
): Promise<ApiResult<BuildResult>> {
	return fetchWithRetry(`${BUILDER_URL}/api/v1/build`, {
		method: 'POST',
		body: JSON.stringify({
			organizationId: orgId,
			slug,
			config,
		}),
	});
}
