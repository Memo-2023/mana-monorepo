import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

export interface EmailOptions {
	to: string;
	subject: string;
	html: string;
	text?: string;
	from?: string;
	replyTo?: string;
}

export interface EmailResult {
	success: boolean;
	messageId?: string;
	error?: string;
}

@Injectable()
export class EmailService {
	private readonly logger = new Logger(EmailService.name);
	private transporter: nodemailer.Transporter | null = null;
	private readonly defaultFrom: string;

	constructor(private readonly configService: ConfigService) {
		this.defaultFrom = this.configService.get<string>('smtp.from', 'ManaCore <noreply@mana.how>');
		this.initializeTransporter();
	}

	private initializeTransporter(): void {
		const host = this.configService.get<string>('smtp.host');
		const port = this.configService.get<number>('smtp.port', 587);
		const user = this.configService.get<string>('smtp.user');
		const pass = this.configService.get<string>('smtp.password');

		if (!user || !pass) {
			this.logger.warn('SMTP credentials not configured, emails will be logged only');
			return;
		}

		this.transporter = nodemailer.createTransport({
			host,
			port,
			secure: port === 465,
			auth: {
				user,
				pass,
			},
		});

		this.logger.log(`Email service initialized with SMTP host: ${host}`);
	}

	async sendEmail(options: EmailOptions): Promise<EmailResult> {
		const { to, subject, html, text, from, replyTo } = options;
		const sender = from || this.defaultFrom;

		this.logger.debug(`Sending email to: ${to}, subject: ${subject}`);

		if (!this.transporter) {
			this.logger.log('[Email] No SMTP configured, logging email content:');
			this.logger.log(`  To: ${to}`);
			this.logger.log(`  Subject: ${subject}`);
			this.logger.log(`  HTML: ${html.substring(0, 200)}...`);
			return { success: false, error: 'SMTP not configured' };
		}

		try {
			const result = await this.transporter.sendMail({
				from: sender,
				to,
				subject,
				html,
				text: text || this.stripHtml(html),
				replyTo,
			});

			this.logger.log(`Email sent successfully, messageId: ${result.messageId}`);
			return { success: true, messageId: result.messageId };
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Unknown error';
			this.logger.error(`Failed to send email: ${errorMessage}`);
			return { success: false, error: errorMessage };
		}
	}

	private stripHtml(html: string): string {
		return html.replace(/<[^>]*>/g, '');
	}

	isConfigured(): boolean {
		return this.transporter !== null;
	}
}
