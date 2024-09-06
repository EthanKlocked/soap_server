import { Module } from '@nestjs/common';
import { FriendController } from '@src/friend/friend.controller';
import { FriendService } from '@src/friend/friend.service';

@Module({
    controllers: [FriendController],
    providers: [FriendService]
})
export class FriendModule {}
