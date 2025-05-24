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
		description: '중복 체크할 컨텐츠의 핵심 정보',
		examples: {
			movie: {
				summary: '영화 예시',
				value: {
					title: '인셉션',
					director: '크리스토퍼 놀란'
				}
			},
			music: {
				summary: '음악 예시',
				value: {
					title: 'Dynamite',
					artist: 'BTS'
				}
			},
			youtube: {
				summary: '유튜브 예시',
				value: {
					url: 'https://www.youtube.com/watch?v=abc123'
				}
			},
			book: {
				summary: '책 예시',
				value: {
					title: '해리포터',
					author: 'J.K. 롤링'
				}
			}
		}
	})
	@IsObject()
	content: any;
}
