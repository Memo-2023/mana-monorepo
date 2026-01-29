import { bootstrapApp } from '@manacore/shared-nestjs-setup';
import { AppModule } from './app.module';

bootstrapApp(AppModule, {
	defaultPort: 3022,
	serviceName: 'Planta',
	additionalCorsOrigins: ['http://localhost:5191'],
	excludeFromPrefix: [], // no exclusions
});
