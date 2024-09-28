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
import { ApiResponse, ApiBearerAuth, ApiQuery, ApiSecurity } from '@nestjs/swagger';
import { JwtAuthGuard } from '@src/auth/guard/jwt.guard';
import { ApiGuard } from '@src/auth/guard/api.guard';
import { MyHomeService } from './my-home.service';
import { CreateMyHomeDto } from './dto/my-home.create.dto';
import { UpdateMyHomeDto } from './dto/my-home.update.dto';

@ApiBearerAuth()
@UseGuards(ApiGuard, JwtAuthGuard)
@ApiSecurity('api-key')
@Controller('my-home')
export class MyHomeController {
	constructor(private readonly myHomeService: MyHomeService) {}

	@Get(':id')
	@ApiResponse({ status: 200, description: 'Success' })
	@ApiResponse({ status: 400, description: 'Request without API KEY' })
	@ApiResponse({ status: 403, description: 'Invalid API KEY' })
	@ApiResponse({ status: 404, description: 'MyHome not found' })
	@ApiResponse({ status: 500, description: 'Server Error' })
	async findOne(@Param('id') id: string) {
		return this.myHomeService.findOne(id);
	}

	@Get()
	@ApiResponse({ status: 200, description: 'Success' })
	@ApiResponse({ status: 400, description: 'Request without API KEY' })
	@ApiResponse({ status: 403, description: 'Invalid API KEY' })
	@ApiResponse({ status: 500, description: 'Server Error' })
	@ApiQuery({ name: 'userId', required: false, type: String })
	async findAll(@Query('userId') userId?: string) {
		return this.myHomeService.findAll(userId);
	}

	@Post()
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
