import { IsEnum, IsObject } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { CategoryType } from '../schema/my-home.schema';

export class CheckDuplicateDto {
	@ApiProperty({
		enum: CategoryType,
		example: CategoryType.MOVIE,
		description: '컨텐츠의 카테고리 타입'
	})
	@IsEnum(CategoryType)
	category: CategoryType;

	@ApiProperty({
		description: '중복 체크할 컨텐츠의 핵심 정보 (카테고리에 따라 필요한 필드가 다름)',
		oneOf: [
			{
				title: '영화 (MOVIE)',
				type: 'object',
				properties: {
					title: {
						type: 'string',
						description: '영화 제목',
						example: '인셉션'
					},
					director: {
						type: 'string',
						description: '감독',
						example: '크리스토퍼 놀란'
					}
				},
				required: ['title', 'director']
			},
			{
				title: '음악 (MUSIC)',
				type: 'object',
				properties: {
					title: {
						type: 'string',
						description: '곡 제목',
						example: 'Dynamite'
					},
					artist: {
						type: 'string',
						description: '아티스트',
						example: 'BTS'
					}
				},
				required: ['title', 'artist']
			},
			{
				title: '유튜브 (YOUTUBE)',
				type: 'object',
				properties: {
					url: {
						type: 'string',
						description: '유튜브 URL',
						example: 'https://www.youtube.com/watch?v=abc123'
					}
				},
				required: ['url']
			},
			{
				title: '책 (BOOK)',
				type: 'object',
				properties: {
					title: {
						type: 'string',
						description: '책 제목',
						example: '해리포터'
					},
					author: {
						type: 'string',
						description: '저자',
						example: 'J.K. 롤링'
					}
				},
				required: ['title', 'author']
			}
		]
	})
	@IsObject()
	content: any;
}
