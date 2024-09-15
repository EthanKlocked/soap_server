import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { RoomController } from './room.controller';
import { RoomService } from './room.service';
import { Room, RoomSchema } from './schema/room.schema';

@Module({
	imports: [MongooseModule.forFeature([{ name: Room.name, schema: RoomSchema }])],
	controllers: [RoomController],
	providers: [RoomService],
	exports: [RoomService]
})
export class RoomModule {}
