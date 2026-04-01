export const QR_API = 'https://api.qrserver.com/v1/create-qr-code';

export function generateShortCode(length = 6): string {
	const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
	let code = '';
	for (let i = 0; i < length; i++) {
		code += chars[Math.floor(Math.random() * chars.length)];
	}
	return code;
}

export function getQrCodeUrl(shortUrl: string, size = 400): string {
	return `${QR_API}/?size=${size}x${size}&data=${encodeURIComponent(shortUrl)}`;
}

export function getShortUrl(shortCode: string, baseUrl?: string): string {
	const base =
		baseUrl || (typeof window !== 'undefined' ? window.location.origin : 'https://ulo.ad');
	return `${base}/${shortCode}`;
}

export function downloadQrCode(shortCode: string, baseUrl?: string): void {
	const shortUrl = getShortUrl(shortCode, baseUrl);
	const url = getQrCodeUrl(shortUrl, 400);
	const a = document.createElement('a');
	a.href = url;
	a.download = `qr-${shortCode}.png`;
	a.click();
}
