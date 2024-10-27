import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { RoomController } from './room.controller';
import { RoomService } from './room.service';
import { UserModule } from '@src/user/user.module';
import { FriendModule } from '@src/friend/friend.module';
import { Room, RoomSchema } from './schema/room.schema';

@Module({
	imports: [
		MongooseModule.forFeature([{ name: Room.name, schema: RoomSchema }]),
		UserModule,
		FriendModule
	],
	controllers: [RoomController],
	providers: [RoomService],
	exports: [RoomService]
})
export class RoomModule {}
