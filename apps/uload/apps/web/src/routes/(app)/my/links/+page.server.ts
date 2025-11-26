import { fail, redirect } from '@sveltejs/kit'
import type { Actions, PageServerLoad } from './$types'
import { links, clicks, tags, linkTags, workspaces } from '$lib/db/schema'
import { eq, and, or, desc, count, ilike, sql } from 'drizzle-orm'

// Simple short code generator
function generateShortCode(): string {
	const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
	let result = ''
	for (let i = 0; i < 7; i++) {
		result += chars.charAt(Math.floor(Math.random() * chars.length))
	}
	return result
}

export const load: PageServerLoad = async ({ locals, url }) => {
	// Check authentication first
	if (!locals.user) {
		console.log('[LINKS] No user found, redirecting to login')
		redirect(303, '/login')
	}

	try {
		const page = parseInt(url.searchParams.get('page') || '1')
		const limit = parseInt(url.searchParams.get('limit') || '20')
		const search = url.searchParams.get('search') || ''
		const status = url.searchParams.get('status') || 'all'

		const offset = (page - 1) * limit

		// Build query conditions
		const conditions = [eq(links.userId, locals.user.id)]

		if (search) {
			conditions.push(
				or(
					ilike(links.title, `%${search}%`),
					ilike(links.originalUrl, `%${search}%`),
					ilike(links.description, `%${search}%`)
				)!
			)
		}

		if (status === 'active') {
			conditions.push(eq(links.isActive, true))
		} else if (status === 'inactive') {
			conditions.push(eq(links.isActive, false))
		}

		// Get total count
		const [{ total }] = await locals.db
			.select({ total: count() })
			.from(links)
			.where(and(...conditions))

		// Get paginated links
		const userLinks = await locals.db
			.select()
			.from(links)
			.where(and(...conditions))
			.orderBy(desc(links.createdAt))
			.limit(limit)
			.offset(offset)

		// Get click counts for each link
		const linksWithClicks = await Promise.all(
			userLinks.map(async (link) => {
				const [clickResult] = await locals.db
					.select({ count: count() })
					.from(clicks)
					.where(eq(clicks.linkId, link.id))

				// Get last click
				const [lastClick] = await locals.db
					.select({ clickedAt: clicks.clickedAt })
					.from(clicks)
					.where(eq(clicks.linkId, link.id))
					.orderBy(desc(clicks.clickedAt))
					.limit(1)

				return {
					...link,
					clicks: clickResult?.count || 0,
					last_clicked_at: lastClick?.clickedAt || null
				}
			})
		)

		// Load user's tags
		const userTags = await locals.db
			.select()
			.from(tags)
			.where(eq(tags.userId, locals.user.id))
			.orderBy(tags.name)

		return {
			links: {
				items: linksWithClicks,
				page,
				perPage: limit,
				totalItems: total,
				totalPages: Math.ceil(total / limit)
			},
			tags: userTags,
			user: locals.user,
			filters: {
				search,
				status,
				page,
				limit
			}
		}
	} catch (err: any) {
		console.error('[LINKS] ERROR in load function:', err)

		return {
			links: {
				items: [],
				page: 1,
				perPage: 20,
				totalItems: 0,
				totalPages: 0
			},
			tags: [],
			user: locals.user,
			filters: {
				search: url.searchParams.get('search') || '',
				status: url.searchParams.get('status') || 'all',
				page: parseInt(url.searchParams.get('page') || '1'),
				limit: parseInt(url.searchParams.get('limit') || '20')
			}
		}
	}
}

export const actions = {
	create: async ({ request, url, locals }) => {
		if (!locals.user?.id) {
			return fail(401, { error: 'Sie müssen eingeloggt sein, um Links zu erstellen' })
		}

		const data = await request.formData()
		const urlToShorten = data.get('url') as string
		const title = data.get('title') as string
		const description = data.get('description') as string
		const expiresIn = data.get('expires_in') as string
		const maxClicks = data.get('max_clicks') as string
		const password = data.get('password') as string
		const customCode = data.get('custom_code') as string
		const tagIds = data.getAll('tags') as string[]

		if (!urlToShorten) {
			return fail(400, { error: 'URL is required' })
		}

		let shortCode = customCode?.trim() || generateShortCode()

		let attempts = 0
		const maxAttempts = 10

		while (attempts < maxAttempts) {
			try {
				let expiresAt = null
				if (expiresIn) {
					const days = parseInt(expiresIn)
					if (!isNaN(days) && days > 0) {
						const date = new Date()
						date.setDate(date.getDate() + days)
						expiresAt = date
					}
				}

				// Create the link
				const [newLink] = await locals.db
					.insert(links)
					.values({
						userId: locals.user.id,
						originalUrl: urlToShorten,
						shortCode: shortCode,
						title: title || null,
						description: description || null,
						isActive: true,
						expiresAt: expiresAt,
						maxClicks: maxClicks ? parseInt(maxClicks) : null,
						password: password || null,
						clickCount: 0
					})
					.returning()

				// Create link_tags relationships
				if (tagIds && tagIds.length > 0) {
					for (const tagId of tagIds) {
						try {
							await locals.db.insert(linkTags).values({
								linkId: newLink.id,
								tagId: tagId
							})
							// Update tag usage count
							await locals.db
								.update(tags)
								.set({ usageCount: sql`${tags.usageCount} + 1` })
								.where(eq(tags.id, tagId))
						} catch (err) {
							console.error('Failed to associate tag:', err)
						}
					}
				}

				const shortUrl = `${url.origin}/${newLink.shortCode}`

				return {
					success: true,
					shortUrl,
					link: newLink
				}
			} catch (err: any) {
				// Check for unique constraint violation
				if (err?.code === '23505' || err?.message?.includes('unique')) {
					shortCode = generateShortCode()
					attempts++
				} else {
					console.error('Failed to create link:', err)
					return fail(400, { error: 'Failed to create short link' })
				}
			}
		}

		return fail(400, { error: 'Could not generate unique short code' })
	},

	toggle: async ({ request, locals }) => {
		if (!locals.user?.id) {
			return fail(401, { error: 'Not authenticated' })
		}

		const data = await request.formData()
		const id = data.get('id') as string
		const isActive = data.get('is_active') === 'true'

		try {
			// Verify ownership
			const [link] = await locals.db
				.select()
				.from(links)
				.where(and(eq(links.id, id), eq(links.userId, locals.user.id)))
				.limit(1)

			if (!link) {
				return fail(403, { error: 'Link not found or not owned by you' })
			}

			await locals.db
				.update(links)
				.set({
					isActive: !isActive,
					updatedAt: new Date()
				})
				.where(eq(links.id, id))

			return { toggled: true }
		} catch (err) {
			console.error('Failed to toggle link:', err)
			return fail(400, { error: 'Failed to toggle link status' })
		}
	},

	delete: async ({ request, locals }) => {
		if (!locals.user?.id) {
			return fail(401, { error: 'Not authenticated' })
		}

		const data = await request.formData()
		const id = data.get('id') as string

		try {
			// Verify ownership
			const [link] = await locals.db
				.select()
				.from(links)
				.where(and(eq(links.id, id), eq(links.userId, locals.user.id)))
				.limit(1)

			if (!link) {
				return fail(403, { error: 'Link not found or not owned by you' })
			}

			// Delete associated link_tags first (CASCADE should handle this, but be explicit)
			const existingLinkTags = await locals.db
				.select()
				.from(linkTags)
				.where(eq(linkTags.linkId, id))

			for (const lt of existingLinkTags) {
				await locals.db.delete(linkTags).where(eq(linkTags.id, lt.id))
				// Update tag usage count
				await locals.db
					.update(tags)
					.set({ usageCount: sql`GREATEST(${tags.usageCount} - 1, 0)` })
					.where(eq(tags.id, lt.tagId))
			}

			// Delete the link (clicks will be deleted by CASCADE)
			await locals.db.delete(links).where(eq(links.id, id))

			return { deleted: true }
		} catch (err) {
			console.error('Failed to delete link:', err)
			return fail(400, { error: 'Failed to delete link' })
		}
	},

	update: async ({ request, url, locals }) => {
		if (!locals.user?.id) {
			return fail(401, { error: 'Sie müssen eingeloggt sein, um Links zu bearbeiten' })
		}

		const data = await request.formData()
		const id = data.get('id') as string
		const urlToShorten = data.get('url') as string
		const title = data.get('title') as string
		const description = data.get('description') as string
		const expiresIn = data.get('expires_in') as string
		const maxClicks = data.get('max_clicks') as string
		const password = data.get('password') as string
		const tagIds = data.getAll('tags') as string[]

		if (!id) {
			return fail(400, { error: 'Link ID is required for update' })
		}

		if (!urlToShorten) {
			return fail(400, { error: 'URL is required' })
		}

		try {
			// Verify ownership
			const [existingLink] = await locals.db
				.select()
				.from(links)
				.where(and(eq(links.id, id), eq(links.userId, locals.user.id)))
				.limit(1)

			if (!existingLink) {
				return fail(403, { error: 'You can only edit your own links' })
			}

			let expiresAt = null
			if (expiresIn) {
				const days = parseInt(expiresIn)
				if (!isNaN(days) && days > 0) {
					const date = new Date()
					date.setDate(date.getDate() + days)
					expiresAt = date
				}
			}

			// Update the link
			const [updatedLink] = await locals.db
				.update(links)
				.set({
					originalUrl: urlToShorten,
					title: title || null,
					description: description || null,
					expiresAt: expiresAt,
					maxClicks: maxClicks ? parseInt(maxClicks) : null,
					password: password || null,
					updatedAt: new Date()
				})
				.where(eq(links.id, id))
				.returning()

			// Update link_tags relationships
			// Delete existing
			const existingLinkTags = await locals.db
				.select()
				.from(linkTags)
				.where(eq(linkTags.linkId, id))

			for (const lt of existingLinkTags) {
				await locals.db.delete(linkTags).where(eq(linkTags.id, lt.id))
				await locals.db
					.update(tags)
					.set({ usageCount: sql`GREATEST(${tags.usageCount} - 1, 0)` })
					.where(eq(tags.id, lt.tagId))
			}

			// Create new
			if (tagIds && tagIds.length > 0) {
				for (const tagId of tagIds) {
					try {
						await locals.db.insert(linkTags).values({
							linkId: id,
							tagId: tagId
						})
						await locals.db
							.update(tags)
							.set({ usageCount: sql`${tags.usageCount} + 1` })
							.where(eq(tags.id, tagId))
					} catch (err) {
						console.error('Failed to associate tag:', err)
					}
				}
			}

			const shortUrl = `${url.origin}/${updatedLink.shortCode}`

			return {
				success: true,
				shortUrl,
				link: updatedLink
			}
		} catch (err: any) {
			console.error('Failed to update link:', err)
			return fail(400, { error: 'Failed to update link' })
		}
	},

	bulkAction: async ({ request, locals }) => {
		if (!locals.user?.id) {
			return fail(401, { error: 'Sie müssen eingeloggt sein' })
		}

		const data = await request.formData()
		const action = data.get('action') as string
		const linkIdsJson = data.get('linkIds') as string

		if (!linkIdsJson) {
			return fail(400, { error: 'No links selected' })
		}

		let linkIds: string[]
		try {
			linkIds = JSON.parse(linkIdsJson)
		} catch {
			return fail(400, { error: 'Invalid link IDs' })
		}

		if (linkIds.length === 0) {
			return fail(400, { error: 'No links selected' })
		}

		// Verify all links belong to current user
		for (const linkId of linkIds) {
			const [link] = await locals.db
				.select()
				.from(links)
				.where(and(eq(links.id, linkId), eq(links.userId, locals.user.id)))
				.limit(1)

			if (!link) {
				return fail(403, { error: 'You can only modify your own links' })
			}
		}

		switch (action) {
			case 'bulk-delete': {
				try {
					for (const linkId of linkIds) {
						// Delete link_tags
						const existingLinkTags = await locals.db
							.select()
							.from(linkTags)
							.where(eq(linkTags.linkId, linkId))

						for (const lt of existingLinkTags) {
							await locals.db.delete(linkTags).where(eq(linkTags.id, lt.id))
							await locals.db
								.update(tags)
								.set({ usageCount: sql`GREATEST(${tags.usageCount} - 1, 0)` })
								.where(eq(tags.id, lt.tagId))
						}

						// Delete link
						await locals.db.delete(links).where(eq(links.id, linkId))
					}
					return { success: true, deleted: linkIds.length }
				} catch (err) {
					console.error('Failed to delete links:', err)
					return fail(400, { error: 'Failed to delete links' })
				}
			}

			case 'bulk-toggle-active': {
				try {
					// Get current states
					const userLinks = await locals.db
						.select({ id: links.id, isActive: links.isActive })
						.from(links)
						.where(
							and(
								eq(links.userId, locals.user.id),
								sql`${links.id} = ANY(${linkIds}::uuid[])`
							)
						)

					// Determine new state (toggle majority)
					const activeCount = userLinks.filter((l) => l.isActive).length
					const newState = activeCount <= userLinks.length / 2

					for (const linkId of linkIds) {
						await locals.db
							.update(links)
							.set({ isActive: newState, updatedAt: new Date() })
							.where(eq(links.id, linkId))
					}

					return { success: true, toggled: linkIds.length, newState }
				} catch (err) {
					console.error('Failed to toggle links:', err)
					return fail(400, { error: 'Failed to toggle link status' })
				}
			}

			default:
				return fail(400, { error: 'Invalid action' })
		}
	}
} satisfies Actions
