import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { FriendController } from '@src/friend/friend.controller';
import { FriendService } from '@src/friend/friend.service';
import { FriendRequest, FriendRequestSchema } from '@src/friend/schema/friendRequest.schema';
import { Friendship, FriendshipSchema } from '@src/friend/schema/friendship.schema';
import { UserModule } from '@src/user/user.module';
import { PushModule } from '@src/push/push.module';
import { MembershipModule } from '@src/membership/membership.module';
import { ThrottleModule } from '@src/throttle/throttle.module';

@Module({
	imports: [
		MongooseModule.forFeature([
			{ name: FriendRequest.name, schema: FriendRequestSchema },
			{ name: Friendship.name, schema: FriendshipSchema }
		]),
		UserModule,
		PushModule,
		MembershipModule,
		ThrottleModule
	],
	controllers: [FriendController],
	providers: [FriendService],
	exports: [FriendService]
})
export class FriendModule {}
