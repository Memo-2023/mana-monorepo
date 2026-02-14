import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface EntityCount {
	entity: string;
	count: number;
	label: string;
}

interface ProjectDataSummary {
	projectId: string;
	projectName: string;
	icon: string;
	available: boolean;
	error?: string;
	entities: EntityCount[];
	totalCount: number;
	lastActivityAt?: string;
}

interface UserDataSummary {
	user: {
		id: string;
		email: string;
		name: string;
		role: string;
		createdAt: string;
		emailVerified: boolean;
	};
	auth: {
		sessionsCount: number;
		accountsCount: number;
		has2FA: boolean;
		lastLoginAt: string | null;
	};
	credits: {
		balance: number;
		totalEarned: number;
		totalSpent: number;
		transactionsCount: number;
	};
	projects: ProjectDataSummary[];
	totals: {
		totalEntities: number;
		projectsWithData: number;
	};
}

@Injectable()
export class MyDataService {
	private readonly logger = new Logger(MyDataService.name);
	private readonly authUrl: string;

	constructor(private configService: ConfigService) {
		this.authUrl = this.configService.get<string>('MANA_CORE_AUTH_URL') || 'http://localhost:3001';
	}

	async getUserData(token: string): Promise<UserDataSummary | null> {
		try {
			const response = await fetch(`${this.authUrl}/api/v1/me/data`, {
				headers: {
					Authorization: `Bearer ${token}`,
					'Content-Type': 'application/json',
				},
			});

			if (!response.ok) {
				this.logger.error(`Failed to fetch user data: ${response.status}`);
				return null;
			}

			return (await response.json()) as UserDataSummary;
		} catch (error) {
			this.logger.error(`Error fetching user data: ${error}`);
			return null;
		}
	}

	formatUserStats(data: UserDataSummary): string {
		const formatDate = (dateStr: string): string => {
			const date = new Date(dateStr);
			return date.toLocaleDateString('de-DE', {
				day: 'numeric',
				month: 'long',
				year: 'numeric',
			});
		};

		const formatNumber = (num: number): string => {
			return num.toLocaleString('de-DE');
		};

		let report = '**📊 Deine ManaCore Stats**\n\n';

		// Account info
		report += '**👤 Account**\n';
		report += `- Email: ${data.user.email}\n`;
		report += `- Name: ${data.user.name || 'Nicht angegeben'}\n`;
		report += `- Mitglied seit: ${formatDate(data.user.createdAt)}\n`;
		report += `- Email verifiziert: ${data.user.emailVerified ? '✅' : '❌'}\n`;
		if (data.auth.has2FA) {
			report += `- 2FA: ✅ Aktiv\n`;
		}
		report += '\n';

		// Credits
		report += '**⚡ Credits**\n';
		report += `- Guthaben: ${data.credits.balance.toFixed(2)}\n`;
		report += `- Verdient: ${data.credits.totalEarned.toFixed(2)}\n`;
		report += `- Ausgegeben: ${data.credits.totalSpent.toFixed(2)}\n`;
		report += `- Transaktionen: ${formatNumber(data.credits.transactionsCount)}\n`;
		report += '\n';

		// Projects with data
		const projectsWithData = data.projects.filter((p) => p.available && p.totalCount > 0);

		if (projectsWithData.length > 0) {
			report += '**📱 Deine Nutzung**\n';

			for (const project of projectsWithData) {
				const entitySummary = project.entities
					.filter((e) => e.count > 0)
					.map((e) => `${formatNumber(e.count)} ${e.label}`)
					.join(', ');

				report += `${project.icon} **${project.projectName}:** ${entitySummary}\n`;
			}
			report += '\n';
		}

		// Summary
		report += '**📈 Gesamt**\n';
		report += `- Datenpunkte: ${formatNumber(data.totals.totalEntities)}\n`;
		report += `- Aktive Apps: ${data.totals.projectsWithData}/${data.projects.length}\n`;

		// Last activity
		const lastActivities = projectsWithData
			.filter((p) => p.lastActivityAt)
			.map((p) => ({ name: p.projectName, date: new Date(p.lastActivityAt!) }))
			.sort((a, b) => b.date.getTime() - a.date.getTime());

		if (lastActivities.length > 0) {
			const latest = lastActivities[0];
			report += `- Letzte Aktivität: ${latest.name} (${formatDate(latest.date.toISOString())})`;
		}

		return report;
	}

	formatNotLoggedIn(): string {
		return `**❌ Nicht angemeldet**

Um deine persönlichen Stats zu sehen, melde dich an:

\`!login deine@email.de deinpasswort\`

Nach der Anmeldung kannst du mit \`!mystats\` deine Daten abrufen.`;
	}

	formatError(): string {
		return `**❌ Fehler beim Laden**

Deine Stats konnten nicht abgerufen werden. Bitte versuche es später erneut.

Falls das Problem weiterhin besteht, melde dich neu an:
\`!logout\` und dann \`!login\``;
	}
}
