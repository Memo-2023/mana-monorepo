import { bootstrapApp } from '@manacore/shared-nestjs-setup';
import { AppModule } from './app.module';

bootstrapApp(AppModule, {
	defaultPort: 3010,
	serviceName: 'LightWrite',
	additionalCorsOrigins: ['http://localhost:5180'],
});
