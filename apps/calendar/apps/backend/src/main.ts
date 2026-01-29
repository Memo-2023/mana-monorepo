import { bootstrapApp } from '@manacore/shared-nestjs-setup';
import { AppModule } from './app.module';

bootstrapApp(AppModule, {
	defaultPort: 3014,
	serviceName: 'Calendar',
	additionalCorsOrigins: ['http://localhost:5179'],
});
