import {
	Body,
	Controller,
	UseGuards,
	Get,
	Request,
	Patch,
	Delete,
	Param,
	InternalServerErrorException,
	HttpException,
	BadRequestException,
	UnauthorizedException
} from '@nestjs/common';
import {
	ApiResponse,
	ApiBearerAuth,
	ApiSecurity,
	ApiOperation,
	ApiBody,
	getSchemaPath,
	ApiTags
} from '@nestjs/swagger';
import { JwtAuthGuard } from '@src/auth/guard/jwt.guard';
import { ApiGuard } from '@src/auth/guard/api.guard';
import { RoomService } from './room.service';
import { UserService } from '@src/user/user.service';
import { UpdateRoomDto } from './dto/room.update.dto';
import { UpdateItemDto } from './dto/update-items.dto';
import { RoomResponseDto, UserRoomResponseDto } from './dto/common-response.dto';
import { Types } from 'mongoose';
import { FriendService } from '@src/friend/friend.service';

@ApiBearerAuth()
@UseGuards(ApiGuard, JwtAuthGuard)
@ApiSecurity('api-key')
@ApiSecurity('x-access-token')
@Controller('room')
export class RoomController {
	constructor(
		private readonly roomService: RoomService,
		private readonly userService: UserService,
		private readonly friendService: FriendService
	) {}

	/**
	 * 공통 에러 처리 메서드
	 */
	private handleError(error: any, defaultMessage: string): never {
		if (error instanceof HttpException) {
			throw error;
		}
		throw new InternalServerErrorException(defaultMessage);
	}

	/**
	 * 사용자 인증 확인
	 */
	private validateUser(req: any): void {
		if (!req.user?.id) {
			throw new UnauthorizedException('Authentication required');
		}
	}

	@ApiTags('My-Home')
	@Get('my-room')
	@ApiOperation({
		summary: '내 방 조회',
		description: '자신의 방 정보를 조회합니다.'
	})
	@ApiResponse({
		status: 200,
		description: 'Success',
		type: RoomResponseDto
	})
	@ApiResponse({ status: 400, description: 'Request without API KEY' })
	@ApiResponse({ status: 403, description: 'Invalid API KEY' })
	@ApiResponse({ status: 404, description: 'Room not found' })
	@ApiResponse({ status: 500, description: 'Server Error' })
	async findMyRoom(@Request() req): Promise<any> {
		try {
			this.validateUser(req);
			return await this.roomService.findByUserId(req.user.id);
		} catch (error) {
			this.handleError(error, 'Failed to retrieve room information');
		}
	}

	@ApiTags('My-Home')
	@Get(':userId')
	@ApiOperation({
		summary: '다른 사람의 방 조회',
		description: '다른 사람의 방 정보를 조회합니다.'
	})
	@ApiResponse({
		status: 200,
		description: 'Success',
		type: UserRoomResponseDto
	})
	@ApiResponse({ status: 400, description: 'Request without API KEY' })
	@ApiResponse({ status: 403, description: 'Invalid API KEY' })
	@ApiResponse({ status: 404, description: 'Room not found' })
	@ApiResponse({ status: 500, description: 'Server Error' })
	async findUserRoom(@Request() req, @Param('userId') userId: string): Promise<any> {
		try {
			this.validateUser(req);

			if (!Types.ObjectId.isValid(userId)) {
				throw new BadRequestException('Invalid User ID format');
			}

			// 자신의 방을 조회하려는 경우 리다이렉트
			if (userId === req.user.id) {
				return this.findMyRoom(req);
			}

			const [room, userInfo, friendshipStatus] = await Promise.all([
				this.roomService.findByUserId(userId),
				this.userService.findProfile(userId),
				this.friendService.getFriendshipStatus(req.user.id, userId)
			]);

			return {
				...room.toObject(),
				user: {
					_id: userInfo.id,
					email: userInfo.email,
					name: userInfo.name
				},
				friendshipStatus: friendshipStatus.status,
				...(friendshipStatus.remainingDays !== undefined && {
					remainingDays: friendshipStatus.remainingDays
				})
			};
		} catch (error) {
			this.handleError(error, 'Failed to retrieve room information');
		}
	}

	@ApiTags('My-Home')
	@Patch()
	@ApiOperation({
		summary: '내 방 데이터 수정',
		description: '내 방을 수정할 수 있습니다.'
	})
	@ApiBody({
		description: 'item리스트 혹은 하나의 객체 형태로 보낼 수 있음',
		schema: {
			oneOf: [{ $ref: getSchemaPath(UpdateItemDto) }, { $ref: getSchemaPath(UpdateRoomDto) }]
		}
	})
	@ApiResponse({ status: 200, description: 'Success', type: RoomResponseDto })
	@ApiResponse({ status: 400, description: 'Request without API KEY' })
	@ApiResponse({ status: 403, description: 'Invalid API KEY' })
	@ApiResponse({ status: 500, description: 'Server Error' })
	async updateRoom(
		@Request() req,
		@Body() updateRoomDto: UpdateRoomDto | UpdateItemDto
	): Promise<any> {
		try {
			this.validateUser(req);
			return await this.roomService.update(req.user.id, updateRoomDto);
		} catch (error) {
			this.handleError(error, 'Failed to update room');
		}
	}

	@ApiTags('My-Home')
	@Delete()
	@ApiOperation({
		summary: '내 방 데이터 삭제',
		description: '내 방을 삭제할 수 있습니다.'
	})
	@ApiResponse({ status: 200, description: 'Success', type: RoomResponseDto })
	@ApiResponse({ status: 400, description: 'Request without API KEY' })
	@ApiResponse({ status: 403, description: 'Invalid API KEY' })
	@ApiResponse({ status: 404, description: 'Room not found' })
	@ApiResponse({ status: 500, description: 'Server Error' })
	async removeRoom(@Request() req): Promise<any> {
		try {
			this.validateUser(req);
			return await this.roomService.remove(req.user.id);
		} catch (error) {
			this.handleError(error, 'Failed to delete room');
		}
	}
}
