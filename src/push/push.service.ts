import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as admin from 'firebase-admin';
import { DeviceToken, DeviceTokenDocument } from './schema/device-token.schema';
import {
	NotificationSetting,
	NotificationSettingDocument
} from './schema/notification-setting.schema';
import { RegisterTokenDto } from './dto/register-token.dto';
import { SendPushDto } from './dto/send-push.dto';
import { UpdateNotificationSettingDto } from './dto/notification-setting.dto';
import { TestPushDto } from './dto/test-push.dto';

@Injectable()
export class PushService {
	private readonly logger = new Logger(PushService.name);

	constructor(
		@InjectModel(DeviceToken.name)
		private deviceTokenModel: Model<DeviceTokenDocument>,
		@InjectModel(NotificationSetting.name)
		private notificationSettingModel: Model<NotificationSettingDocument>
	) {
		// Firebase Admin SDK 초기화
		if (!admin.apps.length) {
			admin.initializeApp({
				credential: admin.credential.cert({
					projectId: process.env.FIREBASE_PROJECT_ID,
					clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
					privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
				})
			});
		}
	}

	/**
	 * FCM 토큰 등록
	 */
	async registerToken(registerTokenDto: RegisterTokenDto) {
		try {
			const { userId, deviceToken, deviceType } = registerTokenDto;

			await this.deviceTokenModel.findOneAndUpdate(
				{ userId },
				{
					userId,
					deviceToken,
					deviceType
				},
				{ upsert: true, new: true }
			);

			return { success: true, message: 'Token registered successfully' };
		} catch (error) {
			this.logger.error('Token registration failed:', error);
			throw error;
		}
	}

	/**
	 * 알림 설정 조회 (없으면 기본값으로 생성)
	 */
	async getNotificationSetting(userId: string) {
		try {
			let setting = await this.notificationSettingModel.findOne({ userId });

			if (!setting) {
				setting = await this.notificationSettingModel.create({
					userId,
					isEnabled: true
				});
			}

			return setting;
		} catch (error) {
			this.logger.error(`Failed to get notification setting for user ${userId}:`, error);
			throw error;
		}
	}

	/**
	 * 알림 설정 업데이트
	 */
	async updateNotificationSetting(userId: string, updateDto: UpdateNotificationSettingDto) {
		try {
			const setting = await this.notificationSettingModel.findOneAndUpdate(
				{ userId },
				{ ...updateDto },
				{ upsert: true, new: true }
			);

			return setting;
		} catch (error) {
			this.logger.error(`Failed to update notification setting for user ${userId}:`, error);
			throw error;
		}
	}

	/**
	 * 테스트 푸시 알림 전송 (현재 사용자에게)
	 */
	async sendTestPush(userId: string, testPushDto?: TestPushDto) {
		try {
			// 알림 설정 확인
			const notificationSetting = await this.getNotificationSetting(userId);

			const result = {
				userId,
				notificationEnabled: notificationSetting.isEnabled,
				deviceTokenExists: false,
				pushSent: false,
				message: '',
				messageId: null as string | null
			};

			if (!notificationSetting.isEnabled) {
				result.message = '사용자가 알림을 비활성화했습니다. 푸시가 전송되지 않았습니다.';
				return result;
			}

			const deviceToken = await this.deviceTokenModel.findOne({ userId });

			if (!deviceToken) {
				result.message = 'FCM 토큰이 등록되지 않았습니다. 먼저 토큰을 등록해주세요.';
				return result;
			}

			result.deviceTokenExists = true;

			// 기본 메시지 설정
			const title = testPushDto?.title || '🔔 테스트 알림';
			const body = testPushDto?.body || '알림 설정이 정상적으로 작동하고 있습니다!';

			const message: admin.messaging.Message = {
				notification: {
					title,
					body
				},
				data: {
					type: 'test',
					timestamp: new Date().toISOString()
				},
				token: deviceToken.deviceToken
			};

			const response = await admin.messaging().send(message);

			result.pushSent = true;
			result.messageId = response;
			result.message = '테스트 푸시 알림이 성공적으로 전송되었습니다!';

			return result;
		} catch (error) {
			this.logger.error(`Failed to send test push to user ${userId}:`, error);

			return {
				userId,
				notificationEnabled: false,
				deviceTokenExists: false,
				pushSent: false,
				message: `테스트 푸시 전송 실패: ${error.message}`,
				messageId: null,
				error: error.message
			};
		}
	}

	/**
	 * 특정 사용자에게 푸시 전송 (알림 설정 확인)
	 */
	async sendPushToUser(userId: string, pushDto: SendPushDto) {
		try {
			// 알림 설정 확인
			const notificationSetting = await this.getNotificationSetting(userId);
			if (!notificationSetting.isEnabled) {
				return { success: false, message: 'User has disabled notifications' };
			}

			const deviceToken = await this.deviceTokenModel.findOne({ userId });

			if (!deviceToken) {
				throw new Error(`No device token found for user ${userId}`);
			}

			const message: admin.messaging.Message = {
				notification: {
					title: pushDto.title,
					body: pushDto.body
				},
				data: pushDto.data,
				token: deviceToken.deviceToken
			};

			const response = await admin.messaging().send(message);
			return { success: true, messageId: response };
		} catch (error) {
			this.logger.error(`Failed to send push to user ${userId}:`, error);
			throw error;
		}
	}

	/**
	 * 여러 사용자에게 푸시 전송 (알림 설정 확인)
	 */
	async sendPushToUsers(userIds: string[], pushDto: SendPushDto) {
		try {
			// 알림이 활성화된 사용자들만 필터링
			const enabledUsers = await this.notificationSettingModel.find({
				userId: { $in: userIds },
				isEnabled: true
			});

			const enabledUserIds = enabledUsers.map(setting => setting.userId);

			if (!enabledUserIds.length) {
				return { success: false, message: 'No users with enabled notifications found' };
			}

			const deviceTokens = await this.deviceTokenModel.find({
				userId: { $in: enabledUserIds }
			});

			if (!deviceTokens.length) {
				throw new Error('No device tokens found for enabled users');
			}

			const message: admin.messaging.MulticastMessage = {
				notification: {
					title: pushDto.title,
					body: pushDto.body
				},
				data: pushDto.data,
				tokens: deviceTokens.map(token => token.deviceToken)
			};

			const response = await admin.messaging().sendMulticast(message);
			return {
				success: true,
				successCount: response.successCount,
				failureCount: response.failureCount,
				enabledUsersCount: enabledUserIds.length,
				totalUsersCount: userIds.length
			};
		} catch (error) {
			this.logger.error('Failed to send multicast push:', error);
			throw error;
		}
	}

	/**
	 * FCM 토큰 삭제 (거의 사용하지 않을 예정)
	 */
	async removeToken(userId: string) {
		try {
			await this.deviceTokenModel.deleteOne({ userId });
			return { success: true, message: 'Token removed successfully' };
		} catch (error) {
			this.logger.error('Token removal failed:', error);
			throw error;
		}
	}
}
