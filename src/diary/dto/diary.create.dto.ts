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
import { ApiProperty } from '@nestjs/swagger';

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
		example: [
			'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAMCAgMCA...',
			'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAACklEQVR4nGMAAQAABQABDQottAAAAABJRU5ErkJggg=='
		],
		required: false,
		description: '이미지 Base64 문자열 배열 (각 이미지 최대 5MB, 최대 5개)'
	})
	@IsOptional()
	@IsArray()
	@ArrayMaxSize(5)
	@IsString({ each: true })
	@MaxLength(5 * 1024 * 1024, { each: true })
	imageBox?: string[];

	@ApiProperty({ example: 4, description: '핵심 감정 점수 (1-5)' })
	@IsNotEmpty()
	@IsNumber()
	@Min(1)
	@Max(5)
	coreEmotion: number;

	@ApiProperty({ example: ['행복', '기쁨', '설렘'], description: '상세 감정 키워드 목록' })
	@IsArray()
	@IsString({ each: true })
	@ArrayMaxSize(12)
	detailedEmotions: string[];

	@ApiProperty({ example: true, required: false, description: '공개 여부' })
	@IsOptional()
	@IsBoolean()
	isPublic?: boolean;
}
