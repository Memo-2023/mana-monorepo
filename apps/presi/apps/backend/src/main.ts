import { bootstrapApp } from '@manacore/shared-nestjs-setup';
import { AppModule } from './app.module';

bootstrapApp(AppModule, {
	defaultPort: 3008,
	serviceName: 'Presi',
	additionalCorsOrigins: ['http://localhost:5177', 'http://localhost:5178'],
	excludeFromPrefix: [], // no exclusions
});
