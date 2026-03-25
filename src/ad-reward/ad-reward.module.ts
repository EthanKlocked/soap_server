import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { HttpModule } from '@nestjs/axios';
import { ThrottleModule } from '@src/throttle/throttle.module';
import { AdRewardController } from './ad-reward.controller';
import { AdRewardService } from './ad-reward.service';
import { AdRewardLog, AdRewardLogSchema } from './schema/ad-reward-log.schema';

@Module({
	imports: [
		MongooseModule.forFeature([{ name: AdRewardLog.name, schema: AdRewardLogSchema }]),
		HttpModule,
		ThrottleModule
	],
	controllers: [AdRewardController],
	providers: [AdRewardService],
	exports: [AdRewardService]
})
export class AdRewardModule {}
