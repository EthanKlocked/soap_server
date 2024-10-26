import { Controller, Post, Body, Param, Delete } from '@nestjs/common';
import { PushService } from './push.service';
import { RegisterTokenDto } from './dto/register-token.dto';
import { SendPushDto } from './dto/send-push.dto';
import { ApiResponse } from '@nestjs/swagger';

@Controller('push')
export class PushController {
	constructor(private readonly pushService: PushService) {}

	@Post('token')
	@ApiResponse({ status: 201, description: 'Success' })
	@ApiResponse({ status: 400, description: 'Request without API KEY' })
	@ApiResponse({ status: 403, description: 'Invalid API KEY' })
	@ApiResponse({ status: 500, description: 'Server Error' })
	registerToken(@Body() registerTokenDto: RegisterTokenDto) {
		return this.pushService.registerToken(registerTokenDto);
	}

	@Post('send/:userId')
	@ApiResponse({ status: 201, description: 'Success' })
	@ApiResponse({ status: 400, description: 'Request without API KEY' })
	@ApiResponse({ status: 403, description: 'Invalid API KEY' })
	@ApiResponse({ status: 500, description: 'Server Error' })
	sendPushToUser(@Param('userId') userId: string, @Body() sendPushDto: SendPushDto) {
		return this.pushService.sendPushToUser(userId, sendPushDto);
	}

	@Post('send-multiple')
	@ApiResponse({ status: 201, description: 'Success' })
	@ApiResponse({ status: 400, description: 'Request without API KEY' })
	@ApiResponse({ status: 403, description: 'Invalid API KEY' })
	@ApiResponse({ status: 500, description: 'Server Error' })
	sendPushToUsers(@Body('userIds') userIds: string[], @Body('push') sendPushDto: SendPushDto) {
		return this.pushService.sendPushToUsers(userIds, sendPushDto);
	}

	@Delete('token/:userId')
	@ApiResponse({ status: 201, description: 'Success' })
	@ApiResponse({ status: 400, description: 'Request without API KEY' })
	@ApiResponse({ status: 403, description: 'Invalid API KEY' })
	@ApiResponse({ status: 500, description: 'Server Error' })
	removeToken(@Param('userId') userId: string) {
		return this.pushService.removeToken(userId);
	}
}
