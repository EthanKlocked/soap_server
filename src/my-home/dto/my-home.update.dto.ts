import {
  IsString,
  IsEnum,
  IsNumber,
  Min,
  Max,
  IsOptional,
  IsMongoId,
  ValidateIf,
} from 'class-validator';
import { CategoryType } from '../schema/my-home.schema';

export class UpdateMyHomeDto {
  @IsOptional()
  @IsEnum(CategoryType)
  category?: CategoryType;

  @IsOptional()
  @IsString()
  review?: string;

  @IsOptional()
  @ValidateIf((o) => o.category === 'movie')
  @IsNumber()
  @Min(0)
  @Max(5)
  rating?: number;

  @IsOptional()
  @IsMongoId()
  userId?: string;
}
