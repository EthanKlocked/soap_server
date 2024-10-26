import {
	Body,
	Controller,
	Post,
	UseGuards,
	Get,
	Request,
	Patch,
	Delete,
	Param,
	NotFoundException,
	InternalServerErrorException,
	HttpException,
	BadRequestException
} from '@nestjs/common';
import {
	ApiResponse,
	ApiBearerAuth,
	ApiSecurity,
	ApiOperation,
	ApiParam,
	ApiBody,
	getSchemaPath
} from '@nestjs/swagger';
import { JwtAuthGuard } from '@src/auth/guard/jwt.guard';
import { ApiGuard } from '@src/auth/guard/api.guard';
import { RoomService } from './room.service';
import { CreateRoomDto } from './dto/room.create.dto';
import { UpdateRoomDto } from './dto/room.update.dto';
import { ItemDto } from './dto/room-items.dto';
import { Types } from 'mongoose';

@ApiBearerAuth()
@UseGuards(ApiGuard, JwtAuthGuard)
@ApiSecurity('api-key')
@Controller('room')
export class RoomController {
	constructor(private readonly roomService: RoomService) {}

	@Get(':userId?')
	@ApiOperation({
		summary: '유저의 방 정보 조회',
		description:
			'지정된 userId의 방 정보를 조회합니다. 없을 경우 유저 본인의 방 정보를 조회합니다.'
	})
	@ApiResponse({ status: 200, description: 'Success' })
	@ApiResponse({ status: 400, description: 'Request without API KEY' })
	@ApiResponse({ status: 403, description: 'Invalid API KEY' })
	@ApiResponse({ status: 404, description: 'Room not found' })
	@ApiResponse({ status: 500, description: 'Server Error' })
	@ApiParam({ name: 'userId', required: false, description: 'User ID (optional)' })
	async findRoom(@Request() req, @Param('userId') userId?: string) {
		try {
			const targetUserId = userId || req.user?.id;

			if (!targetUserId) {
				throw new NotFoundException('User ID not provided');
			}

			if (!Types.ObjectId.isValid(targetUserId)) {
				throw new BadRequestException('Invalid User ID format');
			}

			return await this.roomService.findByUserId(targetUserId);
		} catch (error) {
			if (error instanceof HttpException) {
				throw error;
			}
			throw new InternalServerErrorException('Failed to retrieve room information');
		}
	}

	@Post()
	@ApiOperation({
		summary: '방 꾸미기 구현',
		description: '내 방 꾸미기. 현재 로그인한 사용자의 ID가 자동으로 할당됩니다.'
	})
	@ApiBody({
		type: CreateRoomDto
	})
	@ApiResponse({ status: 201, description: 'Success' })
	@ApiResponse({ status: 400, description: 'Request without API KEY' })
	@ApiResponse({ status: 403, description: 'Invalid API KEY' })
	@ApiResponse({ status: 500, description: 'Server Error' })
	async createOrUpdateRoom(@Request() req, @Body() createRoomDto: Omit<CreateRoomDto, 'userId'>) {
		return this.roomService.create(req.user.id, createRoomDto);
	}

	@Patch()
	@ApiOperation({
		summary: '내 방 데이터 수정',
		description: '내 방을 수정할 수 있습니다.'
	})
	@ApiBody({
		description: 'item리스트 혹은 하나의 객체 형태로 보낼 수 있음',
		schema: {
			oneOf: [
				{ $ref: getSchemaPath(ItemDto) },
				{
					type: 'object',
					properties: {
						items: {
							type: 'array',
							items: { $ref: getSchemaPath(ItemDto) }
						}
					}
				}
			]
		}
	})
	@ApiResponse({ status: 200, description: 'Success' })
	@ApiResponse({ status: 400, description: 'Request without API KEY' })
	@ApiResponse({ status: 403, description: 'Invalid API KEY' })
	@ApiResponse({ status: 404, description: 'Room not found' })
	@ApiResponse({ status: 500, description: 'Server Error' })
	async updateRoom(@Request() req, @Body() updateRoomDto: UpdateRoomDto | ItemDto) {
		return this.roomService.update(req.user.id, updateRoomDto);
	}

	@Delete()
	@ApiOperation({
		summary: '내 방 데이터 삭제',
		description: '내 방을 삭제할 수 있습니다.'
	})
	@ApiResponse({ status: 200, description: 'Success' })
	@ApiResponse({ status: 400, description: 'Request without API KEY' })
	@ApiResponse({ status: 403, description: 'Invalid API KEY' })
	@ApiResponse({ status: 404, description: 'Room not found' })
	@ApiResponse({ status: 500, description: 'Server Error' })
	async removeRoom(@Request() req) {
		return this.roomService.remove(req.user.id);
	}
}
