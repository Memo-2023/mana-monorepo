import { bootstrapApp } from '@manacore/shared-nestjs-setup';
import { AppModule } from './app.module';

bootstrapApp(AppModule, {
	defaultPort: 3026,
	serviceName: 'Traces',
	additionalCorsOrigins: ['http://localhost:5173', 'http://localhost:8081'],
});
