import { error, redirect } from '@sveltejs/kit'
import type { PageServerLoad } from './$types'
import { workspaces, links, clicks } from '$lib/db/schema'
import { eq, and, sql } from 'drizzle-orm'

export const load: PageServerLoad = async ({ params, locals, url, request }) => {
	const workspaceSlug = params.workspace
	const shortCode = params.code

	// Reconstruct the full short code with workspace prefix
	const fullShortCode = `w/${workspaceSlug}/${shortCode}`

	console.log('[W_ROUTE] Workspace slug:', workspaceSlug)
	console.log('[W_ROUTE] Short code:', shortCode)
	console.log('[W_ROUTE] Full short code:', fullShortCode)

	try {
		// First, verify the workspace exists
		const [workspace] = await locals.db
			.select()
			.from(workspaces)
			.where(eq(workspaces.slug, workspaceSlug))
			.limit(1)

		if (!workspace) {
			console.log('[W_ROUTE] Workspace not found:', workspaceSlug)
			throw error(404, 'Workspace not found')
		}

		console.log('[W_ROUTE] Found workspace:', workspace.id, workspace.name)

		// Find the link by short code
		const [link] = await locals.db
			.select()
			.from(links)
			.where(and(eq(links.shortCode, fullShortCode), eq(links.workspaceId, workspace.id)))
			.limit(1)

		if (!link) {
			console.log('[W_ROUTE] Link not found with short code:', fullShortCode)
			throw error(404, 'Link not found')
		}

		console.log('[W_ROUTE] Found link:', link.id, link.originalUrl)

		// Check if link is active
		if (!link.isActive) {
			console.log('[W_ROUTE] Link is inactive')
			throw error(404, 'Link is inactive')
		}

		// Check expiration
		if (link.expiresAt) {
			const expiresAt = new Date(link.expiresAt)
			if (expiresAt < new Date()) {
				console.log('[W_ROUTE] Link has expired')
				throw error(410, 'Link has expired')
			}
		}

		// Check max clicks
		if (link.maxClicks && link.clickCount && link.clickCount >= link.maxClicks) {
			console.log('[W_ROUTE] Link has reached max clicks')
			throw error(410, 'Link has reached maximum clicks')
		}

		// Check password protection
		if (link.password) {
			const passwordParam = url.searchParams.get('pwd')
			if (passwordParam !== link.password) {
				console.log('[W_ROUTE] Link requires password')
				// Return link data to show password prompt
				return {
					link: {
						id: link.id,
						title: link.title,
						shortCode: link.shortCode
					},
					requiresPassword: true,
					workspace: {
						id: workspace.id,
						name: workspace.name,
						slug: workspace.slug
					}
				}
			}
		}

		// Record the click and increment count in a transaction
		try {
			const userAgent = request.headers.get('user-agent') || 'Unknown'
			const referer = request.headers.get('referer') || null
			const ip =
				request.headers.get('x-forwarded-for') ||
				request.headers.get('x-real-ip') ||
				'Unknown'

			// Parse user agent for browser/os/device
			const browser = userAgent.includes('Chrome')
				? 'Chrome'
				: userAgent.includes('Firefox')
					? 'Firefox'
					: userAgent.includes('Safari')
						? 'Safari'
						: 'Other'

			const os = userAgent.includes('Windows')
				? 'Windows'
				: userAgent.includes('Mac')
					? 'macOS'
					: userAgent.includes('Linux')
						? 'Linux'
						: userAgent.includes('Android')
							? 'Android'
							: userAgent.includes('iOS')
								? 'iOS'
								: 'Other'

			const deviceType = userAgent.includes('Mobile') ? 'Mobile' : 'Desktop'

			// Use transaction for atomic click recording
			await locals.db.transaction(async (tx) => {
				// Insert click record
				await tx.insert(clicks).values({
					linkId: link.id,
					ipHash: ip, // Note: Should hash this in production
					userAgent: userAgent,
					referer: referer,
					browser: browser,
					os: os,
					deviceType: deviceType,
					clickedAt: new Date()
				})

				// Increment click count
				await tx
					.update(links)
					.set({
						clickCount: sql`${links.clickCount} + 1`,
						updatedAt: new Date()
					})
					.where(eq(links.id, link.id))
			})

			console.log('[W_ROUTE] Click recorded successfully')
		} catch (err) {
			console.error('[W_ROUTE] Failed to record click:', err)
			// Don't fail the redirect if click recording fails
		}

		// Redirect to the original URL
		console.log('[W_ROUTE] Redirecting to:', link.originalUrl)
		throw redirect(302, link.originalUrl)
	} catch (err: any) {
		console.error('[W_ROUTE] Error:', err)

		// Re-throw SvelteKit errors
		if (err?.status) {
			throw err
		}

		// Generic error
		throw error(500, 'An error occurred')
	}
}
