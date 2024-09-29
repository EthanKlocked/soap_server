import {
	Body,
	Controller,
	Post,
	UseGuards,
	Get,
	Request,
	Query,
	Param,
	Patch,
	Delete
} from '@nestjs/common';
import { ApiResponse, ApiQuery, ApiTags, ApiSecurity, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '@src/auth/guard/jwt.guard';
import { ApiGuard } from '@src/auth/guard/api.guard';
import { DiaryService } from '@src/diary/diary.service';
import { DiaryCreateDto } from '@src/diary/dto/diary.create.dto';
import { DiaryUpdateDto } from '@src/diary/dto/diary.update.dto';
import { DiaryFindDto } from '@src/diary/dto/diary.find.dto';
import { DiaryAnalysisService } from '@src/diary/diaryAnalysis.service';

@UseGuards(ApiGuard, JwtAuthGuard)
@Controller('diary')
@ApiTags('diary')
@ApiSecurity('api-key')
@ApiResponse({ status: 400, description: 'Request without API KEY' })
@ApiResponse({ status: 401, description: 'Empty / Invalid token' })
@ApiResponse({ status: 403, description: 'Invalid API KEY' })
@ApiResponse({ status: 410, description: 'Token has expired' })
@ApiResponse({ status: 500, description: 'Server Error' })
export class DiaryController {
	constructor(
		private readonly diariesService: DiaryService,
		private readonly diaryAnalysisService: DiaryAnalysisService
	) {}

	@Get('metas') //for checking metas temporarily
	async findAllMeta() {
		return this.diariesService.findAllMeta();
	}

	@Get('similar-users')
	@ApiResponse({ status: 200, description: 'Success' })
	@ApiQuery({
		name: 'limit',
		required: false,
		type: Number,
		description: 'Number of similar users to return'
	})
	@ApiQuery({
		name: 'diaryId',
		required: false,
		type: String,
		description: 'Specific diary ID to base similarity on'
	})
	async getSimilarUsers(
		@Request() req,
		@Query('limit') limit?: number,
		@Query('diaryId') diaryId?: string
	) {
		return this.diaryAnalysisService.getSimilarUsers(req.user.id, limit, diaryId);
	}

	@Get(':id')
	@ApiResponse({ status: 200, description: 'Success' })
	async findOne(@Request() req, @Param('id') id: string) {
		return this.diariesService.findOne(req.user.id, id);
	}

	@Get()
	@ApiResponse({ status: 200, description: 'Success' })
	async findAll(@Request() req, @Query() query: DiaryFindDto) {
		return this.diariesService.findAll(req.user.id, query);
	}

	@Post()
	@ApiResponse({ status: 201, description: 'Success' })
	async create(@Request() req, @Body() body: DiaryCreateDto) {
		return this.diariesService.create(req.user.id, body);
	}

	@Patch(':id')
	@ApiOperation({
		summary: '일기 업데이트',
		description:
			'지정된 ID의 일기를 업데이트합니다. 모든 필드는 선택적이며, 일기 생성 시 파라미터와 동일합니다.'
	})
	@ApiResponse({ status: 200, description: 'Success' })
	@ApiResponse({ status: 404, description: 'User not found or not permitted to update' })
	async update(@Request() req, @Param('id') id: string, @Body() body: DiaryUpdateDto) {
		return this.diariesService.update(req.user.id, id, body);
	}

	@Delete(':id')
	@ApiResponse({ status: 200, description: 'Success' })
	@ApiResponse({ status: 404, description: 'User not found or not permitted to delete' })
	async delete(@Request() req, @Param('id') id: string) {
		return this.diariesService.delete(req.user.id, id);
	}
}
