/**
 * Magic-byte sniffer for image MIME types.
 *
 * Why this exists:
 *   Browsers don't all recognise the same set of image formats. Chrome
 *   on macOS, for example, hands a HEIC file to the upload endpoint
 *   with `file.type === ''`, which the server then stores as
 *   `application/octet-stream`. The transform endpoint subsequently
 *   refuses to touch the row because `mimeType.startsWith('image/')`
 *   is false — even though the bytes on disk are a perfectly valid
 *   image. Sniffing the buffer's magic bytes at upload time fixes
 *   this at the source.
 *
 * The sniffer reads only the first ~16 bytes — cheap, synchronous,
 * runs once per upload. Only image formats are detected; any other
 * file type returns null so the caller can fall back to whatever the
 * browser reported.
 */

const ASCII = (s: string): number[] => Array.from(s, (c) => c.charCodeAt(0));

function bytesEqual(buf: Buffer, offset: number, expected: number[]): boolean {
	if (offset + expected.length > buf.length) return false;
	for (let i = 0; i < expected.length; i++) {
		if (buf[offset + i] !== expected[i]) return false;
	}
	return true;
}

// HEIF/HEIC family — major brand at offset 8, after the 4-byte size +
// `ftyp` marker at offset 4. List from ISO/IEC 23008-12 + 14496-12.
// AVIF shares the same container with a different brand.
const HEIC_BRANDS = ['heic', 'heix', 'heim', 'heis', 'hevc', 'hevx', 'mif1', 'msf1'];
const AVIF_BRANDS = ['avif', 'avis'];

/**
 * Inspect the first bytes of `buf` and return a canonical image MIME
 * type if recognized, or null when nothing matches. Trustworthy
 * substitute for `file.type` when the browser left it empty or
 * defaulted it to `application/octet-stream`.
 */
export function sniffImageMimeType(buf: Buffer): string | null {
	// JPEG — FF D8 FF
	if (bytesEqual(buf, 0, [0xff, 0xd8, 0xff])) return 'image/jpeg';

	// PNG — 89 50 4E 47 0D 0A 1A 0A
	if (bytesEqual(buf, 0, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) {
		return 'image/png';
	}

	// GIF87a / GIF89a — 47 49 46 38 ...
	if (bytesEqual(buf, 0, ASCII('GIF8'))) return 'image/gif';

	// WebP — RIFF....WEBP at offset 8
	if (bytesEqual(buf, 0, ASCII('RIFF')) && bytesEqual(buf, 8, ASCII('WEBP'))) {
		return 'image/webp';
	}

	// BMP — 42 4D
	if (bytesEqual(buf, 0, [0x42, 0x4d])) return 'image/bmp';

	// TIFF — 49 49 2A 00 (LE) or 4D 4D 00 2A (BE)
	if (
		bytesEqual(buf, 0, [0x49, 0x49, 0x2a, 0x00]) ||
		bytesEqual(buf, 0, [0x4d, 0x4d, 0x00, 0x2a])
	) {
		return 'image/tiff';
	}

	// HEIC / HEIF / AVIF — `ftyp` at offset 4, brand at offset 8.
	if (bytesEqual(buf, 4, ASCII('ftyp'))) {
		const brand = buf.slice(8, 12).toString('ascii');
		if (HEIC_BRANDS.includes(brand)) return 'image/heic';
		if (AVIF_BRANDS.includes(brand)) return 'image/avif';
	}

	return null;
}
