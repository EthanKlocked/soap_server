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
	UseInterceptors,
	UploadedFiles,
	MaxFileSizeValidator,
	FileTypeValidator,
	ParseFilePipe,
	BadRequestException
} from '@nestjs/common';
import {
	ApiResponse,
	ApiQuery,
	ApiTags,
	ApiSecurity,
	ApiOperation,
	ApiConsumes,
	ApiBody,
	ApiParam
} from '@nestjs/swagger';
import { JwtAuthGuard } from '@src/auth/guard/jwt.guard';
import { ApiGuard } from '@src/auth/guard/api.guard';
import { DiaryService } from '@src/diary/diary.service';
import { DiaryCreateDto } from '@src/diary/dto/diary.create.dto';
import { DiaryUpdateDto } from '@src/diary/dto/diary.update.dto';
import { DiaryFindDto } from '@src/diary/dto/diary.find.dto';
import { DiaryReactionDto } from '@src/diary/dto/diary.reaction.dto';
import { DiaryAnalysisService } from '@src/diary/diaryAnalysis.service';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { ReactionType } from '@src/diary/schema/diary.schema';

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
		private readonly diaryService: DiaryService,
		private readonly diaryAnalysisService: DiaryAnalysisService
	) {}

	@Get('metas') //for checking metas temporarily
	@ApiOperation({
		summary: 'Get all meta information',
		description: 'Retrieve all meta information for diaries (for checking metas temporarily)'
	})
	async findAllMeta() {
		return this.diaryService.findAllMeta();
	}

	@Get('similar-users')
	@ApiOperation({
		summary: 'Get similar users',
		description: 'Retrieve a list of users with similar diary entries'
	})
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
		return this.diaryService.findOne(req.user.id, id);
	}

	@Get()
	@ApiOperation({
		summary: 'Retrieve diary list',
		description:
			'Fetches a list of user diaries. Can be filtered by public status, year, month, etc.'
	})
	@ApiResponse({ status: 200, description: 'Success' })
	@ApiQuery({ name: 'page', required: false, type: Number, description: '페이지 번호' })
	@ApiQuery({ name: 'limit', required: false, type: Number, description: '페이지당 항목 수' })
	@ApiQuery({ name: 'year', required: false, type: Number, description: '조회할 연도' })
	@ApiQuery({ name: 'month', required: false, type: Number, description: '조회할 월' })
	@ApiQuery({
		name: 'isPublic',
		required: false,
		type: Boolean,
		description: '공개 여부 (true: 공개, false: 비공개, undefined: 모두)'
	})
	async findAll(@Request() req, @Query() query: DiaryFindDto) {
		return this.diaryService.findAll(req.user.id, query);
	}

	@Get('friend/:friendId')
	@ApiOperation({
		summary: 'Retrieve targeted user diary list',
		description: 'Fetches a list of friend diaries. Can be filtered by year, month, etc.'
	})
	@ApiResponse({ status: 200, description: 'Success' })
	@ApiQuery({ name: 'page', required: false, type: Number, description: '페이지 번호' })
	@ApiQuery({ name: 'limit', required: false, type: Number, description: '페이지당 항목 수' })
	@ApiQuery({ name: 'year', required: false, type: Number, description: '조회할 연도' })
	@ApiQuery({ name: 'month', required: false, type: Number, description: '조회할 월' })
	async findFriendDiaries(
		@Request() req,
		@Param('friendId') targetUserId: string,
		@Query() query: DiaryFindDto
	) {
		query.isPublic = true;
		return this.diaryService.findAll(targetUserId, query);
	}

	@Post('reaction/:id')
	@ApiOperation({ summary: 'Toggle reaction on a diary' })
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

	@Post()
	@UseInterceptors(FileFieldsInterceptor([{ name: 'imageBox', maxCount: 5 }]))
	@ApiConsumes('multipart/form-data')
	@ApiBody({ type: DiaryCreateDto })
	@ApiOperation({
		summary: 'Create new diary',
		description: 'Create a new diary entry with optional image uploads'
	})
	@ApiResponse({ status: 201, description: 'Success' })
	async create(
		@Request() req,
		@Body() createDiaryDto: DiaryCreateDto,
		@UploadedFiles() files: { imageBox?: Express.Multer.File[] }
	) {
		let validatedFiles: Express.Multer.File[] = [];
		if (files && files.imageBox) {
			validatedFiles = this.validateFiles(files.imageBox);
		}
		return this.diaryService.create(req.user.id, createDiaryDto, validatedFiles);
	}

	@Patch(':id')
	@UseInterceptors(FileFieldsInterceptor([{ name: 'imageBox', maxCount: 5 }]))
	@ApiConsumes('multipart/form-data')
	@ApiBody({ type: DiaryUpdateDto })
	@ApiOperation({
		summary: 'update diary',
		description:
			'update specific id of diary. Every fields are same with creating params as optional.'
	})
	@ApiResponse({ status: 200, description: 'Success' })
	@ApiResponse({ status: 404, description: 'User not found or not permitted to update' })
	async update(
		@Request() req,
		@Param('id') id: string,
		@Body() body: DiaryUpdateDto,
		@UploadedFiles() files: { imageBox?: Express.Multer.File[] }
	) {
		let validatedFiles: Express.Multer.File[] = [];
		if (files && files.imageBox) {
			validatedFiles = this.validateFiles(files.imageBox);
		}
		return this.diaryService.update(req.user.id, id, body, validatedFiles);
	}

	@Delete(':id')
	@ApiResponse({ status: 200, description: 'Success' })
	@ApiResponse({ status: 404, description: 'User not found or not permitted to delete' })
	async delete(@Request() req, @Param('id') id: string) {
		return this.diaryService.delete(req.user.id, id);
	}

	private validateFiles(files: Express.Multer.File[]): Express.Multer.File[] {
		const maxSize = 8 * 1024 * 1024; // 8MB
		const allowedTypes = /(jpg|jpeg|png|gif)$/;

		return files.filter(file => {
			if (file.size > maxSize) {
				throw new BadRequestException(
					`File ${file.originalname} is too large. Max size is 8MB.`
				);
			}
			if (!allowedTypes.test(file.originalname.toLowerCase())) {
				throw new BadRequestException(
					`File ${file.originalname} has an invalid file type. Allowed types are jpg, jpeg, png, gif.`
				);
			}
			return true;
		});
	}
}
