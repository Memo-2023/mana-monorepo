import { bootstrapApp } from '@manacore/shared-nestjs-setup';
import { AppModule } from './app.module';

bootstrapApp(AppModule, {
	defaultPort: 3015,
	serviceName: 'Contacts',
	additionalCorsOrigins: ['http://localhost:5184'],
	swagger: true,
});
