export interface JwtPayload {
	sub: string; // User ID
	email: string;
	role: string;
	app_id: string;
	device?: {
		id: string;
		name?: string;
		type?: string;
	};
	iat: number;
	exp: number;
}
