import { IsString, IsEnum, IsObject, IsMongoId, ValidateNested, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, getSchemaPath, ApiExtraModels } from '@nestjs/swagger';
import { CategoryType, ContentType } from '../schema/my-home.schema';
import {
	MovieContentDto,
	MusicContentDto,
	YoutubeContentDto,
	BookContentDto
} from './my-home.content.dto';

// 중요: ApiExtraModels 데코레이터로 모든 DTO 등록
@ApiExtraModels(MovieContentDto, MusicContentDto, YoutubeContentDto, BookContentDto)
export class CreateMyHomeDto {
	@ApiProperty({
		enum: CategoryType,
		example: CategoryType.MOVIE,
		description: '컨텐츠의 카테고리 타입'
	})
	@IsEnum(CategoryType)
	category: CategoryType;

	@ApiProperty({
		example: '정말 재미있는 영화였습니다. 강력 추천합니다!',
		description: '사용자의 리뷰 내용',
		required: false
	})
	@IsOptional()
	@IsString()
	review?: string;

	@ApiProperty({
		description: '컨텐츠의 상세 정보. 카테고리에 따라 다른 구조를 가집니다.',
		discriminator: {
			propertyName: 'category',
			mapping: {
				[CategoryType.MOVIE]: 'MovieContentDto',
				[CategoryType.MUSIC]: 'MusicContentDto',
				[CategoryType.YOUTUBE]: 'YoutubeContentDto',
				[CategoryType.BOOK]: 'BookContentDto'
			}
		},
		oneOf: [
			{ $ref: getSchemaPath(MovieContentDto) },
			{ $ref: getSchemaPath(MusicContentDto) },
			{ $ref: getSchemaPath(YoutubeContentDto) },
			{ $ref: getSchemaPath(BookContentDto) }
		]
	})
	@IsObject()
	@ValidateNested()
	@Type(() => Object, {
		discriminator: {
			property: 'category',
			subTypes: [
				{ value: MovieContentDto, name: CategoryType.MOVIE },
				{ value: MusicContentDto, name: CategoryType.MUSIC },
				{ value: YoutubeContentDto, name: CategoryType.YOUTUBE },
				{ value: BookContentDto, name: CategoryType.BOOK }
			]
		}
	})
	content: ContentType;
}

export class CreateMyHomeWithUserIdDto extends CreateMyHomeDto {
	@ApiProperty({
		example: '507f1f77bcf86cd799439011',
		description: '사용자 ID (MongoDB ObjectId)'
	})
	@IsMongoId()
	userId: string;
}
