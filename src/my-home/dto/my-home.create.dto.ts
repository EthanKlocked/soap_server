import { IsString, IsEnum, IsObject, IsMongoId, ValidateNested } from 'class-validator';
import { ApiProperty, getSchemaPath } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { CategoryType, ContentType, RatingType } from '../schema/my-home.schema';

class MovieContentDto {
	@ApiProperty({ example: 'https://example.com/movie.jpg' })
	@IsString()
	imageUrl: string;

	@ApiProperty({ example: '인셉션' })
	@IsString()
	title: string;

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

class MusicContentDto {
	@ApiProperty({ example: 'https://example.com/album.jpg' })
	@IsString()
	imageUrl: string;

	@ApiProperty({ example: 'Dynamite' })
	@IsString()
	title: string;

	@ApiProperty({ example: 'BTS' })
	@IsString()
	artist: string;
}

class YoutubeContentDto {
	@ApiProperty({ example: 'Amazing Video' })
	@IsString()
	title: string;

	@ApiProperty({ example: 'Cool Channel' })
	@IsString()
	channelName: string;

	@ApiProperty({ example: 'https://youtube.com/watch?v=dQw4w9WgXcQ' })
	@IsString()
	url: string;

	@ApiProperty({ example: '2023-05-20T09:00:00.000Z' })
	@IsString()
	publishedAt: string;

	@ApiProperty({ example: 'https://img.youtube.com/vi/dQw4w9WgXcQ/default.jpg' })
	@IsString()
	thumbnailUrl: string;
}

class BookContentDto {
	@ApiProperty({ example: 'https://example.com/book.jpg' })
	@IsString()
	imageUrl: string;

	@ApiProperty({ example: '1984' })
	@IsString()
	title: string;

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
		description: '카테고리 타입'
	})
	@IsEnum(CategoryType)
	category: CategoryType;

	@ApiProperty({
		example: '정말 재미있는 영화였습니다. 강력 추천합니다!',
		description: '리뷰 내용'
	})
	@IsString()
	review: string;

	@ApiProperty({
		description: '컨텐츠 정보',
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
		keepDiscriminatorProperty: true,
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

	@ApiProperty({
		example: '507f1f77bcf86cd799439011',
		description: '사용자 ID (MongoDB ObjectId)'
	})
	@IsMongoId()
	userId: string;
}
