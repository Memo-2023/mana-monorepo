import type { User, Tag, Folder, Link, Click } from '$lib/pocketbase';

let idCounter = 0;

function generateId(): string {
	return `test_${Date.now()}_${++idCounter}`;
}

export function createTestUser(overrides: Partial<User> = {}): User {
	return {
		id: generateId(),
		email: 'test@example.com',
		username: 'testuser',
		name: 'Test User',
		avatar: '',
		bio: 'Test bio',
		location: 'Test Location',
		website: 'https://example.com',
		github: 'testuser',
		twitter: 'testuser',
		linkedin: 'testuser',
		instagram: 'testuser',
		publicProfile: true,
		showClickStats: true,
		created: new Date().toISOString(),
		updated: new Date().toISOString(),
		...overrides
	};
}

export function createTestTag(overrides: Partial<Tag> = {}): Tag {
	return {
		id: generateId(),
		user_id: 'test_user_123',
		name: 'Test Tag',
		slug: 'test-tag',
		color: '#3B82F6',
		icon: '🏷️',
		is_public: false,
		usage_count: 0,
		created: new Date().toISOString(),
		updated: new Date().toISOString(),
		...overrides
	};
}

export function createTestFolder(overrides: Partial<Folder> = {}): Folder {
	return {
		id: generateId(),
		user_id: 'test_user_123',
		name: 'test-folder',
		display_name: 'Test Folder',
		description: 'Test folder description',
		icon: '📁',
		color: '#3B82F6',
		is_public: true,
		order: 0,
		created: new Date().toISOString(),
		updated: new Date().toISOString(),
		...overrides
	};
}

export function createTestLink(overrides: Partial<Link> = {}): Link {
	return {
		id: generateId(),
		user_id: 'test_user_123',
		original_url: 'https://example.com',
		short_code: 'abc123',
		title: 'Test Link',
		description: 'Test link description',
		is_active: true,
		expires_at: undefined,
		password: undefined,
		max_clicks: undefined,
		use_username: false,
		folder_id: undefined,
		created: new Date().toISOString(),
		updated: new Date().toISOString(),
		...overrides
	};
}

export function createTestClick(overrides: Partial<Click> = {}): Click {
	return {
		id: generateId(),
		link_id: 'test_link_123',
		ip_address: '127.0.0.1',
		user_agent: 'Mozilla/5.0 Test Browser',
		referer: 'https://google.com',
		country: 'US',
		device_type: 'desktop',
		browser: 'Chrome',
		clicked_at: new Date().toISOString(),
		created: new Date().toISOString(),
		...overrides
	};
}

export function createBatchTestTags(count: number, userId: string): Tag[] {
	const tags: Tag[] = [];
	const colors = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6'];
	const icons = ['🏷️', '📌', '⭐', '💡', '🔥'];

	for (let i = 0; i < count; i++) {
		tags.push(
			createTestTag({
				name: `Tag ${i + 1}`,
				slug: `tag-${i + 1}`,
				user_id: userId,
				color: colors[i % colors.length],
				icon: icons[i % icons.length],
				usage_count: Math.floor(Math.random() * 10)
			})
		);
	}

	return tags;
}

export function createBatchTestFolders(count: number, userId: string): Folder[] {
	const folders: Folder[] = [];
	const colors = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6'];
	const icons = ['📁', '📂', '🗂️', '📚', '💼'];

	for (let i = 0; i < count; i++) {
		folders.push(
			createTestFolder({
				name: `folder-${i + 1}`,
				display_name: `Folder ${i + 1}`,
				user_id: userId,
				color: colors[i % colors.length],
				icon: icons[i % icons.length],
				order: i
			})
		);
	}

	return folders;
}

export function createAuthError(message: string = 'Invalid credentials') {
	return {
		response: {
			data: {
				message,
				code: 401
			}
		}
	};
}

export function createValidationError(field: string, message: string) {
	return {
		response: {
			data: {
				data: {
					[field]: {
						message
					}
				}
			}
		}
	};
}
