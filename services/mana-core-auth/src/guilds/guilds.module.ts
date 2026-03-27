import { Module, forwardRef } from '@nestjs/common';
import { GuildsController } from './guilds.controller';
import { GuildsService } from './guilds.service';
import { AuthModule } from '../auth/auth.module';
import { CreditsModule } from '../credits/credits.module';

@Module({
	imports: [forwardRef(() => AuthModule), forwardRef(() => CreditsModule)],
	controllers: [GuildsController],
	providers: [GuildsService],
	exports: [GuildsService],
})
export class GuildsModule {}
