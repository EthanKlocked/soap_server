import {
  IsString,
  IsEnum,
  IsNumber,
  Min,
  Max,
  IsMongoId,
  ValidateIf,
} from 'class-validator';
import { CategoryType } from '../schema/my-home.schema';

export class CreateMyHomeDto {
  @IsEnum(CategoryType)
  category: CategoryType;

  @IsString()
  review: string;

  @ValidateIf((o) => o.category === 'movie')
  @IsNumber()
  @Min(0)
  @Max(5)
  rating: number;

  @IsMongoId()
  userId: string;
}
