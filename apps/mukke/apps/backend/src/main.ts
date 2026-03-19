import { bootstrapApp } from '@manacore/shared-nestjs-setup';
import { AppModule } from './app.module';

bootstrapApp(AppModule, {
	defaultPort: 3010,
	serviceName: 'Mukke',
	additionalCorsOrigins: ['http://localhost:5180'],
});
