import { IsString, IsOptional, IsBase64 } from 'class-validator';

export class AnalyzeMealImageDto {
  @IsString()
  imageBase64: string;
}

export class AnalyzeMealTextDto {
  @IsString()
  description: string;
}

export class CreateMealDto {
  @IsString()
  foodName: string;

  @IsOptional()
  @IsString()
  imageUrl?: string;

  calories: number;
  protein: number;
  carbohydrates: number;
  fat: number;
  fiber: number;
  sugar: number;
  sodium: number;

  @IsString()
  servingSize: string;

  @IsOptional()
  @IsString()
  mealType?: 'breakfast' | 'lunch' | 'dinner' | 'snack';

  @IsOptional()
  @IsString()
  notes?: string;
}

export class UploadMealDto {
  @IsString()
  imageBase64: string;

  @IsOptional()
  @IsString()
  mealType?: 'breakfast' | 'lunch' | 'dinner' | 'snack';
}

export class UpdateMealDto {
  @IsOptional()
  @IsString()
  foodName?: string;

  @IsOptional()
  calories?: number;

  @IsOptional()
  protein?: number;

  @IsOptional()
  carbohydrates?: number;

  @IsOptional()
  fat?: number;

  @IsOptional()
  fiber?: number;

  @IsOptional()
  sugar?: number;

  @IsOptional()
  sodium?: number;

  @IsOptional()
  @IsString()
  servingSize?: string;

  @IsOptional()
  @IsString()
  mealType?: 'breakfast' | 'lunch' | 'dinner' | 'snack';

  @IsOptional()
  @IsString()
  notes?: string;
}
