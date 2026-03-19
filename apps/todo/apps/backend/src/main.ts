import './instrument';
import { bootstrapApp } from '@manacore/shared-nestjs-setup';
import { AppModule } from './app.module';

bootstrapApp(AppModule, {
	defaultPort: 3018,
	serviceName: 'Todo',
	additionalCorsOrigins: ['http://localhost:5186', 'http://localhost:5188'],
	swagger: true,
});
