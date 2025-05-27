import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Room } from './schema/room.schema';
import { UpdateRoomDto } from './dto/room.update.dto';
import { ItemDto } from './dto/room-items.dto';
import { DEFAULT_ROOM_ITEMS } from './room.constants';
import { UpdateItemDto } from './dto/update-items.dto';

@Injectable()
export class RoomService {
	constructor(@InjectModel(Room.name) private roomModel: Model<Room>) {}

	/**
	 * 사용자 ID로 방을 조회하고, 없으면 기본 방을 생성하여 반환
	 */
	async findByUserId(userId: string): Promise<Room> {
		let room = await this.roomModel.findOne({ userId: new Types.ObjectId(userId) });

		if (!room) {
			// 방이 없을 때 기본값으로 새 방 생성 및 저장
			room = new this.roomModel({
				userId: new Types.ObjectId(userId),
				items: DEFAULT_ROOM_ITEMS
			});
			await room.save();
		}

		return room;
	}

	/**
	 * 방 정보를 업데이트하거나 새로 생성
	 */
	async update(userId: string, updateDto: UpdateRoomDto | UpdateItemDto): Promise<Room> {
		let room = await this.roomModel
			.findOne({
				userId: new Types.ObjectId(userId)
			})
			.exec();

		if (!room) {
			room = new this.roomModel({
				userId,
				items: DEFAULT_ROOM_ITEMS
			});
		}

		const updateItem = (item: UpdateItemDto) => {
			if (!item.name) return;

			const index = room.items.findIndex(i => i.name === item.name);
			const updates = Object.fromEntries(
				Object.entries(item).filter(([key, value]) => value !== undefined && key !== '_id')
			);

			if (index === -1) {
				if (!item.x || !item.y || !item.type) {
					throw new BadRequestException('New item requires x, y, and type fields');
				}
				room.items.push({
					...updates,
					visible: item.visible ?? true
				} as ItemDto);
			} else {
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

	/**
	 * 사용자의 방을 삭제
	 */
	async remove(userId: string): Promise<Room> {
		const deletedRoom = await this.roomModel.findOneAndDelete({ userId }).exec();
		if (!deletedRoom) {
			throw new NotFoundException(`Room for user "${userId}" not found`);
		}
		return deletedRoom;
	}
}
