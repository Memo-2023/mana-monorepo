import './instrument';
import { bootstrapApp } from '@manacore/shared-nestjs-setup';
import { AppModule } from './app.module';

bootstrapApp(AppModule, {
	defaultPort: 3007,
	serviceName: 'Quote',
	additionalCorsOrigins: ['http://localhost:5177'],
});
