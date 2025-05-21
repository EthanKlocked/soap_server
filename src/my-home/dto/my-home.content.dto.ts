import { IsString, IsEnum, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { RatingType } from '../schema/my-home.schema';

// 베이스 DTO 클래스
export class BaseContentDto {
	@ApiProperty({ example: '컨텐츠 제목' })
	@IsString()
	title: string;
}

// 영화 DTO 클래스
export class MovieContentDto extends BaseContentDto {
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

// 음악 DTO 클래스
export class MusicContentDto extends BaseContentDto {
	@ApiProperty({ example: 'https://example.com/album.jpg', required: false })
	@IsOptional()
	@IsString()
	imageUrl?: string;

	@ApiProperty({ example: 'BTS' })
	@IsString()
	artist: string;
}

// 유튜브 DTO 클래스
export class YoutubeContentDto extends BaseContentDto {
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

// 책 DTO 클래스
export class BookContentDto extends BaseContentDto {
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
