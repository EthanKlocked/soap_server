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
	Delete,
	ParseIntPipe
} from '@nestjs/common';
import {
	ApiResponse,
	ApiQuery,
	ApiTags,
	ApiSecurity,
	ApiOperation,
	ApiBody,
	ApiParam
} from '@nestjs/swagger';
import { JwtAuthGuard } from '@src/auth/guard/jwt.guard';
import { ApiGuard } from '@src/auth/guard/api.guard';
import { MembershipGuard } from '@src/membership/guard/membership.guard';
import { DiaryService } from '@src/diary/diary.service';
import { DiaryCreateDto } from '@src/diary/dto/diary.create.dto';
import { DiaryUpdateDto } from '@src/diary/dto/diary.update.dto';
import { DiaryFindDto } from '@src/diary/dto/diary.find.dto';
import { DiaryReactionDto } from '@src/diary/dto/diary.reaction.dto';
import { DiaryAnalysisService } from '@src/diary/diaryAnalysis.service';
import { DiaryStatsDto } from '@src/diary/dto/diary.stats.dto';
import { DiaryReportDto } from '@src/diary/dto/diary.report.dto';
import { ReactionType } from '@src/diary/diary.interface';
import {
	MEMBERSHIP_LIMITS,
	THROTTLE_FEATURES,
	THROTTLE_TTL
} from '@src/membership/membership.constants';
import { ThrottleService } from '@src/throttle/throttle.service';
import { PaymentRequiredException } from '@src/membership/exception/payment-required.exception';

@UseGuards(ApiGuard, JwtAuthGuard)
@Controller('diary')
@ApiSecurity('api-key')
@ApiSecurity('x-access-token')
@ApiResponse({ status: 400, description: 'Request without API KEY' })
@ApiResponse({ status: 401, description: 'Empty / Invalid token' })
@ApiResponse({ status: 403, description: 'Invalid API KEY' })
@ApiResponse({ status: 410, description: 'Token has expired' })
@ApiResponse({ status: 500, description: 'Server Error' })
export class DiaryController {
	constructor(
		private readonly diaryService: DiaryService,
		private readonly diaryAnalysisService: DiaryAnalysisService,
		private readonly throttleService: ThrottleService
	) {}

	@ApiTags('Diary-Analysis')
	@UseGuards(MembershipGuard)
	@Get('similar-users')
	@ApiOperation({
		summary: 'Get similar users',
		description:
			'Retrieves a list of users with similar diary entries based on content analysis'
	})
	@ApiResponse({ status: 200, description: 'Success' })
	@ApiResponse({ status: 402, description: 'Membership required' })
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
		@Query('limit', new ParseIntPipe({ optional: true })) limit = 5,
		@Query('diaryId') diaryId?: string
	) {
		const maxCalls = req.membership
			? MEMBERSHIP_LIMITS.AI_MATCHING.PREMIUM
			: MEMBERSHIP_LIMITS.AI_MATCHING.FREE;

		// 무제한(null)이 아닌 경우만 throttle 체크
		// NOTE: 현재는 결과와 무관하게 호출 시 카운트됨 (빈 배열이어도 카운트)
		// 만약 결과에 따른 조건부 카운트가 필요하다면 friend.controller.ts의
		// sendFriendRequest 패턴 참고 (check → 실행 → increment 순서로 분리)
		if (maxCalls !== null) {
			await this.throttleService.checkAndIncrement(
				req.user.id,
				THROTTLE_FEATURES.AI_MATCHING,
				maxCalls,
				THROTTLE_TTL
			);
		}

		return this.diaryAnalysisService.getSimilarUsers(req.user.id, limit, diaryId);
	}

	@ApiTags('Diary-Analysis')
	@Get('metas') //for checking metas temporarily
	@ApiOperation({
		summary: 'Get all meta information',
		description: 'Retrieves all meta information for diaries (for temporary checking purposes)'
	})
	async findAllMeta() {
		return this.diaryService.findAllMeta();
	}

	@ApiTags('Diary-Analysis')
	@Get('stats')
	@ApiOperation({
		summary: 'Get monthly emotion statistics',
		description:
			'Retrieves emotion statistics for a specific month including core emotions and detailed emotions counts'
	})
	@ApiQuery({ name: 'year', required: true, type: Number })
	@ApiQuery({ name: 'month', required: true, type: Number })
	@ApiResponse({ status: 200, description: 'Success' })
	async getMonthlyEmotionStats(@Request() req, @Query() query: DiaryStatsDto) {
		return this.diaryService.getMonthlyEmotionStats(req.user.id, query.year, query.month);
	}

	@ApiTags('Diary-Management')
	@UseGuards(MembershipGuard)
	@Post()
	@ApiBody({ type: DiaryCreateDto })
	@ApiOperation({
		summary: 'Create a new diary',
		description: 'Creates a new diary with content and optional image URLs'
	})
	@ApiResponse({ status: 201, description: 'Success' })
	@ApiResponse({ status: 402, description: 'Membership required' })
	async create(@Request() req, @Body() createDiaryDto: DiaryCreateDto) {
		const maxImages = req.membership
			? MEMBERSHIP_LIMITS.DIARY_IMAGES.PREMIUM
			: MEMBERSHIP_LIMITS.DIARY_IMAGES.FREE;

		if (createDiaryDto.imageBox && createDiaryDto.imageBox.length > maxImages) {
			throw new PaymentRequiredException(
				`무료 사용자는 최대 ${MEMBERSHIP_LIMITS.DIARY_IMAGES.FREE}장까지 업로드 가능합니다. 멤버십 가입 시 ${MEMBERSHIP_LIMITS.DIARY_IMAGES.PREMIUM}장까지 가능합니다.`
			);
		}

		return this.diaryService.create(req.user.id, createDiaryDto);
	}

	@ApiTags('Diary-Management')
	@Get()
	@ApiOperation({
		summary: 'Retrieve diary list',
		description:
			'Fetches a list of user diaries. Can be filtered by public status, year, month, etc.'
	})
	@ApiResponse({ status: 200, description: 'Success' })
	@ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number' })
	@ApiQuery({
		name: 'limit',
		required: false,
		type: Number,
		description: 'Number of items per page'
	})
	@ApiQuery({ name: 'year', required: false, type: Number, description: 'Year to search' })
	@ApiQuery({ name: 'month', required: false, type: Number, description: 'Month to search' })
	@ApiQuery({
		name: 'isPublic',
		required: false,
		type: Boolean,
		description: 'Public status (true: public, false: private, undefined: all)'
	})
	async findAll(@Request() req, @Query() query: DiaryFindDto) {
		return this.diaryService.findAll(req.user.id, query);
	}

	@ApiTags('Diary-Management')
	@Get(':id')
	@ApiOperation({
		summary: 'Retrieve a specific diary',
		description: 'Fetches a specific diary by its ID'
	})
	@ApiResponse({ status: 200, description: 'Success' })
	async findOne(@Request() req, @Param('id') id: string) {
		return this.diaryService.findOne(id);
	}

	@ApiTags('Diary-Management')
	@UseGuards(MembershipGuard)
	@Patch(':id')
	@ApiBody({ type: DiaryUpdateDto })
	@ApiOperation({
		summary: 'Update a diary',
		description: 'Updates an existing diary entry. All fields are optional.'
	})
	@ApiResponse({ status: 200, description: 'Success' })
	@ApiResponse({ status: 402, description: 'Membership required' })
	@ApiResponse({ status: 404, description: 'User not found or not permitted to update' })
	async update(@Request() req, @Param('id') id: string, @Body() updateDiaryDto: DiaryUpdateDto) {
		const maxImages = req.membership
			? MEMBERSHIP_LIMITS.DIARY_IMAGES.PREMIUM
			: MEMBERSHIP_LIMITS.DIARY_IMAGES.FREE;

		if (updateDiaryDto.imageBox && updateDiaryDto.imageBox.length > maxImages) {
			throw new PaymentRequiredException(
				`무료 사용자는 최대 ${MEMBERSHIP_LIMITS.DIARY_IMAGES.FREE}장까지 업로드 가능합니다. 멤버십 가입 시 ${MEMBERSHIP_LIMITS.DIARY_IMAGES.PREMIUM}장까지 가능합니다.`
			);
		}

		return this.diaryService.update(req.user.id, id, updateDiaryDto);
	}

	@ApiTags('Diary-Management')
	@Delete(':id')
	@ApiOperation({
		summary: 'Delete a diary',
		description: 'Permanently removes a diary entry and associated images, meta datas'
	})
	@ApiResponse({ status: 200, description: 'Success' })
	@ApiResponse({ status: 404, description: 'User not found or not permitted to delete' })
	async delete(@Request() req, @Param('id') id: string) {
		return this.diaryService.delete(req.user.id, id);
	}

	@ApiTags('Diary-Interactions')
	@Get('friend/:friendId')
	@ApiOperation({
		summary: 'Retrieve targeted user diary list',
		description: 'Fetches a list of friend diaries. Can be filtered by year, month, etc.'
	})
	@ApiResponse({ status: 200, description: 'Success' })
	@ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number' })
	@ApiQuery({
		name: 'limit',
		required: false,
		type: Number,
		description: 'Number of items per page'
	})
	@ApiQuery({ name: 'year', required: false, type: Number, description: 'Year to search' })
	@ApiQuery({ name: 'month', required: false, type: Number, description: 'Month to search' })
	async findFriendDiaries(
		@Request() req,
		@Param('friendId') targetUserId: string,
		@Query() query: DiaryFindDto
	) {
		query.isPublic = true;
		return this.diaryService.findAll(targetUserId, query);
	}

	@ApiTags('Diary-Interactions')
	@Post('reaction/:id')
	@ApiOperation({
		summary: 'Toggle reaction on a diary',
		description: 'Adds or removes a user reaction to a specific diaryReaction'
	})
	@ApiParam({ name: 'id', description: 'Diary ID' })
	@ApiResponse({ status: 200, description: 'Success' })
	@ApiResponse({ status: 404, description: 'Diary not found' })
	@ApiBody({
		type: DiaryReactionDto,
		description: 'Reaction to toggle',
		schema: {
			properties: {
				reactionType: {
					enum: Object.values(ReactionType),
					description: 'Available reaction types',
					example: 'best'
				}
			}
		}
	})
	async toggleReaction(@Request() req, @Param('id') id: string, @Body() body: DiaryReactionDto) {
		return this.diaryService.toggleReaction(req.user.id, id, body.reactionType);
	}

	@ApiTags('Diary-Interactions')
	@Post('report/:id')
	@ApiOperation({
		summary: 'Report a diary',
		description: 'Creates a report for inappropriate diary content'
	})
	@ApiParam({ name: 'id', description: 'Diary ID' })
	@ApiResponse({ status: 201, description: 'Success' })
	@ApiResponse({ status: 404, description: 'Diary not found' })
	@ApiResponse({ status: 409, description: 'Cannot report own diary or duplicate report' })
	@ApiBody({ type: DiaryReportDto })
	async createReport(@Request() req, @Param('id') id: string, @Body() reportDto: DiaryReportDto) {
		return this.diaryService.createReport(req.user.id, id, reportDto);
	}
}
