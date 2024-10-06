import { IsString, IsEnum, IsObject, IsMongoId, ValidateNested, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, getSchemaPath } from '@nestjs/swagger';
import { CategoryType, RatingType, ContentType } from '../schema/my-home.schema';

class BaseContentDto {
	@ApiProperty({ example: '컨텐츠 제목' })
	@IsString()
	title: string;
}

class MovieContentDto extends BaseContentDto {
	@ApiProperty({ example: 'https://example.com/movie.jpg', required: false })
	@IsOptional()
	@IsString()
	imageUrl?: string;

	@ApiProperty({ example: '크리스토퍼 놀란' })
	@IsString()
	director: string;

	@ApiProperty({ example: '2010-07-21' })
	@IsString()
	releaseDate: string;

	@ApiProperty({ example: ['레오나르도 디카프리오', '조셉 고든-레빗'] })
	@IsString({ each: true })
	actors: string[];

	@ApiProperty({ example: '꿈 안의 꿈을 통해 생각을 훔치는 이야기' })
	@IsString()
	story: string;

	@ApiProperty({ example: '액션, SF' })
	@IsString()
	genre: string;

	@ApiProperty({ enum: [0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5], example: 4.5 })
	@IsEnum([0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5])
	rating: RatingType;
}

class MusicContentDto extends BaseContentDto {
	@ApiProperty({ example: 'https://example.com/album.jpg', required: false })
	@IsOptional()
	@IsString()
	imageUrl?: string;

	@ApiProperty({ example: 'Cool Channel' })
	@IsString()
	artist: string;
}

class YoutubeContentDto extends BaseContentDto {
	@ApiProperty({ example: 'Cool Channel' })
	@IsString()
	channelName: string;

	@ApiProperty({ example: 'https://youtube.com/watch?v=dQw4w9WgXcQ' })
	@IsString()
	url: string;

	@ApiProperty({ example: '2023-05-20T09:00:00.000Z' })
	@IsString()
	publishedAt: string;

	@ApiProperty({ example: 'https://img.youtube.com/vi/dQw4w9WgXcQ/default.jpg', required: false })
	@IsOptional()
	@IsString()
	thumbnailUrl?: string;
}

class BookContentDto extends BaseContentDto {
	@ApiProperty({ example: 'https://example.com/book.jpg', required: false })
	@IsOptional()
	@IsString()
	imageUrl?: string;

	@ApiProperty({ example: 'George Orwell' })
	@IsString()
	author: string;

	@ApiProperty({ example: 'Secker & Warburg' })
	@IsString()
	publisher: string;

	@ApiProperty({ example: '1949-06-08' })
	@IsString()
	releaseDate: string;

	@ApiProperty({ example: 'A dystopian social science fiction novel' })
	@IsString()
	story: string;

	@ApiProperty({ enum: [0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5], example: 4.5 })
	@IsEnum([0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5])
	rating: RatingType;
}

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
		description: '사용자의 리뷰 내용'
	})
	@IsOptional()
	@IsString()
	review?: string;

	@ApiProperty({
		description: '컨텐츠의 상세 정보. 카테고리에 따라 다른 구조를 가집니다.',
		oneOf: [
			{ $ref: getSchemaPath(MovieContentDto) },
			{ $ref: getSchemaPath(MusicContentDto) },
			{ $ref: getSchemaPath(YoutubeContentDto) },
			{ $ref: getSchemaPath(BookContentDto) }
		]
	})
	@IsObject()
	@ValidateNested()
	@Type(obj => {
		switch (obj.object.category) {
			case CategoryType.MOVIE:
				return MovieContentDto;
			case CategoryType.MUSIC:
				return MusicContentDto;
			case CategoryType.YOUTUBE:
				return YoutubeContentDto;
			case CategoryType.BOOK:
				return BookContentDto;
			default:
				return BaseContentDto;
		}
	})
	content: ContentType;

	@ApiProperty({
		example: '507f1f77bcf86cd799439011',
		description: '사용자 ID (MongoDB ObjectId)'
	})
	@IsMongoId()
	userId: string;
}
