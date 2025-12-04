import { fail } from '@sveltejs/kit';
import { pb, generateTagSlug, DEFAULT_TAG_COLORS } from '$lib/pocketbase';
import type { Tag } from '$lib/pocketbase';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	console.log('\n=== TAGS PAGE LOAD DEBUG ===');
	console.log('[TAGS] Timestamp:', new Date().toISOString());
	console.log('[TAGS] User ID:', locals.user?.id);
	console.log('[TAGS] User email:', locals.user?.email);
	console.log('[TAGS] PB auth valid:', locals.pb?.authStore?.isValid);

	try {
		const filter = `user_id="${locals.user?.id}"`;
		console.log('[TAGS] Filter:', filter);

		const tags = await locals.pb.collection('tags').getList<Tag>(1, 100, {
			filter,
			sort: '-usage_count,name',
		});

		console.log('[TAGS] Response:');
		console.log('[TAGS] - Total items:', tags.totalItems);
		console.log('[TAGS] - Items received:', tags.items.length);
		if (tags.items.length > 0) {
			console.log('[TAGS] First tag:', JSON.stringify(tags.items[0], null, 2));
		}

		// Get link count and total clicks for each tag
		const tagsWithStats = await Promise.all(
			tags.items.map(async (tag) => {
				const linkTags = await locals.pb.collection('linktags').getList(1, 100, {
					filter: `tag_id="${tag.id}"`,
					expand: 'link_id',
				});

				// Calculate total clicks for all links with this tag
				let totalClicks = 0;
				for (const linkTag of linkTags.items) {
					if (linkTag.expand?.link_id) {
						try {
							const clicks = await locals.pb.collection('clicks').getList(1, 1, {
								filter: `link_id="${linkTag.link_id}"`,
							});
							totalClicks += clicks.totalItems;
						} catch (err) {
							console.error(`[TAGS] Failed to get clicks for link ${linkTag.link_id}:`, err);
						}
					}
				}

				return {
					...tag,
					linkCount: linkTags.totalItems,
					totalClicks,
				};
			})
		);

		console.log('[TAGS] Returning', tagsWithStats.length, 'tags with stats');
		console.log('=== END TAGS PAGE LOAD ===\n');

		return {
			tags: tagsWithStats,
		};
	} catch (err) {
		console.error('[TAGS] ERROR in load function:', err);
		console.error('[TAGS] Error details:', JSON.stringify(err, null, 2));
		return {
			tags: [],
		};
	}
};

export const actions = {
	create: async ({ request, locals }) => {
		const data = await request.formData();
		const name = data.get('name') as string;
		const color = data.get('color') as string;
		const icon = data.get('icon') as string;
		const isPublic = data.get('is_public') === 'on';

		if (!name) {
			return fail(400, { error: 'Tag name is required' });
		}

		try {
			const tag = await locals.pb.collection('tags').create({
				name: name.trim(),
				slug: generateTagSlug(name.trim()),
				color: color || DEFAULT_TAG_COLORS[0],
				icon: icon || '',
				user_id: locals.user?.id,
				is_public: isPublic,
				usage_count: 0,
			});

			return { success: true, tag };
		} catch (err) {
			return fail(400, { error: 'Failed to create tag' });
		}
	},

	update: async ({ request, locals }) => {
		const data = await request.formData();
		const id = data.get('id') as string;
		const name = data.get('name') as string;
		const color = data.get('color') as string;
		const icon = data.get('icon') as string;
		const isPublic = data.get('is_public') === 'on';

		if (!id || !name) {
			return fail(400, { error: 'Tag ID and name are required' });
		}

		try {
			await locals.pb.collection('tags').update(id, {
				name: name.trim(),
				slug: generateTagSlug(name.trim()),
				color: color || DEFAULT_TAG_COLORS[0],
				icon: icon || '',
				is_public: isPublic,
			});

			return { updated: true };
		} catch (err) {
			return fail(400, { error: 'Failed to update tag' });
		}
	},

	delete: async ({ request, locals }) => {
		const data = await request.formData();
		const id = data.get('id') as string;

		if (!id) {
			return fail(400, { error: 'Tag ID is required' });
		}

		try {
			// Delete all link_tags relationships first
			const linkTags = await locals.pb.collection('linktags').getList(1, 100, {
				filter: `tag_id="${id}"`,
			});

			for (const linkTag of linkTags.items) {
				await locals.pb.collection('linktags').delete(linkTag.id);
			}

			// Delete the tag
			await locals.pb.collection('tags').delete(id);

			return { deleted: true };
		} catch (err) {
			return fail(400, { error: 'Failed to delete tag' });
		}
	},

	bulkAction: async ({ request, locals }) => {
		// Ensure user is authenticated
		if (!locals.user?.id) {
			return fail(401, { error: 'Sie müssen eingeloggt sein' });
		}

		const data = await request.formData();
		const action = data.get('action') as string;
		const tagIdsJson = data.get('tagIds') as string;

		if (!tagIdsJson) {
			return fail(400, { error: 'No tags selected' });
		}

		let tagIds: string[];
		try {
			tagIds = JSON.parse(tagIdsJson);
		} catch {
			return fail(400, { error: 'Invalid tag IDs' });
		}

		if (tagIds.length === 0) {
			return fail(400, { error: 'No tags selected' });
		}

		// Verify all tags belong to the current user
		for (const tagId of tagIds) {
			try {
				const tag = await locals.pb.collection('tags').getOne(tagId);
				if (tag.user_id !== locals.user.id) {
					return fail(403, { error: 'You can only modify your own tags' });
				}
			} catch (err) {
				return fail(404, { error: `Tag ${tagId} not found` });
			}
		}

		switch (action) {
			case 'bulk-delete': {
				try {
					for (const tagId of tagIds) {
						// Delete all link_tags relationships first
						const linkTags = await locals.pb.collection('linktags').getList(1, 100, {
							filter: `tag_id="${tagId}"`,
						});

						for (const linkTag of linkTags.items) {
							await locals.pb.collection('linktags').delete(linkTag.id);
						}

						// Delete the tag
						await locals.pb.collection('tags').delete(tagId);
					}
					return { success: true, deleted: tagIds.length };
				} catch (err) {
					console.error('Failed to delete tags:', err);
					return fail(400, { error: 'Failed to delete tags' });
				}
			}

			case 'bulk-merge': {
				const targetTagId = data.get('targetTagId') as string;
				if (!targetTagId) {
					return fail(400, { error: 'No target tag selected' });
				}

				if (!tagIds.includes(targetTagId)) {
					return fail(400, { error: 'Target tag must be one of the selected tags' });
				}

				try {
					// Get the target tag
					const targetTag = await locals.pb.collection('tags').getOne(targetTagId);

					// Merge all other tags into the target tag
					for (const tagId of tagIds) {
						if (tagId === targetTagId) continue;

						// Get all link_tags for this tag
						const linkTags = await locals.pb.collection('linktags').getList(1, 100, {
							filter: `tag_id="${tagId}"`,
						});

						// For each link_tag, check if target tag already has this link
						for (const linkTag of linkTags.items) {
							// Check if this link already has the target tag
							const existingLinkTag = await locals.pb.collection('linktags').getList(1, 1, {
								filter: `link_id="${linkTag.link_id}" && tag_id="${targetTagId}"`,
							});

							if (existingLinkTag.totalItems === 0) {
								// Create new link_tag with target tag
								await locals.pb.collection('linktags').create({
									link_id: linkTag.link_id,
									tag_id: targetTagId,
								});
							}

							// Delete the old link_tag
							await locals.pb.collection('linktags').delete(linkTag.id);
						}

						// Update target tag usage count
						const tag = await locals.pb.collection('tags').getOne(tagId);
						await locals.pb.collection('tags').update(targetTagId, {
							usage_count: (targetTag.usage_count || 0) + (tag.usage_count || 0),
						});

						// Delete the merged tag
						await locals.pb.collection('tags').delete(tagId);
					}

					return { success: true, merged: tagIds.length - 1, targetTag: targetTag.name };
				} catch (err) {
					console.error('Failed to merge tags:', err);
					return fail(400, { error: 'Failed to merge tags' });
				}
			}

			default:
				return fail(400, { error: 'Invalid action' });
		}
	},
} satisfies Actions;
