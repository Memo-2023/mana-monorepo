import { bootstrapApp } from '@manacore/shared-nestjs-setup';
import { AppModule } from './app.module';

bootstrapApp(AppModule, {
	defaultPort: 3017,
	serviceName: 'Clock',
	additionalCorsOrigins: ['http://localhost:5186'],
});
