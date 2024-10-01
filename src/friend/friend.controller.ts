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
import { ApiTags, ApiOperation, ApiResponse, ApiSecurity } from '@nestjs/swagger';
import { FriendRequestDto } from '@src/friend/dto/friend.request.dto';

@UseGuards(ApiGuard, JwtAuthGuard)
@Controller('friend')
@ApiTags('friend')
@ApiSecurity('api-key')
@ApiResponse({ status: 400, description: 'Request without API KEY' })
@ApiResponse({ status: 401, description: 'Empty / Invalid token' })
@ApiResponse({ status: 403, description: 'Invalid API KEY' })
@ApiResponse({ status: 410, description: 'Token has expired' })
@ApiResponse({ status: 500, description: 'Server Error' })
export class FriendController {
	constructor(private readonly friendService: FriendService) { }

	@Post('request')
	@ApiOperation({
		summary: 'Send a friend request',
		description: 'Send a friend request to another user'
	})
	@ApiResponse({ status: 201, description: 'Success' })
	@ApiResponse({ status: 400, description: 'Self request error / invalid id format' })
	@ApiResponse({ status: 404, description: 'Receiver user not found' })
	@ApiResponse({
		status: 409,
		description: 'Request already exists (rejected wating or pending)'
	})
	@ApiResponse({ status: 422, description: 'Already are friend' })
	async sendFriendRequest(@Request() req, @Body() sendFriendRequestDto: FriendRequestDto) {
		const { receiverId, message } = sendFriendRequestDto;
		return this.friendService.sendFriendRequest(req.user.id, receiverId, message);
	}

	@Patch('request/:requestId/accept')
	@ApiOperation({
		summary: 'Accept a friend request',
		description: 'Accept a pending friend request'
	})
	@ApiResponse({ status: 200, description: 'Success' })
	@ApiResponse({ status: 404, description: 'Friend request not found' })
	@ApiResponse({ status: 409, description: 'Conflict: not the request you got' })
	@ApiResponse({ status: 422, description: 'Already are friend' })
	async acceptFriendRequest(@Request() req, @Param('requestId') requestId: string) {
		return this.friendService.acceptFriendRequest(req.user.id, requestId);
	}

	@Patch('request/:requestId/reject')
	@ApiOperation({ summary: 'Reject a friend request' })
	@ApiResponse({ status: 200, description: 'Success' })
	@ApiResponse({ status: 404, description: 'Friend request not found' })
	@ApiResponse({ status: 409, description: 'Conflict: not the request you got' })
	@ApiResponse({ status: 422, description: 'Already are friend' })
	async rejectFriendRequest(@Request() req, @Param('requestId') requestId: string) {
		return this.friendService.rejectFriendRequest(req.user.id, requestId);
	}

	@Delete('request/:requestId')
	@ApiOperation({ summary: 'Delete a friend request' })
	@ApiResponse({ status: 200, description: 'Success' })
	@ApiResponse({ status: 404, description: 'Friend request not found' })
	async deleteFriendRequest(@Param('requestId') requestId: string) {
		return this.friendService.deleteFriendRequest(requestId);
	}

	@Get('requests/received')
	@ApiOperation({ summary: 'Get all pending friend requests' })
	@ApiResponse({ status: 200, description: 'Success' })
	async getFriendRequests(@Request() req) {
		return this.friendService.getFriendRequests(req.user.id);
	}

	@Get('requests/sent')
	@ApiOperation({ summary: 'Get all status requests the user sent' })
	@ApiResponse({ status: 200, description: 'Success' })
	async getSentFriendRequests(@Request() req) {
		return this.friendService.getSentFriendRequests(req.user.id);
	}

	@Get('list')
	@ApiOperation({ summary: 'Get all friends' })
	@ApiResponse({ status: 200, description: 'Success' })
	async getFriends(@Request() req) {
		return this.friendService.getFriends(req.user.id);
	}

	@Delete(':friendId')
	@ApiOperation({ summary: 'Unfriend a user' })
	@ApiResponse({ status: 200, description: 'Success' })
	@ApiResponse({ status: 404, description: 'Friend not found' })
	async unfriend(@Request() req, @Param('friendId') friendId: string) {
		await this.friendService.unfriend(req.user.id, friendId);
	}
}
