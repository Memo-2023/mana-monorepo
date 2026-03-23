import './instrument';
import { bootstrapApp } from '@manacore/shared-nestjs-setup';
import { AppModule } from './app.module';

bootstrapApp(AppModule, {
	defaultPort: 3025,
	serviceName: 'CityCorners',
	additionalCorsOrigins: ['http://localhost:5196'],
});
