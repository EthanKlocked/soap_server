import {
	Controller,
	Post,
	Body,
	Param,
	Delete,
	Get,
	Patch,
	UseGuards,
	Request
} from '@nestjs/common';
import { PushService } from './push.service';
import { RegisterTokenDto } from './dto/register-token.dto';
import { SendPushDto } from './dto/send-push.dto';
import {
	UpdateNotificationSettingDto,
	NotificationSettingResponseDto
} from './dto/notification-setting.dto';
import { TestPushDto } from './dto/test-push.dto';
import { ApiResponse, ApiTags, ApiOperation, ApiBearerAuth, ApiSecurity } from '@nestjs/swagger';
import { JwtAuthGuard } from '@src/auth/guard/jwt.guard';
import { ApiGuard } from '@src/auth/guard/api.guard';

@ApiBearerAuth()
@UseGuards(ApiGuard, JwtAuthGuard)
@ApiSecurity('api-key')
@ApiSecurity('x-access-token')
@ApiTags('Push')
@Controller('push')
export class PushController {
	constructor(private readonly pushService: PushService) {}

	@Post('token')
	@ApiOperation({
		summary: 'FCM 토큰 등록',
		description:
			'사용자의 FCM 토큰을 등록합니다. 사용자 ID는 현재 로그인한 사용자로 자동 설정됩니다.'
	})
	@ApiResponse({ status: 201, description: 'Success' })
	@ApiResponse({ status: 400, description: 'Request without API KEY' })
	@ApiResponse({ status: 403, description: 'Invalid API KEY' })
	@ApiResponse({ status: 500, description: 'Server Error' })
	registerToken(@Request() req, @Body() registerTokenDto: RegisterTokenDto) {
		// 현재 로그인한 사용자의 ID를 자동으로 설정
		const tokenData = {
			...registerTokenDto,
			userId: req.user.id
		};
		return this.pushService.registerToken(tokenData);
	}

	@Get('notification-setting')
	@ApiOperation({
		summary: '알림 설정 조회',
		description: '사용자의 알림 설정을 조회합니다.'
	})
	@ApiResponse({
		status: 200,
		description: 'Success',
		type: NotificationSettingResponseDto
	})
	@ApiResponse({ status: 400, description: 'Request without API KEY' })
	@ApiResponse({ status: 403, description: 'Invalid API KEY' })
	@ApiResponse({ status: 500, description: 'Server Error' })
	async getNotificationSetting(@Request() req): Promise<any> {
		return this.pushService.getNotificationSetting(req.user.id);
	}

	@Patch('notification-setting')
	@ApiOperation({
		summary: '알림 설정 업데이트',
		description: '사용자의 알림 설정을 업데이트합니다.'
	})
	@ApiResponse({
		status: 200,
		description: 'Success',
		type: NotificationSettingResponseDto
	})
	@ApiResponse({ status: 400, description: 'Request without API KEY' })
	@ApiResponse({ status: 403, description: 'Invalid API KEY' })
	@ApiResponse({ status: 500, description: 'Server Error' })
	async updateNotificationSetting(
		@Request() req,
		@Body() updateDto: UpdateNotificationSettingDto
	): Promise<any> {
		return this.pushService.updateNotificationSetting(req.user.id, updateDto);
	}

	@Post('test')
	@ApiOperation({
		summary: '테스트 푸시 알림 전송',
		description:
			'현재 로그인한 사용자에게 테스트 푸시 알림을 전송합니다. 알림 설정이 비활성화되어 있거나 FCM 토큰이 등록되지 않은 경우 전송되지 않습니다.'
	})
	@ApiResponse({
		status: 201,
		description: 'Success',
		schema: {
			type: 'object',
			properties: {
				userId: { type: 'string', example: '507f1f77bcf86cd799439011' },
				notificationEnabled: { type: 'boolean', example: true },
				deviceTokenExists: { type: 'boolean', example: true },
				pushSent: { type: 'boolean', example: true },
				message: {
					type: 'string',
					example: '테스트 푸시 알림이 성공적으로 전송되었습니다!'
				},
				messageId: { type: 'string', example: 'projects/myproject/messages/0:1234567890' }
			}
		}
	})
	@ApiResponse({ status: 400, description: 'Request without API KEY' })
	@ApiResponse({ status: 403, description: 'Invalid API KEY' })
	@ApiResponse({ status: 500, description: 'Server Error' })
	sendTestPush(@Request() req, @Body() testPushDto?: TestPushDto) {
		return this.pushService.sendTestPush(req.user.id, testPushDto);
	}

	@Post('send/:userId')
	@ApiOperation({
		summary: '특정 사용자에게 푸시 전송',
		description: '특정 사용자에게 푸시 알림을 전송합니다. (알림 설정 확인)'
	})
	@ApiResponse({ status: 201, description: 'Success' })
	@ApiResponse({ status: 400, description: 'Request without API KEY' })
	@ApiResponse({ status: 403, description: 'Invalid API KEY' })
	@ApiResponse({ status: 500, description: 'Server Error' })
	sendPushToUser(@Param('userId') userId: string, @Body() sendPushDto: SendPushDto) {
		return this.pushService.sendPushToUser(userId, sendPushDto);
	}

	@Post('send-multiple')
	@ApiOperation({
		summary: '여러 사용자에게 푸시 전송',
		description: '여러 사용자에게 푸시 알림을 전송합니다. (알림 설정 확인)'
	})
	@ApiResponse({ status: 201, description: 'Success' })
	@ApiResponse({ status: 400, description: 'Request without API KEY' })
	@ApiResponse({ status: 403, description: 'Invalid API KEY' })
	@ApiResponse({ status: 500, description: 'Server Error' })
	sendPushToUsers(@Body('userIds') userIds: string[], @Body('push') sendPushDto: SendPushDto) {
		return this.pushService.sendPushToUsers(userIds, sendPushDto);
	}

	@Delete('token/:userId')
	@ApiOperation({
		summary: 'FCM 토큰 삭제',
		description: 'FCM 토큰을 삭제합니다. (거의 사용하지 않음)'
	})
	@ApiResponse({ status: 200, description: 'Success' })
	@ApiResponse({ status: 400, description: 'Request without API KEY' })
	@ApiResponse({ status: 403, description: 'Invalid API KEY' })
	@ApiResponse({ status: 500, description: 'Server Error' })
	removeToken(@Param('userId') userId: string) {
		return this.pushService.removeToken(userId);
	}
}
