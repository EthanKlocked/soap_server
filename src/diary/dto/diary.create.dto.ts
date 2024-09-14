import {
	IsNotEmpty,
	IsString,
	IsDate,
	IsOptional,
	IsArray,
	MaxLength,
	ArrayMaxSize,
	IsNumber,
	IsBoolean,
	Min,
	Max
} from 'class-validator';
import { Type } from 'class-transformer';

export class DiaryCreateDto {
	@IsNotEmpty()
	@IsString()
	@MaxLength(65)
	title: string;

	@IsNotEmpty()
	@IsDate()
	@Type(() => Date)
	date: Date;

	@IsNotEmpty()
	@IsString()
	@MaxLength(2000)
	content: string;

	@IsOptional()
	@IsString()
	imgUrl?: string;

	@IsOptional()
	@IsString()
	imgUrl1?: string;

	@IsOptional()
	@IsString()
	imgUrl2?: string;

	@IsNotEmpty()
	@IsNumber()
	@Min(1)
	@Max(5)
	coreEmotion: number;

	@IsArray()
	@IsString({ each: true })
	@ArrayMaxSize(12)
	detailedEmotions: string[];

	@IsOptional()
	@IsBoolean()
	isPublic?: boolean;
}
