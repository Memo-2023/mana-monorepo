import { bootstrapApp } from '@manacore/shared-nestjs-setup';
import { AppModule } from './app.module';

bootstrapApp(AppModule, {
	defaultPort: 3025,
	serviceName: 'Figgos',
	additionalCorsOrigins: ['http://localhost:5196'],
});
