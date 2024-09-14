import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MyHomeController } from './my-home.controller';
import { MyHomeService } from './my-home.service';
import { MyHome, MyHomeSchema } from './schema/my-home.schema';

@Module({
	imports: [MongooseModule.forFeature([{ name: MyHome.name, schema: MyHomeSchema }])],
	controllers: [MyHomeController],
	providers: [MyHomeService],
	exports: [MyHomeService]
})
export class MyHomeModule {}
