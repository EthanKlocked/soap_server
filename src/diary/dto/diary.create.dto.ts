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
	Max,
	ArrayUnique,
	Validate
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { validEmotionList, ValidEmotion } from '@src/diary/diary.interface';
import {
	ValidatorConstraint,
	ValidatorConstraintInterface,
	ValidationArguments
} from 'class-validator';

@ValidatorConstraint({ name: 'isValidEmotion', async: false })
export class IsValidEmotion implements ValidatorConstraintInterface {
	validate(emotion: string, args: ValidationArguments) {
		return validEmotionList.includes(emotion as ValidEmotion);
	}

	defaultMessage(args: ValidationArguments) {
		return `${args.value} is not a valid emotion`;
	}
}

export class DiaryCreateDto {
	@ApiProperty({ example: 'Diary of the special day', description: 'Diary title' })
	@IsNotEmpty()
	@IsString()
	@MaxLength(65)
	title: string;

	@ApiProperty({ example: '2023-05-20', description: 'Date of diary entry' })
	@IsNotEmpty()
	@IsDate()
	@Type(() => Date)
	date: Date;

	@ApiProperty({ example: 'Today was a really good day.', description: 'Diary text content' })
	@IsNotEmpty()
	@IsString()
	@MaxLength(2000)
	content: string;

	@ApiProperty({
		type: [String],
		required: false,
		description: 'Array of S3 image URLs (max 5 images)'
	})
	@IsOptional()
	@IsArray()
	@ArrayMaxSize(5)
	@IsString({ each: true })
	imageBox?: string[];

	@ApiProperty({ example: 4, description: 'Core emotion score (1-5)' })
	@IsNotEmpty()
	@IsNumber()
	@Min(1)
	@Max(5)
	@Transform(({ value }) => Number(value))
	coreEmotion: number;

	@ApiProperty({
		example: validEmotionList,
		description: 'List of detailed emotion keywords'
	})
	@Transform(({ value }) => {
		if (value === undefined || value === '') {
			return [];
		}
		if (Array.isArray(value)) {
			return value;
		}
		return [value];
	})
	@IsArray()
	@ArrayUnique()
	@ArrayMaxSize(12)
	@IsString({ each: true })
	@Validate(IsValidEmotion, { each: true })
	detailedEmotions: ValidEmotion[];

	@ApiProperty({ example: true, required: false, description: 'Public option' })
	@IsOptional()
	@IsBoolean()
	@Transform(({ value }) => {
		if (typeof value === 'string') return value.toLowerCase() === 'true';
		return Boolean(value);
	})
	isPublic?: boolean;
}
