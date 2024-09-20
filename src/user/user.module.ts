import { Module } from '@nestjs/common';
import { UserController } from '@src/user/user.controller';
import { UserService } from '@src/user/user.service';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from '@src/user/schema/user.schema';
import { BlockedUser, BlockedUserSchema } from '@src/user/schema/blockedUser.schema';
import { Friendship, FriendshipSchema } from '@src/friend/schema/friendship.schema';
import { FriendRequest, FriendRequestSchema } from '@src/friend/schema/friendRequest.schema';
import { Diary, DiarySchema } from '@src/diary/schema/diary.schema';
import { DiaryAnalysis, DiaryAnalysisSchema } from '@src/diary/schema/diaryAnalysis.schema';
import { EmailModule } from '@src/email/email.module';

@Module({
	imports: [
		MongooseModule.forFeature([
			{ name: User.name, schema: UserSchema },
			{ name: BlockedUser.name, schema: BlockedUserSchema },
			{ name: FriendRequest.name, schema: FriendRequestSchema },
			{ name: Friendship.name, schema: FriendshipSchema },
			{ name: Diary.name, schema: DiarySchema },
			{ name: DiaryAnalysis.name, schema: DiaryAnalysisSchema }
		]),
		EmailModule
	],
	controllers: [UserController],
	providers: [UserService],
	exports: [
		UserService,
		MongooseModule.forFeature([{ name: BlockedUser.name, schema: BlockedUserSchema }])
	]
})
export class UserModule {}
