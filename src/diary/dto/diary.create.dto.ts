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
import { Type, Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { validEmotionList } from '@src/diary/diary.interface';

export class DiaryCreateDto {
	@ApiProperty({ example: '오늘의 일기', description: '일기 제목' })
	@IsNotEmpty()
	@IsString()
	@MaxLength(65)
	title: string;

	@ApiProperty({ example: '2023-05-20', description: '일기 작성 날짜' })
	@IsNotEmpty()
	@IsDate()
	@Type(() => Date)
	date: Date;

	@ApiProperty({ example: '오늘은 정말 좋은 날이었다.', description: '일기 내용' })
	@IsNotEmpty()
	@IsString()
	@MaxLength(2000)
	content: string;

	@ApiProperty({
		type: 'array',
		items: { type: 'string', format: 'binary' },
		required: false,
		description: '이미지 파일 배열 (각 이미지 최대 5MB, 최대 5개)'
	})
	@IsOptional()
	@ArrayMaxSize(5)
	//imageBox?: Express.Multer.File[];
	imageBox?: any[];

	@ApiProperty({ example: 4, description: '핵심 감정 점수 (1-5)' })
	@IsNotEmpty()
	@IsNumber()
	@Min(1)
	@Max(5)
	@Transform(({ value }) => Number(value))
	coreEmotion: number;

	@ApiProperty({
		example: validEmotionList,
		description: '상세 감정 키워드 목록'
	})
	@IsArray()
	@IsString({ each: true })
	@ArrayMaxSize(12)
	detailedEmotions: string[];

	@ApiProperty({ example: true, required: false, description: '공개 여부' })
	@IsOptional()
	@IsBoolean()
	isPublic?: boolean;
}
