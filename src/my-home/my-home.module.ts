import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MyHomeController } from './my-home.controller';
import { MyHomeService } from './my-home.service';
import { MyHome, MyHomeSchema } from './schema/my-home.schema';
import { MembershipModule } from '@src/membership/membership.module';

@Module({
	imports: [
		MongooseModule.forFeature([{ name: MyHome.name, schema: MyHomeSchema }]),
		MembershipModule
	],
	controllers: [MyHomeController],
	providers: [MyHomeService],
	exports: [MyHomeService]
})
export class MyHomeModule {}
