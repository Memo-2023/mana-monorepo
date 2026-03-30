import { json } from '@sveltejs/kit';

export function GET() {
	return json({
		status: 'ok',
		service: 'manavoxel-web',
		timestamp: new Date().toISOString(),
	});
}
