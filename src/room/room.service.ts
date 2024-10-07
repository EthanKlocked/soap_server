import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Room } from './schema/room.schema';
import { CreateRoomDto } from './dto/room.create.dto';
import { UpdateRoomDto } from './dto/room.update.dto';
import { ItemDto } from './dto/room-items.dto';

@Injectable()
export class RoomService {
	constructor(@InjectModel(Room.name) private roomModel: Model<Room>) {}

	async create(userId: string, createRoomDto: Omit<CreateRoomDto, 'userId'>): Promise<Room> {
		return this.roomModel
			.findOneAndUpdate({ userId }, { ...createRoomDto, userId }, { new: true, upsert: true })
			.exec();
	}

	async findByUserId(userId: string): Promise<Room> {
		const room = await this.roomModel.findOne({ userId }).exec();
		if (!room) {
			throw new NotFoundException(`Room for user "${userId}" not found`);
		}
		return room;
	}

	async update(userId: string, updateDto: UpdateRoomDto | ItemDto): Promise<Room> {
		const room = await this.roomModel.findOne({ userId }).exec();

		if (!room) {
			throw new NotFoundException(`Room for user "${userId}" not found`);
		}

		if (isUpdateRoomDto(updateDto)) {
			updateDto.items.forEach(newItem => {
				const index = room.items.findIndex(item => item.name === newItem.name);
				if (index !== -1) {
					room.items[index] = { ...room.items[index], ...newItem };
				} else {
					room.items.push(newItem);
				}
			});
		} else {
			const index = room.items.findIndex(item => item.name === updateDto.name);
			if (index !== -1) {
				room.items[index] = { ...room.items[index], ...updateDto };
			} else {
				room.items.push(updateDto);
			}
		}

		await room.save();

		return room;
	}

	async remove(userId: string): Promise<Room> {
		const deletedRoom = await this.roomModel.findOneAndDelete({ userId }).exec();
		if (!deletedRoom) {
			throw new NotFoundException(`Room for user "${userId}" not found`);
		}
		return deletedRoom;
	}
}

function isUpdateRoomDto(dto: UpdateRoomDto | ItemDto): dto is UpdateRoomDto {
	return 'items' in dto && Array.isArray(dto.items);
}
