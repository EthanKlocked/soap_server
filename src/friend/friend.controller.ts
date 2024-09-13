import {
	Controller,
	Post,
	Body,
	Get,
	UseGuards,
	Request,
	Param,
	Delete,
	Patch
} from '@nestjs/common';
import { FriendService } from './friend.service';
import { JwtAuthGuard } from '@src/auth/guard/jwt.guard';
import { ApiGuard } from '@src/auth/guard/api.guard';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { FriendRequestDto } from '@src/friend/dto/friend.request.dto';

@UseGuards(ApiGuard, JwtAuthGuard)
@Controller('friend')
@ApiTags('friend')
@ApiBearerAuth()
export class FriendController {
	constructor(private readonly friendService: FriendService) {}

	@Post('request')
	@ApiOperation({ summary: 'Send a friend request' })
	@ApiResponse({ status: 201, description: 'Friend request sent successfully' })
	@ApiResponse({ status: 400, description: 'Bad request' })
	@ApiResponse({ status: 401, description: 'Unauthorized' })
	@ApiResponse({ status: 403, description: 'Forbidden' })
	@ApiResponse({
		status: 409,
		description: 'Conflict: already are friend or request already exists'
	})
	@ApiResponse({ status: 500, description: 'Server Error' })
	async sendFriendRequest(@Request() req, @Body() sendFriendRequestDto: FriendRequestDto) {
		const { receiverId, message } = sendFriendRequestDto;
		return this.friendService.sendFriendRequest(req.user.id, receiverId, message);
	}

	@Patch('request/:requestId/accept')
	@ApiOperation({ summary: 'Accept a friend request' })
	@ApiResponse({ status: 200, description: 'Friend request accepted successfully' })
	@ApiResponse({ status: 400, description: 'Bad request' })
	@ApiResponse({ status: 401, description: 'Unauthorized' })
	@ApiResponse({ status: 403, description: 'Forbidden' })
	@ApiResponse({ status: 404, description: 'Friend request not found' })
	@ApiResponse({ status: 409, description: 'Conflict: already are friend' })
	@ApiResponse({ status: 500, description: 'Server Error' })
	async acceptFriendRequest(@Param('requestId') requestId: string) {
		return this.friendService.acceptFriendRequest(requestId);
	}

	@Patch('request/:requestId/reject')
	@ApiOperation({ summary: 'Reject a friend request' })
	@ApiResponse({ status: 200, description: 'Friend request rejected successfully' })
	@ApiResponse({ status: 400, description: 'Bad request' })
	@ApiResponse({ status: 401, description: 'Unauthorized' })
	@ApiResponse({ status: 403, description: 'Forbidden' })
	@ApiResponse({ status: 404, description: 'Friend request not found' })
	@ApiResponse({ status: 409, description: 'Conflict: already are friend' })
	@ApiResponse({ status: 500, description: 'Server Error' })
	async rejectFriendRequest(@Param('requestId') requestId: string) {
		return this.friendService.rejectFriendRequest(requestId);
	}

	@Delete('request/:requestId')
	@ApiOperation({ summary: 'Delete a friend request' })
	@ApiResponse({ status: 200, description: 'Friend request deleted successfully' })
	@ApiResponse({ status: 400, description: 'Bad request' })
	@ApiResponse({ status: 401, description: 'Unauthorized' })
	@ApiResponse({ status: 403, description: 'Forbidden' })
	@ApiResponse({ status: 404, description: 'Friend request not found' })
	@ApiResponse({ status: 500, description: 'Server Error' })
	async deleteFriendRequest(@Param('requestId') requestId: string) {
		return this.friendService.deleteFriendRequest(requestId);
	}

	@Get('requests')
	@ApiOperation({ summary: 'Get all pending friend requests' })
	@ApiResponse({ status: 200, description: 'Friend requests retrieved successfully' })
	@ApiResponse({ status: 400, description: 'Bad request' })
	@ApiResponse({ status: 401, description: 'Unauthorized' })
	@ApiResponse({ status: 403, description: 'Forbidden' })
	@ApiResponse({ status: 500, description: 'Server Error' })
	async getFriendRequests(@Request() req) {
		return this.friendService.getFriendRequests(req.user.id);
	}

	@Get('list')
	@ApiOperation({ summary: 'Get all friends' })
	@ApiResponse({ status: 200, description: 'Friends list retrieved successfully' })
	@ApiResponse({ status: 400, description: 'Bad request' })
	@ApiResponse({ status: 401, description: 'Unauthorized' })
	@ApiResponse({ status: 403, description: 'Forbidden' })
	@ApiResponse({ status: 500, description: 'Server Error' })
	async getFriends(@Request() req) {
		return this.friendService.getFriends(req.user.id);
	}
}
