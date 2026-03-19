import './instrument';
import { bootstrapApp } from '@manacore/shared-nestjs-setup';
import { AppModule } from './app.module';

bootstrapApp(AppModule, {
	defaultPort: 3002,
	serviceName: 'Chat',
	additionalCorsOrigins: ['http://localhost:5174', 'http://localhost:5178'],
});
