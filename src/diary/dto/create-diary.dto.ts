import {
  IsNotEmpty,
  IsString,
  IsDate,
  IsOptional,
  IsArray,
  MaxLength,
  ArrayMaxSize,
  IsNumber,
  Min,
  Max,
} from 'class-validator';

export class CreateDiaryDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(65)
  title: string;

  @IsNotEmpty()
  @IsDate()
  date: Date;

  @IsOptional()
  @IsString()
  photo?: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(2000)
  content: string;

  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  @Max(5)
  coreEmotion: number;

  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(12)
  detailedEmotions: string[];
}
