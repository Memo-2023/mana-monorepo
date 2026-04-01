import { describe, it, expect, vi } from 'vitest';
import { app } from './index';

function formPost(path: string, formData: FormData) {
	return app.request(path, { method: 'POST', body: formData });
}

// ─── Health ────────────────────────────────────────────────────

describe('GET /health', () => {
	it('returns healthy status', async () => {
		const res = await app.request('/health');
		expect(res.status).toBe(200);
	});
});

// ─── vCard Import ──────────────────────────────────────────────

describe('POST /api/v1/import/vcard', () => {
	it('parses a single vCard', async () => {
		const vcard = [
			'BEGIN:VCARD',
			'VERSION:3.0',
			'FN:Max Mustermann',
			'EMAIL:max@example.com',
			'TEL:+49 170 1234567',
			'ORG:ACME Corp',
			'TITLE:Engineer',
			'END:VCARD',
		].join('\r\n');

		const form = new FormData();
		form.append('file', new File([vcard], 'contacts.vcf', { type: 'text/vcard' }));

		const res = await formPost('/api/v1/import/vcard', form);
		expect(res.status).toBe(200);

		const data = await res.json();
		expect(data.count).toBe(1);
		expect(data.contacts[0].name).toBe('Max Mustermann');
		expect(data.contacts[0].email).toBe('max@example.com');
		expect(data.contacts[0].phone).toBe('+49 170 1234567');
		expect(data.contacts[0].company).toBe('ACME Corp');
		expect(data.contacts[0].title).toBe('Engineer');
	});

	it('parses multiple vCards', async () => {
		const vcard = [
			'BEGIN:VCARD',
			'FN:Alice',
			'EMAIL:alice@example.com',
			'END:VCARD',
			'BEGIN:VCARD',
			'FN:Bob',
			'EMAIL:bob@example.com',
			'END:VCARD',
			'BEGIN:VCARD',
			'FN:Charlie',
			'TEL:+1 555 0123',
			'END:VCARD',
		].join('\n');

		const form = new FormData();
		form.append('file', new File([vcard], 'multi.vcf'));

		const res = await formPost('/api/v1/import/vcard', form);
		expect(res.status).toBe(200);

		const data = await res.json();
		expect(data.count).toBe(3);
		expect(data.contacts[0].name).toBe('Alice');
		expect(data.contacts[1].name).toBe('Bob');
		expect(data.contacts[2].name).toBe('Charlie');
	});

	it('handles vCard with EMAIL type parameters', async () => {
		const vcard = [
			'BEGIN:VCARD',
			'FN:Test User',
			'EMAIL;type=INTERNET;type=WORK:work@example.com',
			'TEL;type=CELL:+49 170 0000000',
			'END:VCARD',
		].join('\r\n');

		const form = new FormData();
		form.append('file', new File([vcard], 'typed.vcf'));

		const res = await formPost('/api/v1/import/vcard', form);
		expect(res.status).toBe(200);

		const data = await res.json();
		expect(data.count).toBe(1);
		// EMAIL;type=...:work@example.com → split(':').pop() → 'work@example.com'
		expect(data.contacts[0].email).toBe('work@example.com');
		expect(data.contacts[0].phone).toBe('+49 170 0000000');
	});

	it('skips contacts without name or email', async () => {
		const vcard = [
			'BEGIN:VCARD',
			'TEL:+49 170 0000000',
			'ORG:Company Only',
			'END:VCARD',
			'BEGIN:VCARD',
			'FN:Valid Contact',
			'END:VCARD',
		].join('\n');

		const form = new FormData();
		form.append('file', new File([vcard], 'partial.vcf'));

		const res = await formPost('/api/v1/import/vcard', form);
		expect(res.status).toBe(200);

		const data = await res.json();
		expect(data.count).toBe(1);
		expect(data.contacts[0].name).toBe('Valid Contact');
	});

	it('includes contact with only email (no name)', async () => {
		const vcard = ['BEGIN:VCARD', 'EMAIL:noreply@example.com', 'END:VCARD'].join('\n');

		const form = new FormData();
		form.append('file', new File([vcard], 'email-only.vcf'));

		const res = await formPost('/api/v1/import/vcard', form);
		expect(res.status).toBe(200);

		const data = await res.json();
		expect(data.count).toBe(1);
		expect(data.contacts[0].email).toBe('noreply@example.com');
	});

	it('returns empty array for empty vCard file', async () => {
		const form = new FormData();
		form.append('file', new File([''], 'empty.vcf'));

		const res = await formPost('/api/v1/import/vcard', form);
		expect(res.status).toBe(200);

		const data = await res.json();
		expect(data.count).toBe(0);
		expect(data.contacts).toEqual([]);
	});

	it('returns 400 if no file provided', async () => {
		const form = new FormData();
		const res = await formPost('/api/v1/import/vcard', form);
		expect(res.status).toBe(400);

		const data = await res.json();
		expect(data.error).toBe('No file');
	});
});

// ─── Avatar Upload ─────────────────────────────────────────────

describe('POST /api/v1/contacts/:id/avatar', () => {
	it('returns 400 if no file provided', async () => {
		const form = new FormData();
		const res = await formPost('/api/v1/contacts/contact-1/avatar', form);
		expect(res.status).toBe(400);

		const data = await res.json();
		expect(data.error).toBe('No file');
	});

	it('returns 400 if file exceeds 5MB', async () => {
		// Create a file > 5MB
		const bigContent = new Uint8Array(6 * 1024 * 1024);
		const form = new FormData();
		form.append('file', new File([bigContent], 'big.jpg', { type: 'image/jpeg' }));

		const res = await formPost('/api/v1/contacts/contact-1/avatar', form);
		expect(res.status).toBe(400);

		const data = await res.json();
		expect(data.error).toBe('Max 5MB');
	});

	it('returns 400 for invalid file type', async () => {
		const form = new FormData();
		form.append('file', new File(['data'], 'doc.pdf', { type: 'application/pdf' }));

		const res = await formPost('/api/v1/contacts/contact-1/avatar', form);
		expect(res.status).toBe(400);

		const data = await res.json();
		expect(data.error).toContain('Invalid file type');
	});

	it('accepts JPEG files', async () => {
		vi.mock('@manacore/shared-storage', () => ({
			createContactsStorage: () => ({
				upload: vi.fn().mockResolvedValue({ url: 'https://s3.example.com/avatar.jpg' }),
			}),
			generateUserFileKey: vi.fn().mockReturnValue('users/test/avatar.jpg'),
			getContentType: vi.fn().mockReturnValue('image/jpeg'),
		}));

		const form = new FormData();
		form.append('file', new File(['image-data'], 'photo.jpg', { type: 'image/jpeg' }));

		const res = await formPost('/api/v1/contacts/contact-1/avatar', form);
		expect(res.status).toBe(201);

		const data = await res.json();
		expect(data.avatarUrl).toBeDefined();
	});

	it('accepts PNG files', async () => {
		vi.mock('@manacore/shared-storage', () => ({
			createContactsStorage: () => ({
				upload: vi.fn().mockResolvedValue({ url: 'https://s3.example.com/avatar.png' }),
			}),
			generateUserFileKey: vi.fn().mockReturnValue('users/test/avatar.png'),
			getContentType: vi.fn().mockReturnValue('image/png'),
		}));

		const form = new FormData();
		form.append('file', new File(['image-data'], 'photo.png', { type: 'image/png' }));

		const res = await formPost('/api/v1/contacts/contact-1/avatar', form);
		expect(res.status).toBe(201);
	});

	it('accepts WebP files', async () => {
		vi.mock('@manacore/shared-storage', () => ({
			createContactsStorage: () => ({
				upload: vi.fn().mockResolvedValue({ url: 'https://s3.example.com/avatar.webp' }),
			}),
			generateUserFileKey: vi.fn().mockReturnValue('users/test/avatar.webp'),
			getContentType: vi.fn().mockReturnValue('image/webp'),
		}));

		const form = new FormData();
		form.append('file', new File(['image-data'], 'photo.webp', { type: 'image/webp' }));

		const res = await formPost('/api/v1/contacts/contact-1/avatar', form);
		expect(res.status).toBe(201);
	});
});
