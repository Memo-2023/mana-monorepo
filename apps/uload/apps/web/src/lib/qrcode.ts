export type QRCodeColor = 'black' | 'white' | 'gold';
export type QRCodeFormat = 'png' | 'svg' | 'jpg';
export type QRCodeRotation = 0 | 45 | 90 | 135 | 180 | 225 | 270 | 315;

export const QR_COLORS = {
	black: { color: '000000', bg: 'ffffff' },
	white: { color: 'ffffff', bg: '000000' },
	gold: { color: 'f8d62b', bg: '000000' }
};

export function generateQRCodeURL(
	text: string,
	size: number = 200,
	color: QRCodeColor = 'black',
	format: QRCodeFormat = 'png'
): string {
	const encodedText = encodeURIComponent(text);
	const colorConfig = QR_COLORS[color];
	return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodedText}&color=${colorConfig.color}&bgcolor=${colorConfig.bg}&format=${format}`;
}

export function generateQRCodeSVG(
	text: string,
	size: number = 200,
	color: QRCodeColor = 'black'
): string {
	return generateQRCodeURL(text, size, color, 'svg');
}

export function generateQRCodeDataURL(
	text: string,
	size: number = 200,
	color: QRCodeColor = 'black'
): string {
	return generateQRCodeURL(text, size, color, 'png');
}

export function createQRCodeElement(
	text: string,
	size: number = 200,
	color: QRCodeColor = 'black'
): HTMLImageElement {
	const img = new Image();
	img.src = generateQRCodeURL(text, size, color, 'png');
	img.width = size;
	img.height = size;
	img.alt = 'QR Code';
	return img;
}

export async function downloadQRCode(
	text: string,
	filename: string = 'qrcode',
	size: number = 400,
	color: QRCodeColor = 'black',
	format: QRCodeFormat = 'png',
	rotation: QRCodeRotation = 0
) {
	const url = generateQRCodeURL(text, size, color, format);
	const fullFilename = `${filename}.${format}`;

	if (format === 'svg') {
		// Handle SVG with or without rotation
		fetch(url)
			.then((response) => response.text())
			.then((svgText) => {
				let finalSvg = svgText;
				
				if (rotation !== 0) {
					// Apply rotation transform to SVG
					const parser = new DOMParser();
					const doc = parser.parseFromString(svgText, 'image/svg+xml');
					const svgElement = doc.documentElement;
					
					// Get original dimensions
					const width = parseInt(svgElement.getAttribute('width') || `${size}`);
					const height = parseInt(svgElement.getAttribute('height') || `${size}`);
					
					// Calculate new dimensions for rotated SVG
					const radians = (rotation * Math.PI) / 180;
					const sin = Math.abs(Math.sin(radians));
					const cos = Math.abs(Math.cos(radians));
					const newWidth = Math.round(width * cos + height * sin);
					const newHeight = Math.round(width * sin + height * cos);
					
					// Update SVG dimensions
					svgElement.setAttribute('width', `${newWidth}`);
					svgElement.setAttribute('height', `${newHeight}`);
					
					// Add a group with rotation transform
					const g = doc.createElementNS('http://www.w3.org/2000/svg', 'g');
					g.setAttribute('transform', `translate(${newWidth/2},${newHeight/2}) rotate(${rotation}) translate(${-width/2},${-height/2})`);
					
					// Move all existing children into the group
					while (svgElement.firstChild) {
						g.appendChild(svgElement.firstChild);
					}
					svgElement.appendChild(g);
					
					// Serialize back to string
					const serializer = new XMLSerializer();
					finalSvg = serializer.serializeToString(doc);
				}
				
				const blob = new Blob([finalSvg], { type: 'image/svg+xml' });
				const objectUrl = URL.createObjectURL(blob);
				const a = document.createElement('a');
				a.href = objectUrl;
				a.download = fullFilename;
				document.body.appendChild(a);
				a.click();
				document.body.removeChild(a);
				URL.revokeObjectURL(objectUrl);
			});
	} else if (rotation === 0) {
		// No rotation needed for PNG/JPG
		fetch(url)
			.then((response) => response.blob())
			.then((blob) => {
				const a = document.createElement('a');
				const objectUrl = URL.createObjectURL(blob);
				a.href = objectUrl;
				a.download = fullFilename;
				document.body.appendChild(a);
				a.click();
				document.body.removeChild(a);
				URL.revokeObjectURL(objectUrl);
			});
	} else {
		// Apply rotation using canvas for PNG/JPG
		const img = new Image();
		img.crossOrigin = 'anonymous';
		img.src = url;

		img.onload = () => {
			const canvas = document.createElement('canvas');
			const ctx = canvas.getContext('2d');
			if (!ctx) return;

			// Calculate new dimensions for rotated image
			const radians = (rotation * Math.PI) / 180;
			const sin = Math.abs(Math.sin(radians));
			const cos = Math.abs(Math.cos(radians));

			const newWidth = Math.round(img.width * cos + img.height * sin);
			const newHeight = Math.round(img.width * sin + img.height * cos);

			canvas.width = newWidth;
			canvas.height = newHeight;

			// Apply rotation
			ctx.translate(newWidth / 2, newHeight / 2);
			ctx.rotate(radians);
			ctx.drawImage(img, -img.width / 2, -img.height / 2);

			// Convert and download
			const mimeType = format === 'jpg' ? 'image/jpeg' : 'image/png';
			canvas.toBlob((blob) => {
				if (blob) {
					const a = document.createElement('a');
					const objectUrl = URL.createObjectURL(blob);
					a.href = objectUrl;
					a.download = fullFilename;
					document.body.appendChild(a);
					a.click();
					document.body.removeChild(a);
					URL.revokeObjectURL(objectUrl);
				}
			}, mimeType);
		};
	}
}
