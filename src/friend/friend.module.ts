import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { FriendController } from '@src/friend/friend.controller';
import { FriendService } from '@src/friend/friend.service';
import { FriendRequest, FriendRequestSchema } from '@src/friend/schema/friendRequest.schema';
import { Friendship, FriendshipSchema } from '@src/friend/schema/friendship.schema';


@Module({
  imports: [
    MongooseModule.forFeature([
      { name: FriendRequest.name, schema: FriendRequestSchema },
      { name: Friendship.name, schema: FriendshipSchema },
    ]),
  ],
  controllers: [FriendController],
  providers: [FriendService],
  exports: [FriendService],
})
export class FriendModule {}