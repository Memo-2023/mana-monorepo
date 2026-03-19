import { bootstrapApp } from '@manacore/shared-nestjs-setup';
import { AppModule } from './app.module';

bootstrapApp(AppModule, {
	defaultPort: 3020,
	serviceName: 'Context',
	additionalCorsOrigins: ['http://localhost:5192'],
});
