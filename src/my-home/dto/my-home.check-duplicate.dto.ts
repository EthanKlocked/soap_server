import { IsEnum, IsObject, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, getSchemaPath, ApiExtraModels } from '@nestjs/swagger';
import { CategoryType, ContentType } from '../schema/my-home.schema';
import {
	MovieContentDto,
	MusicContentDto,
	YoutubeContentDto,
	BookContentDto
} from './my-home.content.dto';

@ApiExtraModels(MovieContentDto, MusicContentDto, YoutubeContentDto, BookContentDto)
export class CheckDuplicateDto {
	@ApiProperty({
		enum: CategoryType,
		example: CategoryType.MOVIE,
		description: '컨텐츠의 카테고리 타입'
	})
	@IsEnum(CategoryType)
	category: CategoryType;

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
