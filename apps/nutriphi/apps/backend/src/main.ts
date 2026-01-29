import { bootstrapApp } from '@manacore/shared-nestjs-setup';
import { AppModule } from './app.module';

bootstrapApp(AppModule, {
	defaultPort: 3023,
	serviceName: 'NutriPhi',
	additionalCorsOrigins: ['http://localhost:5180', 'http://localhost:4323'],
	excludeFromPrefix: [], // no exclusions
});
