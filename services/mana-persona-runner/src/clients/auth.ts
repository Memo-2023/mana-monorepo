/**
 * mana-auth HTTP client — just the two calls the runner needs to play
 * one tick: log in as the persona, list their spaces to pick a target.
 *
 * The service-to-service callbacks for action/feedback persistence live
 * in `./mana-auth-internal.ts`; they use a different auth mechanism
 * (service key) and shouldn't share code paths with the user-JWT login
 * flow here.
 */

export interface LoginResult {
	token: string;
	userId: string;
}

export interface Space {
	id: string;
	name: string;
	type?: 'personal' | 'brand' | 'club' | 'family' | 'team' | 'practice';
}

export class AuthClient {
	constructor(private readonly authUrl: string) {}

	async login(email: string, password: string): Promise<LoginResult> {
		const res = await fetch(`${this.authUrl}/api/v1/auth/login`, {
			method: 'POST',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify({ email, password }),
		});
		if (!res.ok) {
			const body = await res.text().catch(() => '<unreadable>');
			throw new Error(
				`Persona login failed for ${email}: HTTP ${res.status} — ${body.slice(0, 300)}`
			);
		}
		const body = (await res.json()) as {
			token?: string;
			user?: { id?: string };
		};
		if (!body.token || !body.user?.id) {
			throw new Error(`Persona login response missing token/user.id for ${email}`);
		}
		return { token: body.token, userId: body.user.id };
	}

	/**
	 * Lists every space the caller is a member of. Used by the runner
	 * to pick the persona's personal space as the write target — the
	 * first space with `type='personal'` wins.
	 */
	async listSpaces(jwt: string): Promise<Space[]> {
		const res = await fetch(`${this.authUrl}/api/auth/organization/list`, {
			headers: { authorization: `Bearer ${jwt}` },
		});
		if (!res.ok) {
			const body = await res.text().catch(() => '<unreadable>');
			throw new Error(`Space list failed: HTTP ${res.status} — ${body.slice(0, 300)}`);
		}
		const raw = (await res.json()) as Array<{
			id: string;
			name: string;
			metadata?: { type?: Space['type'] } | string | null;
		}>;
		return raw.map((row) => {
			let type: Space['type'] | undefined;
			if (typeof row.metadata === 'string') {
				try {
					type = (JSON.parse(row.metadata) as { type?: Space['type'] }).type;
				} catch {
					type = undefined;
				}
			} else if (row.metadata && typeof row.metadata === 'object') {
				type = row.metadata.type;
			}
			return { id: row.id, name: row.name, type };
		});
	}

	/**
	 * Convenience: login, fetch spaces, return the personal space.
	 * Throws if the persona has no personal space (shouldn't happen —
	 * Spaces-Foundation auto-creates one on signup, but we fail loud if
	 * it does).
	 */
	async loginAndResolvePersonalSpace(
		email: string,
		password: string
	): Promise<{ jwt: string; userId: string; spaceId: string }> {
		const { token, userId } = await this.login(email, password);
		const spaces = await this.listSpaces(token);
		const personal = spaces.find((s) => s.type === 'personal') ?? spaces[0];
		if (!personal) {
			throw new Error(`Persona ${email} has no spaces — signup flow did not auto-create one?`);
		}
		return { jwt: token, userId, spaceId: personal.id };
	}
}
