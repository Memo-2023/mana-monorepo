export { EmailModule } from './email.module';
export { EmailService } from './email.service';
export type {
	SendEmailOptions,
	PasswordResetEmailOptions,
	OrganizationInviteEmailOptions,
} from './email.service';

// Standalone email client for use outside NestJS DI (e.g., Better Auth config)
export { sendEmail, sendPasswordResetEmail, sendOrganizationInviteEmail } from './brevo-client';
