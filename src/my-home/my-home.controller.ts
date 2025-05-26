import {
	Body,
	Controller,
	Post,
	UseGuards,
	Get,
	Request,
	Param,
	Patch,
	Delete,
	ForbiddenException,
	Query,
	HttpCode,
	HttpStatus
} from '@nestjs/common';
import {
	ApiResponse,
	ApiBearerAuth,
	ApiQuery,
	ApiSecurity,
	ApiOperation,
	ApiBody,
	ApiTags
} from '@nestjs/swagger';
import { JwtAuthGuard } from '@src/auth/guard/jwt.guard';
import { ApiGuard } from '@src/auth/guard/api.guard';
import { MyHomeService } from './my-home.service';
import { CreateMyHomeDto } from './dto/my-home.create.dto';
import { UpdateMyHomeDto } from './dto/my-home.update.dto';
import { CheckDuplicateDto } from './dto/my-home.check-duplicate.dto';
import { CategoryType, ContentType } from './schema/my-home.schema';

@ApiBearerAuth()
@UseGuards(ApiGuard, JwtAuthGuard)
@ApiSecurity('api-key')
@Controller('my-home')
export class MyHomeController {
	constructor(private readonly myHomeService: MyHomeService) {}

	@ApiTags('My-Home')
	@Get(':id')
	@ApiOperation({
		summary: '특정 MyHome 정보 조회',
		description: '지정된 ID에 해당하는 MyHome 컨텐츠 정보를 조회합니다.'
	})
	@ApiResponse({
		status: 200,
		description: 'Success',
		schema: {
			type: 'object',
			properties: {
				id: { type: 'string', example: '507f1f77bcf86cd799439011' },
				category: {
					type: 'string',
					enum: Object.values(CategoryType),
					example: CategoryType.MOVIE
				},
				review: { type: 'string', example: '좋은 영화였습니다.' },
				content: {
					type: 'object',
					properties: {
						imageUrl: { type: 'string', example: 'https://example.com/movie.jpg' },
						title: { type: 'string', example: '인셉션' },
						director: { type: 'string', example: '크리스토퍼 놀란' },
						releaseDate: { type: 'string', example: '2010-07-21' },
						actors: {
							type: 'array',
							items: { type: 'string' },
							example: ['레오나르도 디카프리오', '조셉 고든-레빗']
						},
						story: {
							type: 'string',
							example: '꿈 안의 꿈을 통해 생각을 훔치는 이야기'
						},
						genre: { type: 'string', example: '액션, SF' },
						rating: {
							type: 'number',
							enum: [0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5],
							example: 4.5
						}
					}
				},
				userId: { type: 'string', example: '507f1f77bcf86cd799439012' },
				createdAt: {
					type: 'string',
					format: 'date-time',
					example: '2024-10-01T09:00:00.000Z'
				},
				updatedAt: {
					type: 'string',
					format: 'date-time',
					example: '2024-10-01T09:00:00.000Z'
				}
			}
		}
	})
	@ApiResponse({ status: 400, description: 'Request without API KEY' })
	@ApiResponse({ status: 403, description: 'Invalid API KEY' })
	@ApiResponse({ status: 404, description: 'MyHome not found' })
	@ApiResponse({ status: 500, description: 'Server Error' })
	async findOne(@Param('id') id: string) {
		return this.myHomeService.findOne(id);
	}

	@ApiTags('My-Home')
	@Get()
	@ApiOperation({
		summary: 'MyHome 정보 조회',
		description:
			'모든 MyHome 컨텐츠 정보를 조회하거나 특정 사용자의 MyHome 컨텐츠 목록을 조회합니다.'
	})
	@ApiResponse({
		status: 200,
		description: 'Success',
		schema: {
			type: 'array',
			items: {
				type: 'object',
				properties: {
					id: { type: 'string', example: '507f1f77bcf86cd799439011' },
					category: {
						type: 'string',
						enum: Object.values(CategoryType),
						example: CategoryType.MUSIC
					},
					review: { type: 'string', example: '좋은 음악이었습니다.' },
					content: {
						type: 'object',
						properties: {
							imageUrl: { type: 'string', example: 'https://example.com/album.jpg' },
							title: { type: 'string', example: 'Dynamite' },
							artist: { type: 'string', example: 'BTS' }
						}
					},
					userId: { type: 'string', example: '507f1f77bcf86cd799439012' },
					createdAt: {
						type: 'string',
						format: 'date-time',
						example: '2024-10-01T09:00:00.000Z'
					},
					updatedAt: {
						type: 'string',
						format: 'date-time',
						example: '2024-10-01T09:00:00.000Z'
					}
				}
			}
		}
	})
	@ApiResponse({ status: 400, description: 'Request without API KEY' })
	@ApiResponse({ status: 403, description: 'Invalid API KEY' })
	@ApiResponse({ status: 500, description: 'Server Error' })
	@ApiQuery({ name: 'userId', required: false, type: String })
	@ApiQuery({ name: 'category', required: false, enum: CategoryType })
	async findAll(
		@Request() req,
		@Query('userId') userId?: string,
		@Query('category') category?: CategoryType
	) {
		// userId가 제공되지 않으면 토큰에서 추출 (본인 마이홈)
		const targetUserId = userId || req.user.id;
		return this.myHomeService.findAll(targetUserId, category);
	}

	@ApiTags('My-Home')
	@Post('check-duplicate')
	@HttpCode(HttpStatus.OK)
	@ApiOperation({
		summary: '중복 컨텐츠 확인',
		description:
			'컨텐츠의 중복 여부를 확인합니다. 중복이 있으면 true, 없으면 false를 반환합니다.'
	})
	@ApiBody({
		type: CheckDuplicateDto
	})
	@ApiResponse({
		status: 200,
		description: '중복 체크 결과',
		schema: {
			type: 'object',
			properties: {
				isDuplicate: { type: 'boolean', example: false },
				message: { type: 'string', example: '중복된 컨텐츠가 없습니다.' }
			}
		}
	})
	@ApiResponse({ status: 400, description: 'Request without API KEY' })
	@ApiResponse({ status: 403, description: 'Invalid API KEY' })
	@ApiResponse({ status: 500, description: 'Server Error' })
	async checkDuplicate(@Request() req, @Body() checkDuplicateDto: CheckDuplicateDto) {
		const isDuplicate = await this.myHomeService.checkDuplicate(
			req.user.id,
			checkDuplicateDto.category,
			checkDuplicateDto.content
		);

		return {
			isDuplicate,
			message: isDuplicate
				? this.generateDuplicateMessage(
						checkDuplicateDto.category,
						checkDuplicateDto.content
					)
				: '중복된 컨텐츠가 없습니다.'
		};
	}

	// 중복 메시지 생성 헬퍼 메서드
	private generateDuplicateMessage(category: CategoryType, content: any): string {
		switch (category) {
			case CategoryType.MOVIE:
				return `영화 '${content.title}' (감독: ${content.director})는 이미 추가되어 있습니다.`;
			case CategoryType.MUSIC:
				return `음악 '${content.title}' (아티스트: ${content.artist})는 이미 추가되어 있습니다.`;
			case CategoryType.YOUTUBE:
				return `유튜브 영상 '${content.title}'은 이미 추가되어 있습니다.`;
			case CategoryType.BOOK:
				return `책 '${content.title}' (저자: ${content.author})는 이미 추가되어 있습니다.`;
			default:
				return '중복된 컨텐츠가 있습니다.';
		}
	}

	@ApiTags('My-Home')
	@Post()
	@HttpCode(HttpStatus.CREATED)
	@ApiOperation({
		summary: '새 MyHome 생성',
		description:
			'새로운 MyHome 컨텐츠 정보를 생성합니다. 현재 로그인한 사용자의 ID가 자동으로 할당됩니다.'
	})
	@ApiBody({
		type: CreateMyHomeDto
	})
	@ApiResponse({ status: 201, description: 'Success' })
	@ApiResponse({ status: 400, description: 'Request without API KEY' })
	@ApiResponse({ status: 403, description: 'Invalid API KEY' })
	@ApiResponse({ status: 500, description: 'Server Error' })
	async create(@Request() req, @Body() createMyHomeDto: Omit<CreateMyHomeDto, 'userId'>) {
		return this.myHomeService.create({
			...createMyHomeDto,
			userId: req.user.id
		});
	}

	@ApiTags('My-Home')
	@Patch(':id')
	@ApiOperation({
		summary: 'MyHome 정보 수정',
		description:
			'지정된 ID의 MyHome 컨텐츠 정보를 수정합니다. 해당 MyHome 컨텐츠의 소유자만 수정할 수 있습니다.'
	})
	@ApiBody({ type: UpdateMyHomeDto, description: 'MyHome 업데이트 정보' })
	@ApiResponse({ status: 200, description: 'Success' })
	@ApiResponse({ status: 400, description: 'Request without API KEY' })
	@ApiResponse({
		status: 403,
		description: 'Invalid API KEY or Unauthorized access'
	})
	@ApiResponse({ status: 404, description: 'MyHome not found' })
	@ApiResponse({ status: 500, description: 'Server Error' })
	async update(
		@Request() req,
		@Param('id') id: string,
		@Body() updateMyHomeDto: UpdateMyHomeDto | Partial<ContentType>
	) {
		const myHome = await this.myHomeService.findOne(id);
		if (myHome.userId.toString() !== req.user.id) {
			throw new ForbiddenException('You are not authorized to update this resource');
		}
		return this.myHomeService.update(id, updateMyHomeDto);
	}

	@ApiTags('My-Home')
	@Delete(':id')
	@ApiOperation({
		summary: 'MyHome 삭제',
		description:
			'지정된 ID의 MyHome 컨텐츠를 삭제합니다. 해당 MyHome 컨텐츠의 소유자만 삭제할 수 있습니다.'
	})
	@ApiResponse({ status: 200, description: 'Success' })
	@ApiResponse({ status: 400, description: 'Request without API KEY' })
	@ApiResponse({
		status: 403,
		description: 'Invalid API KEY or Unauthorized access'
	})
	@ApiResponse({ status: 404, description: 'MyHome not found' })
	@ApiResponse({ status: 500, description: 'Server Error' })
	async remove(@Request() req, @Param('id') id: string) {
		const myHome = await this.myHomeService.findOne(id);
		if (myHome.userId.toString() !== req.user.id) {
			throw new ForbiddenException('You are not authorized to delete this resource');
		}
		return this.myHomeService.remove(id);
	}
}
