import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Room } from './schema/room.schema';
import { CreateRoomDto } from './dto/room.create.dto';
import { UpdateRoomDto } from './dto/room.update.dto';
import { ItemDto } from './dto/room-items.dto';
import { DEFAULT_ROOM_ITEMS } from './room.constants';
import { UpdateItemDto } from './dto/update-items.dto';

@Injectable()
export class RoomService {
	constructor(@InjectModel(Room.name) private roomModel: Model<Room>) {}

	async create(userId: string, createRoomDto: Omit<CreateRoomDto, 'userId'>): Promise<Room> {
		return this.roomModel
			.findOneAndUpdate({ userId }, { ...createRoomDto, userId }, { new: true, upsert: true })
			.exec();
	}

	async findByUserId(userId: string) {
		const room = await this.roomModel.findOne({ userId: new Types.ObjectId(userId) });

		if (!room) {
			// 방이 없을 때 기본값 리턴
			return new this.roomModel({
				userId: new Types.ObjectId(userId),
				items: DEFAULT_ROOM_ITEMS
			});
		}

		return room;
	}

	async update(userId: string, updateDto: UpdateRoomDto | UpdateItemDto): Promise<Room> {
		const room = await this.roomModel.findOne({ userId }).exec();
		if (!room) throw new NotFoundException(`Room not found`);

		const updateItem = (item: UpdateItemDto) => {
			if (!item.name) return;

			const index = room.items.findIndex(i => i.name === item.name);
			// undefined 필드는 제외하고 업데이트할 필드만 추출
			const updates = Object.fromEntries(
				Object.entries(item).filter(([key, value]) => value !== undefined && key !== '_id') // _id 제외
			);

			if (index === -1) {
				// 새 아이템
				if (!item.x || !item.y || !item.type) {
					throw new BadRequestException('New item requires x, y, and type fields');
				}
				room.items.push({
					...updates,
					visible: item.visible ?? true
				} as ItemDto);
			} else {
				// type 필드가 없으면 기존 type 유지
				if (!updates.type) {
					updates.type = room.items[index].type;
				}

				room.items[index] = {
					...room.items[index],
					...updates
				};
			}
		};

		('items' in updateDto ? updateDto.items : [updateDto])?.forEach(updateItem);

		return room.save();
	}

	async remove(userId: string): Promise<Room> {
		const deletedRoom = await this.roomModel.findOneAndDelete({ userId }).exec();
		if (!deletedRoom) {
			throw new NotFoundException(`Room for user "${userId}" not found`);
		}
		return deletedRoom;
	}
}
