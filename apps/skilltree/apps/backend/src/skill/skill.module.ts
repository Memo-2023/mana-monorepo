import { Module } from '@nestjs/common';
import { SkillController } from './skill.controller';
import { SkillService } from './skill.service';
import { AchievementModule } from '../achievement/achievement.module';

@Module({
	imports: [AchievementModule],
	controllers: [SkillController],
	providers: [SkillService],
	exports: [SkillService],
})
export class SkillModule {}
