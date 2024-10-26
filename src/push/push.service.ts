import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as admin from 'firebase-admin';
import { DeviceToken, DeviceTokenDocument } from './schema/device-token.schema';
import { RegisterTokenDto } from './dto/register-token.dto';
import { SendPushDto } from './dto/send-push.dto';

@Injectable()
export class PushService {
	private readonly logger = new Logger(PushService.name);

	constructor(
		@InjectModel(DeviceToken.name)
		private deviceTokenModel: Model<DeviceTokenDocument>
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

	async sendPushToUser(userId: string, pushDto: SendPushDto) {
		try {
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

	async sendPushToUsers(userIds: string[], pushDto: SendPushDto) {
		try {
			const deviceTokens = await this.deviceTokenModel.find({
				userId: { $in: userIds }
			});

			if (!deviceTokens.length) {
				throw new Error('No device tokens found');
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
				failureCount: response.failureCount
			};
		} catch (error) {
			this.logger.error('Failed to send multicast push:', error);
			throw error;
		}
	}

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
