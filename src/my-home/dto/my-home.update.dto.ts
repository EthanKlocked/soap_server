import { IsString, IsEnum, IsObject, IsMongoId, ValidateNested, IsOptional } from 'class-validator';
import { ApiProperty, getSchemaPath, ApiExtraModels } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { CategoryType, ContentType } from '../schema/my-home.schema';

class UpdateMovieContentDto {
	@ApiProperty({ example: 'https://example.com/movie.jpg', required: false })
	@IsOptional()
	@IsString()
	imageUrl?: string;

	@ApiProperty({ example: '인셉션', required: false })
	@IsOptional()
	@IsString()
	title?: string;

	@ApiProperty({ example: '크리스토퍼 놀란', required: false })
	@IsOptional()
	@IsString()
	director?: string;

	@ApiProperty({ example: '2010-07-21', required: false })
	@IsOptional()
	@IsString()
	releaseDate?: string;

	@ApiProperty({ example: ['레오나르도 디카프리오', '조셉 고든-레빗'], required: false })
	@IsOptional()
	@IsString({ each: true })
	actors?: string[];

	@ApiProperty({ example: '꿈 안의 꿈을 통해 생각을 훔치는 이야기', required: false })
	@IsOptional()
	@IsString()
	story?: string;

	@ApiProperty({ example: '액션, SF', required: false })
	@IsOptional()
	@IsString()
	genre?: string;

	@ApiProperty({
		enum: [0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5],
		example: 4.5,
		required: false
	})
	@IsOptional()
	@IsEnum([0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5])
	rating?: number;
}

class UpdateMusicContentDto {
	@ApiProperty({ example: 'https://example.com/album.jpg', required: false })
	@IsOptional()
	@IsString()
	imageUrl?: string;

	@ApiProperty({ example: 'Dynamite', required: false })
	@IsOptional()
	@IsString()
	title?: string;

	@ApiProperty({ example: 'BTS', required: false })
	@IsOptional()
	@IsString()
	artist?: string;
}

class UpdateYoutubeContentDto {
	@ApiProperty({ example: 'Amazing Video', required: false })
	@IsOptional()
	@IsString()
	title?: string;

	@ApiProperty({ example: 'Cool Channel', required: false })
	@IsOptional()
	@IsString()
	channelName?: string;

	@ApiProperty({ example: 'https://youtube.com/watch?v=dQw4w9WgXcQ', required: false })
	@IsOptional()
	@IsString()
	url?: string;

	@ApiProperty({ example: '2023-05-20T09:00:00.000Z', required: false })
	@IsOptional()
	@IsString()
	publishedAt?: string;

	@ApiProperty({ example: 'https://img.youtube.com/vi/dQw4w9WgXcQ/default.jpg', required: false })
	@IsOptional()
	@IsString()
	thumbnailUrl?: string;
}

class UpdateBookContentDto {
	@ApiProperty({ example: 'https://example.com/book.jpg', required: false })
	@IsOptional()
	@IsString()
	imageUrl?: string;

	@ApiProperty({ example: '1984', required: false })
	@IsOptional()
	@IsString()
	title?: string;

	@ApiProperty({ example: 'George Orwell', required: false })
	@IsOptional()
	@IsString()
	author?: string;

	@ApiProperty({ example: 'Secker & Warburg', required: false })
	@IsOptional()
	@IsString()
	publisher?: string;

	@ApiProperty({ example: '1949-06-08', required: false })
	@IsOptional()
	@IsString()
	releaseDate?: string;

	@ApiProperty({ example: 'A dystopian social science fiction novel', required: false })
	@IsOptional()
	@IsString()
	story?: string;

	@ApiProperty({
		enum: [0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5],
		example: 4.5,
		required: false
	})
	@IsOptional()
	@IsEnum([0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5])
	rating?: number;
}

// 모든 DTO를 ApiExtraModels로 등록
@ApiExtraModels(
	UpdateMovieContentDto,
	UpdateMusicContentDto,
	UpdateYoutubeContentDto,
	UpdateBookContentDto
)
export class UpdateMyHomeDto {
	@ApiProperty({
		enum: CategoryType,
		example: CategoryType.MOVIE,
		description: '카테고리 타입',
		required: false
	})
	@IsOptional()
	@IsEnum(CategoryType)
	category?: CategoryType;

	@ApiProperty({
		example: '다시 보니 더욱 좋았습니다. 강력 추천합니다!',
		description: '수정된 리뷰 내용',
		required: false
	})
	@IsOptional()
	@IsString()
	review?: string;

	@ApiProperty({
		description: '수정된 컨텐츠 정보',
		discriminator: {
			propertyName: 'category',
			mapping: {
				[CategoryType.MOVIE]: 'UpdateMovieContentDto',
				[CategoryType.MUSIC]: 'UpdateMusicContentDto',
				[CategoryType.YOUTUBE]: 'UpdateYoutubeContentDto',
				[CategoryType.BOOK]: 'UpdateBookContentDto'
			}
		},
		oneOf: [
			{ $ref: getSchemaPath(UpdateMovieContentDto) },
			{ $ref: getSchemaPath(UpdateMusicContentDto) },
			{ $ref: getSchemaPath(UpdateYoutubeContentDto) },
			{ $ref: getSchemaPath(UpdateBookContentDto) }
		],
		required: false
	})
	@IsOptional()
	@IsObject()
	@ValidateNested()
	@Type(() => Object, {
		keepDiscriminatorProperty: true,
		discriminator: {
			property: 'category',
			subTypes: [
				{ value: UpdateMovieContentDto, name: CategoryType.MOVIE },
				{ value: UpdateMusicContentDto, name: CategoryType.MUSIC },
				{ value: UpdateYoutubeContentDto, name: CategoryType.YOUTUBE },
				{ value: UpdateBookContentDto, name: CategoryType.BOOK }
			]
		}
	})
	content?: Partial<ContentType>;

	@ApiProperty({
		example: '507f1f77bcf86cd799439011',
		description: '수정할 사용자 ID (MongoDB ObjectId)',
		required: false
	})
	@IsOptional()
	@IsMongoId()
	userId?: string;
}
