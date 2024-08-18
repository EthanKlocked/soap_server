import {
  Body,
  Controller,
  Post,
  UseGuards,
  Get,
  Request,
  Query,
  Param,
} from '@nestjs/common';
import { ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '@src/auth/guard/jwt.guard';
import { DiaryService } from './diary.service';
import { CreateDiaryDto } from './dto/create-diary.dto';

@Controller('diary')
@UseGuards(JwtAuthGuard)
export class DiaryController {
  constructor(private readonly diariesService: DiaryService) {}

  @Post()
  @ApiResponse({ status: 201, description: 'Success' })
  @ApiResponse({ status: 400, description: 'Request without API KEY' })
  @ApiResponse({ status: 501, description: 'Server Error' })
  async create(@Request() req, @Body() createDiaryDto: CreateDiaryDto) {
    return this.diariesService.create(req.user.id, createDiaryDto);
  }

  @Get()
  @ApiResponse({ status: 200, description: 'Success' })
  @ApiResponse({ status: 501, description: 'Server Error' })
  async findAll(
    @Request() req,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
    return this.diariesService.findAll(req.user.id, page, limit);
  }

  @Get('monthly')
  @ApiResponse({ status: 200, description: 'Success' })
  @ApiResponse({ status: 501, description: 'Server Error' })
  async findMonthly(
    @Request() req,
    @Query('year') year: number,
    @Query('month') month: number,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
    return this.diariesService.findMonthly(
      req.user.id,
      year,
      month,
      page,
      limit,
    );
  }

  @Get(':id')
  @ApiResponse({ status: 200, description: 'Success' })
  @ApiResponse({ status: 501, description: 'Server Error' })
  async findOne(@Request() req, @Param('id') id: string) {
    return this.diariesService.findOne(req.user.id, id);
  }
}
