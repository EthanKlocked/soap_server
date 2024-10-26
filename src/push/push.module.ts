import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PushService } from './push.service';
import { PushController } from './push.controller';
import { DeviceToken, DeviceTokenSchema } from './schema/device-token.schema';

@Module({
	imports: [MongooseModule.forFeature([{ name: DeviceToken.name, schema: DeviceTokenSchema }])],
	controllers: [PushController],
	providers: [PushService],
	exports: [PushService]
})
export class PushModule {}
