import { IsEnum } from 'class-validator';
import { ImageModelId } from '../../core/models/image-models';

export class UpdateImageModelDto {
  @IsEnum(['flux-schnell', 'flux-pro', 'sdxl'])
  model!: ImageModelId;
}
