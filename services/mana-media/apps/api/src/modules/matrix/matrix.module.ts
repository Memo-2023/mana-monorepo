import { Module } from '@nestjs/common';
import { MatrixService } from './matrix.service';

@Module({
	providers: [MatrixService],
	exports: [MatrixService],
})
export class MatrixModule {}
