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
	Query
} from '@nestjs/common';
import { ApiResponse, ApiBearerAuth, ApiQuery, ApiSecurity, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '@src/auth/guard/jwt.guard';
import { ApiGuard } from '@src/auth/guard/api.guard';
import { MyHomeService } from './my-home.service';
import { CreateMyHomeDto } from './dto/my-home.create.dto';
import { UpdateMyHomeDto } from './dto/my-home.update.dto';
import { CategoryType } from './schema/my-home.schema';

@ApiBearerAuth()
@UseGuards(ApiGuard, JwtAuthGuard)
@ApiSecurity('api-key')
@Controller('my-home')
export class MyHomeController {
	constructor(private readonly myHomeService: MyHomeService) {}

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
	async findAll(@Query('userId') userId: string, @Query('category') category?: CategoryType) {
		return this.myHomeService.findAll(userId, category);
	}

	@Post()
	@ApiOperation({
		summary: '새 MyHome 생성',
		description:
			'새로운 MyHome 컨텐츠 정보를 생성합니다. 현재 로그인한 사용자의 ID가 자동으로 할당됩니다.'
	})
	@ApiResponse({ status: 201, description: 'Success' })
	@ApiResponse({ status: 400, description: 'Request without API KEY' })
	@ApiResponse({ status: 403, description: 'Invalid API KEY' })
	@ApiResponse({ status: 500, description: 'Server Error' })
	async create(@Request() req, @Body() createMyHomeDto: CreateMyHomeDto) {
		return this.myHomeService.create({
			...createMyHomeDto,
			userId: req.user.id
		});
	}

	@Patch(':id')
	@ApiOperation({
		summary: 'MyHome 정보 수정',
		description:
			'지정된 ID의 MyHome 컨텐츠 정보를 수정합니다. 해당 MyHome 컨텐츠의 소유자만 수정할 수 있습니다.'
	})
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
		@Body() updateMyHomeDto: UpdateMyHomeDto
	) {
		const myHome = await this.myHomeService.findOne(id);
		if (myHome.userId.toString() !== req.user.id) {
			throw new ForbiddenException('You are not authorized to update this resource');
		}
		return this.myHomeService.update(id, updateMyHomeDto);
	}

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
