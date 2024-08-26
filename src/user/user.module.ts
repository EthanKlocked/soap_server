import { Module } from '@nestjs/common';
import { UserController } from '@src/user/user.controller';
import { UserService } from '@src/user/user.service';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from '@src/user/schema/user.schema';
import { EmailModule } from '@src/email/email.module';


@Module({
	imports : [
		MongooseModule.forFeature([{ name : User.name, schema : UserSchema}]),
		EmailModule
	],
	controllers: [UserController],
	providers: [UserService],
	exports: [UserService]
})
export class UserModule {}