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
} from '@nestjs/common';
import { ApiResponse, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '@src/auth/guard/jwt.guard';
import { ApiGuard } from '@src/auth/guard/api.guard';
import { DiaryService } from '@src/diary/diary.service';
import { DiaryCreateDto } from '@src/diary/dto/diary.create.dto';
import { DiaryUpdateDto } from '@src/diary/dto/diary.update.dto';
import { DiaryFindDto } from '@src/diary/dto/diary.find.dto';
import { DiaryAnalysisService } from '@src/diary/diaryAnalysis.service';

@UseGuards(ApiGuard)
@UseGuards(JwtAuthGuard)
@Controller('diary')
export class DiaryController {
  constructor(
    private readonly diariesService: DiaryService,
    private readonly diaryAnalysisService: DiaryAnalysisService,
  ) {}

  @Get('metas') //for checking metas temporarily
  async findAllMeta() {
    return this.diariesService.findAllMeta();
  }

  @Get('similar-users')
  @ApiResponse({ status: 200, description: 'Success' })
  @ApiResponse({ status: 400, description: 'Request without API KEY' })
  @ApiResponse({ status: 403, description: 'Invalid API KEY' })
  @ApiResponse({ status: 500, description: 'Server Error' })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Number of similar users to return',
  })
  async getSimilarUsers(@Request() req, @Query('limit') limit?: number) {
    return this.diaryAnalysisService.getSimilarUsers(req.user.id, limit);
  }

  @Get(':id')
  @ApiResponse({ status: 200, description: 'Success' })
  @ApiResponse({ status: 400, description: 'Request without API KEY' })
  @ApiResponse({ status: 403, description: 'Invalid API KEY' })
  @ApiResponse({ status: 500, description: 'Server Error' })
  async findOne(@Request() req, @Param('id') id: string) {
    return this.diariesService.findOne(req.user.id, id);
  }

  @Get()
  @ApiResponse({ status: 200, description: 'Success' })
  @ApiResponse({ status: 400, description: 'Request without API KEY' })
  @ApiResponse({ status: 403, description: 'Invalid API KEY' })
  @ApiResponse({ status: 500, description: 'Server Error' })
  async findAll(@Request() req, @Query() query: DiaryFindDto) {
    return this.diariesService.findAll(req.user.id, query);
  }

  @Post()
  @ApiResponse({ status: 201, description: 'Success' })
  @ApiResponse({ status: 400, description: 'Request without API KEY' })
  @ApiResponse({ status: 403, description: 'Invalid API KEY' })
  @ApiResponse({ status: 500, description: 'Server Error' })
  async create(@Request() req, @Body() body: DiaryCreateDto) {
    return this.diariesService.create(req.user.id, body);
  }

  @Patch(':id')
  @ApiResponse({ status: 200, description: 'Success' })
  @ApiResponse({ status: 400, description: 'Request without API KEY' })
  @ApiResponse({ status: 403, description: 'Invalid API KEY' })
  @ApiResponse({ status: 404, description: 'Diary / User not found' })
  @ApiResponse({ status: 500, description: 'Server Error' })
  async update(
    @Request() req,
    @Param('id') id: string,
    @Body() body: DiaryUpdateDto,
  ) {
    return this.diariesService.update(req.user.id, id, body);
  }

  @Delete(':id')
  @ApiResponse({ status: 200, description: 'Success' })
  @ApiResponse({ status: 400, description: 'Request without API KEY' })
  @ApiResponse({ status: 403, description: 'Invalid API KEY' })
  @ApiResponse({ status: 404, description: 'Diary / User not found' })
  @ApiResponse({ status: 500, description: 'Server Error' })
  async delete(@Request() req, @Param('id') id: string) {
    return this.diariesService.delete(req.user.id, id);
  }
}
