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
@ApiSecurity('api-key')
@ApiSecurity('x-access-token')
@ApiResponse({ status: 400, description: 'Request without API KEY' })
@ApiResponse({ status: 401, description: 'Empty / Invalid token' })
@ApiResponse({ status: 403, description: 'Invalid API KEY' })
@ApiResponse({ status: 410, description: 'Token has expired' })
@ApiResponse({ status: 500, description: 'Server Error' })
export class FriendController {
	constructor(private readonly friendService: FriendService) {}

	@ApiTags('Friend-Management')
	@Get('list')
	@ApiOperation({
		summary: 'Retrieve friend list',
		description: 'Get a list of all current friends for the authenticated user'
	})
	@ApiResponse({ status: 200, description: 'Success' })
	async getFriends(@Request() req) {
		return this.friendService.getFriends(req.user.id);
	}

	@ApiTags('Friend-Management')
	@Delete(':friendId')
	@ApiOperation({
		summary: 'Remove a friend',
		description: "Remove a specified user from the authenticated user's friend list"
	})
	@ApiResponse({ status: 200, description: 'Success' })
	@ApiResponse({ status: 404, description: 'Friend not found' })
	async unfriend(@Request() req, @Param('friendId') friendId: string) {
		await this.friendService.unfriend(req.user.id, friendId);
	}

	@ApiTags('Friend-Requests')
	@Post('request')
	@ApiOperation({
		summary: 'Send a friend request',
		description: 'Send a friend request to another user with an optional message'
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

	@ApiTags('Friend-Requests')
	@Get('requests/received')
	@ApiOperation({
		summary: 'Get received friend requests',
		description: 'Retrieve all pending friend requests received by the authenticated user'
	})
	@ApiResponse({ status: 200, description: 'Success' })
	async getFriendRequests(@Request() req) {
		return this.friendService.getFriendRequests(req.user.id);
	}

	@ApiTags('Friend-Requests')
	@Get('requests/sent')
	@ApiOperation({
		summary: 'Get sent friend requests',
		description:
			'Retrieve all friend requests sent by the authenticated user, including pending and rejected ones'
	})
	@ApiResponse({ status: 200, description: 'Success' })
	async getSentFriendRequests(@Request() req) {
		return this.friendService.getSentFriendRequests(req.user.id);
	}

	@ApiTags('Friend-Requests')
	@Patch('request/:requestId/accept')
	@ApiOperation({
		summary: 'Accept a friend request',
		description: 'Accept a pending friend request by its ID'
	})
	@ApiResponse({ status: 200, description: 'Success' })
	@ApiResponse({ status: 404, description: 'Friend request not found' })
	@ApiResponse({ status: 409, description: 'Conflict: not the request you got' })
	@ApiResponse({ status: 422, description: 'Already are friend' })
	async acceptFriendRequest(@Request() req, @Param('requestId') requestId: string) {
		return this.friendService.acceptFriendRequest(req.user.id, requestId);
	}

	@ApiTags('Friend-Requests')
	@Patch('request/:requestId/reject')
	@ApiOperation({
		summary: 'Reject a friend request',
		description: 'Reject a pending friend request by its ID'
	})
	@ApiResponse({ status: 200, description: 'Success' })
	@ApiResponse({ status: 404, description: 'Friend request not found' })
	@ApiResponse({ status: 409, description: 'Conflict: not the request you got' })
	@ApiResponse({ status: 422, description: 'Already are friend' })
	async rejectFriendRequest(@Request() req, @Param('requestId') requestId: string) {
		return this.friendService.rejectFriendRequest(req.user.id, requestId);
	}

	@ApiTags('Friend-Requests')
	@Delete('request/:requestId')
	@ApiOperation({
		summary: 'Delete a friend request',
		description: 'Delete a friend request by its ID (for testing purposes only)'
	})
	@ApiResponse({ status: 200, description: 'Success' })
	@ApiResponse({ status: 404, description: 'Friend request not found' })
	async deleteFriendRequest(@Param('requestId') requestId: string) {
		return this.friendService.deleteFriendRequest(requestId);
	}
}
