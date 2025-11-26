import { Global, Module } from '@nestjs/common';
import { ClsModule } from 'nestjs-cls';
import { RequestContextService } from './services/request-context.service';

@Global()
@Module({
  imports: [ClsModule],
  providers: [RequestContextService],
  exports: [RequestContextService],
})
export class CommonModule {}
