import {
	Body,
	Controller,
	Post,
	UseGuards,
	Get,
	Request,
	Patch,
	Delete,
	Param
} from '@nestjs/common';
import { ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '@src/auth/guard/jwt.guard';
import { ApiGuard } from '@src/auth/guard/api.guard';
import { RoomService } from './room.service';
import { CreateRoomDto } from './dto/room.create.dto';
import { UpdateRoomDto } from './dto/room.update.dto';
import { ItemDto } from './dto/room-items.dto';

@ApiBearerAuth()
@UseGuards(ApiGuard, JwtAuthGuard)
@Controller('room')
export class RoomController {
	constructor(private readonly roomService: RoomService) {}

	@Get()
	@ApiResponse({ status: 200, description: 'Success' })
	@ApiResponse({ status: 400, description: 'Request without API KEY' })
	@ApiResponse({ status: 403, description: 'Invalid API KEY' })
	@ApiResponse({ status: 404, description: 'Room not found' })
	@ApiResponse({ status: 500, description: 'Server Error' })
	async findRoom(@Request() req) {
		return this.roomService.findByUserId(req.user.id);
	}

	@Post()
	@ApiResponse({ status: 201, description: 'Success' })
	@ApiResponse({ status: 400, description: 'Request without API KEY' })
	@ApiResponse({ status: 403, description: 'Invalid API KEY' })
	@ApiResponse({ status: 500, description: 'Server Error' })
	async createOrUpdateRoom(@Request() req, @Body() createRoomDto: CreateRoomDto) {
		return this.roomService.create(req.user.id, createRoomDto);
	}

	@Patch()
	@ApiResponse({ status: 200, description: 'Success' })
	@ApiResponse({ status: 400, description: 'Request without API KEY' })
	@ApiResponse({ status: 403, description: 'Invalid API KEY' })
	@ApiResponse({ status: 404, description: 'Room not found' })
	@ApiResponse({ status: 500, description: 'Server Error' })
	async updateRoom(@Request() req, @Body() updateRoomDto: UpdateRoomDto) {
		return this.roomService.update(req.user.id, updateRoomDto);
	}

	@Delete()
	@ApiResponse({ status: 200, description: 'Success' })
	@ApiResponse({ status: 400, description: 'Request without API KEY' })
	@ApiResponse({ status: 403, description: 'Invalid API KEY' })
	@ApiResponse({ status: 404, description: 'Room not found' })
	@ApiResponse({ status: 500, description: 'Server Error' })
	async removeRoom(@Request() req) {
		return this.roomService.remove(req.user.id);
	}

	@Post('items')
	@ApiResponse({ status: 201, description: 'Success' })
	@ApiResponse({ status: 400, description: 'Request without API KEY' })
	@ApiResponse({ status: 403, description: 'Invalid API KEY' })
	@ApiResponse({ status: 404, description: 'Room not found' })
	@ApiResponse({ status: 500, description: 'Server Error' })
	async addItem(@Request() req, @Body() itemDto: ItemDto) {
		return this.roomService.addItem(req.user.id, itemDto);
	}

	@Patch('items/:itemId')
	@ApiResponse({ status: 200, description: 'Success' })
	@ApiResponse({ status: 400, description: 'Request without API KEY' })
	@ApiResponse({ status: 403, description: 'Invalid API KEY' })
	@ApiResponse({ status: 404, description: 'Room or Item not found' })
	@ApiResponse({ status: 500, description: 'Server Error' })
	async updateItem(@Request() req, @Body() itemDto: ItemDto, @Param('itemId') itemId: string) {
		return this.roomService.updateItem(req.user.id, itemId, itemDto);
	}

	@Delete('items/:itemId')
	@ApiResponse({ status: 200, description: 'Success' })
	@ApiResponse({ status: 400, description: 'Request without API KEY' })
	@ApiResponse({ status: 403, description: 'Invalid API KEY' })
	@ApiResponse({ status: 404, description: 'Room or Item not found' })
	@ApiResponse({ status: 500, description: 'Server Error' })
	async removeItem(@Request() req, @Param('itemId') itemId: string) {
		return this.roomService.removeItem(req.user.id, itemId);
	}
}
