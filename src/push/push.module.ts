import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PushController } from './push.controller';
import { PushService } from './push.service';
import { DeviceToken, DeviceTokenSchema } from './schema/device-token.schema';
import {
	NotificationSetting,
	NotificationSettingSchema
} from './schema/notification-setting.schema';

@Module({
	imports: [
		MongooseModule.forFeature([
			{ name: DeviceToken.name, schema: DeviceTokenSchema },
			{ name: NotificationSetting.name, schema: NotificationSettingSchema }
		])
	],
	controllers: [PushController],
	providers: [PushService],
	exports: [PushService]
})
export class PushModule {}
