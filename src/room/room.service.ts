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

	async create(userId: string, createRoomDto: CreateRoomDto): Promise<Room> {
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

	async update(userId: string, updateRoomDto: UpdateRoomDto): Promise<Room> {
		const updatedRoom = await this.roomModel
			.findOneAndUpdate({ userId }, { $set: updateRoomDto }, { new: true })
			.exec();

		if (!updatedRoom) {
			throw new NotFoundException(`Room for user "${userId}" not found`);
		}
		return updatedRoom;
	}

	async remove(userId: string): Promise<Room> {
		const deletedRoom = await this.roomModel.findOneAndDelete({ userId }).exec();
		if (!deletedRoom) {
			throw new NotFoundException(`Room for user "${userId}" not found`);
		}
		return deletedRoom;
	}

	async addItem(userId: string, itemDto: ItemDto): Promise<Room> {
		const room = await this.roomModel
			.findOneAndUpdate({ userId }, { $push: { items: itemDto } }, { new: true })
			.exec();

		if (!room) {
			throw new NotFoundException(`Room for user "${userId}" not found`);
		}
		return room;
	}

	async updateItem(userId: string, itemId: string, itemDto: ItemDto): Promise<Room> {
		const room = await this.roomModel
			.findOneAndUpdate(
				{ userId, 'items.id': itemId },
				{ $set: { 'items.$': itemDto } },
				{ new: true }
			)
			.exec();

		if (!room) {
			throw new NotFoundException(`Room for user "${userId}" or item "${itemId}" not found`);
		}
		return room;
	}

	async removeItem(userId: string, itemId: string): Promise<Room> {
		const room = await this.roomModel
			.findOneAndUpdate({ userId }, { $pull: { items: { id: itemId } } }, { new: true })
			.exec();

		if (!room) {
			throw new NotFoundException(`Room for user "${userId}" not found`);
		}
		return room;
	}
}
