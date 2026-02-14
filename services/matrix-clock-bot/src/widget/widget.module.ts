import { Module } from '@nestjs/common';
import { WidgetController } from './widget.controller';
import { ClockModule } from '../clock/clock.module';
import { SessionModule } from '@manacore/bot-services';

/**
 * Widget Module
 *
 * Provides the timer widget for embedding in Matrix clients (Element).
 * The widget displays live timer status with controls.
 */
@Module({
	imports: [ClockModule, SessionModule.forRoot()],
	controllers: [WidgetController],
})
export class WidgetModule {}
