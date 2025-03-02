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
import { ItemDto } from './dto/room-items.dto';
import { UpdateItemDto } from './dto/update-items.dto';
import { Types } from 'mongoose';
import { FriendService } from '@src/friend/friend.service';

@ApiBearerAuth()
@UseGuards(ApiGuard, JwtAuthGuard)
@ApiSecurity('api-key')
@Controller('room')
export class RoomController {
	constructor(
		private readonly roomService: RoomService,
		private readonly userService: UserService,
		private readonly friendService: FriendService
	) {}

	@ApiTags('My-Home')
	@Get('my-room')
	@ApiOperation({
		summary: '내 방 조회',
		description: '자신의 방 정보를 조회합니다.'
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
					userId: { type: 'string', example: '507f1f77bcf86cd799439012' },
					items: {
						type: 'object',
						example: [
							{
								name: 'books',
								x: 1.47,
								y: 6,
								zIndex: 1,
								visible: true,
								type: 'hobby',
								_id: '671ceeb19a2b2778abd071b5',
								createdAt: '2024-10-26T13:30:02.988Z',
								updatedAt: '2024-10-26T13:30:02.988Z'
							},
							{
								name: 'movie',
								x: 2.67,
								y: 32.23,
								zIndex: 3,
								visible: true,
								type: 'hobby',
								_id: '671ceeb19a2b2778abd071b6',
								createdAt: '2024-10-26T13:30:02.988Z',
								updatedAt: '2024-10-26T13:30:02.988Z'
							}
						]
					},
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
	@ApiResponse({ status: 200, description: 'Success' })
	@ApiResponse({ status: 400, description: 'Request without API KEY' })
	@ApiResponse({ status: 403, description: 'Invalid API KEY' })
	@ApiResponse({ status: 404, description: 'Room not found' })
	@ApiResponse({ status: 500, description: 'Server Error' })
	async findMyRoom(@Request() req) {
		try {
			if (!req.user?.id) {
				throw new UnauthorizedException('Authentication required');
			}

			return await this.roomService.findByUserId(req.user.id);
		} catch (error) {
			if (error instanceof HttpException) {
				throw error;
			}
			throw new InternalServerErrorException('Failed to retrieve room information');
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
		schema: {
			type: 'array',
			items: {
				type: 'object',
				properties: {
					id: { type: 'string', example: '507f1f77bcf86cd799439011' },
					userId: { type: 'string', example: '507f1f77bcf86cd799439012' },
					items: {
						type: 'object',
						example: [
							{
								name: 'books',
								x: 1.47,
								y: 6,
								zIndex: 1,
								visible: true,
								type: 'hobby',
								_id: '671ceeb19a2b2778abd071b5',
								createdAt: '2024-10-26T13:30:02.988Z',
								updatedAt: '2024-10-26T13:30:02.988Z'
							},
							{
								name: 'movie',
								x: 2.67,
								y: 32.23,
								zIndex: 3,
								visible: true,
								type: 'hobby',
								_id: '671ceeb19a2b2778abd071b6',
								createdAt: '2024-10-26T13:30:02.988Z',
								updatedAt: '2024-10-26T13:30:02.988Z'
							}
						]
					},
					createdAt: {
						type: 'string',
						format: 'date-time',
						example: '2024-10-01T09:00:00.000Z'
					},
					updatedAt: {
						type: 'string',
						format: 'date-time',
						example: '2024-10-01T09:00:00.000Z'
					},
					user: {
						type: 'object',
						example: {
							_id: '66fc12ba54c3c91cb8ff2393',
							email: 'test@test.com',
							name: 'Ethan Kim'
						}
					},
					friendshipStatus: {
						type: 'string',
						example: 'pending'
					}
				}
			}
		}
	})
	@ApiResponse({ status: 200, description: 'Success' })
	@ApiResponse({ status: 400, description: 'Request without API KEY' })
	@ApiResponse({ status: 403, description: 'Invalid API KEY' })
	@ApiResponse({ status: 404, description: 'Room not found' })
	@ApiResponse({ status: 500, description: 'Server Error' })
	async findUserRoom(@Request() req, @Param('userId') userId: string) {
		try {
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
				user: userInfo,
				friendshipStatus: friendshipStatus.status,
				...(friendshipStatus.remainingDays !== undefined && {
					remainingDays: friendshipStatus.remainingDays
				})
			};
		} catch (error) {
			if (error instanceof HttpException) {
				throw error;
			}
			throw new InternalServerErrorException('Failed to retrieve room information');
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
	@ApiResponse({ status: 500, description: 'Server Error' })
	async updateRoom(@Request() req, @Body() updateRoomDto: UpdateRoomDto | UpdateItemDto) {
		return this.roomService.update(req.user.id, updateRoomDto);
	}

	@ApiTags('My-Home')
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
