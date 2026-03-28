export interface MatrixMediaInfo {
	buffer: Buffer;
	mimeType: string;
	size: number;
	filename?: string;
}

export class MatrixService {
	private readonly homeserverUrl: string;

	constructor() {
		this.homeserverUrl = process.env.MATRIX_HOMESERVER_URL || 'https://matrix.mana.how';
	}

	parseMxcUrl(mxcUrl: string): { server: string; mediaId: string } | null {
		const match = mxcUrl.match(/^mxc:\/\/([^/]+)\/(.+)$/);
		if (!match) return null;
		return { server: match[1], mediaId: match[2] };
	}

	getDownloadUrl(mxcUrl: string): string | null {
		const parsed = this.parseMxcUrl(mxcUrl);
		if (!parsed) return null;
		return `${this.homeserverUrl}/_matrix/media/v3/download/${parsed.server}/${parsed.mediaId}`;
	}

	async downloadFromMxc(mxcUrl: string): Promise<MatrixMediaInfo | null> {
		const downloadUrl = this.getDownloadUrl(mxcUrl);
		if (!downloadUrl) {
			console.error(`Invalid MXC URL: ${mxcUrl}`);
			return null;
		}

		try {
			const response = await fetch(downloadUrl);
			if (!response.ok) {
				console.error(`Failed to download from Matrix: ${response.status} ${response.statusText}`);
				return null;
			}

			const contentType = response.headers.get('content-type') || 'application/octet-stream';
			const contentDisposition = response.headers.get('content-disposition');

			let filename: string | undefined;
			if (contentDisposition) {
				const match = contentDisposition.match(
					/filename[*]?=['"]?(?:UTF-\d['"]*)?([^;\r\n"']*)['"]?/i
				);
				if (match) filename = decodeURIComponent(match[1]);
			}

			const arrayBuffer = await response.arrayBuffer();
			const buffer = Buffer.from(arrayBuffer);

			return { buffer, mimeType: contentType, size: buffer.length, filename };
		} catch (error) {
			console.error(`Error downloading from Matrix: ${error}`);
			return null;
		}
	}
}
