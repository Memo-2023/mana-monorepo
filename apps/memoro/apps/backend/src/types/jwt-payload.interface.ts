export interface JwtPayload {
	sub: string; // User ID
	email?: string; // User email (optional)
	role: string; // User role
	app_id: string; // App ID
	aud: string; // Audience (usually 'authenticated')
	iat?: number; // Issued at
	exp?: number; // Expiration time
}
