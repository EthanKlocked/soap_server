import {
	Injectable,
	InternalServerErrorException,
	ConflictException,
	NotFoundException,
	HttpException,
	BadRequestException
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, isValidObjectId } from 'mongoose';
import { FriendRequest } from '@src/friend/schema/friendRequest.schema';
import { Friendship } from '@src/friend/schema/friendship.schema';

@Injectable()
export class FriendService {
	constructor(
		@InjectModel(FriendRequest.name) private friendRequestModel: Model<FriendRequest>,
		@InjectModel(Friendship.name) private friendshipModel: Model<Friendship>
	) {}

	async areFriends(user1Id: string, user2Id: string): Promise<boolean> {
		try {
			const friendship = await this.friendshipModel
				.findOne({
					$or: [
						{ user1Id, user2Id },
						{ user1Id: user2Id, user2Id: user1Id }
					]
				})
				.exec();
			return !!friendship;
		} catch (e) {
			throw new InternalServerErrorException(
				'An unexpected error occurred while checking friendship'
			);
		}
	}

	async sendFriendRequest(
		senderId: string,
		receiverId: string,
		message: string
	): Promise<FriendRequest> {
		try {
			if (!isValidObjectId(receiverId))
				throw new BadRequestException('Invalid receiver ID format');
			if (await this.areFriends(senderId, receiverId))
				throw new ConflictException('Users are already friends');
			const existingRequest = await this.friendRequestModel
				.findOne({
					senderId,
					receiverId,
					status: 'pending'
				})
				.exec();
			if (existingRequest)
				throw new ConflictException('A pending friend request already exists');
			const newRequest = new this.friendRequestModel({
				senderId,
				receiverId,
				message,
				status: 'pending'
			});
			return await newRequest.save();
		} catch (e) {
			if (e instanceof HttpException) throw e;
			throw new InternalServerErrorException('An unexpected error occurred');
		}
	}

	async acceptFriendRequest(requestId: string): Promise<Friendship> {
		try {
			const request = await this.friendRequestModel.findById(requestId).exec();
			if (!request || request.status !== 'pending')
				throw new NotFoundException('Friend request not found or already processed');
			if (await this.areFriends(request.senderId.toString(), request.receiverId.toString()))
				throw new ConflictException('Users are already friends');
			request.status = 'accepted';
			await request.save();
			const newFriendship = new this.friendshipModel({
				user1Id: request.senderId,
				user2Id: request.receiverId
			});
			return await newFriendship.save();
		} catch (e) {
			if (e instanceof HttpException) throw e;
			throw new InternalServerErrorException('An unexpected error occurred');
		}
	}

	async rejectFriendRequest(requestId: string): Promise<FriendRequest> {
		try {
			const request = await this.friendRequestModel.findById(requestId).exec();
			if (!request || request.status !== 'pending')
				throw new NotFoundException('Friend request not found or already processed');
			if (await this.areFriends(request.senderId.toString(), request.receiverId.toString()))
				throw new ConflictException('Users are already friends');
			request.status = 'rejected';
			request.lastRequestDate = new Date();
			return await request.save();
		} catch (e) {
			if (e instanceof HttpException) throw e;
			throw new InternalServerErrorException('An unexpected error occurred');
		}
	}

	async deleteFriendRequest(requestId: string): Promise<void> {
		try {
			const result = await this.friendRequestModel.deleteOne({ _id: requestId }).exec();
			if (result.deletedCount === 0) throw new NotFoundException('Friend request not found');
		} catch (e) {
			if (e instanceof HttpException) throw e;
			throw new InternalServerErrorException('An unexpected error occurred');
		}
	}

	async getFriendRequests(userId: string): Promise<FriendRequest[]> {
		try {
			return await this.friendRequestModel
				.find({
					receiverId: userId,
					status: 'pending'
				})
				.exec();
		} catch (e) {
			throw new InternalServerErrorException('An unexpected error occurred');
		}
	}

	async getFriends(userId: string): Promise<Friendship[]> {
		try {
			return await this.friendshipModel
				.find({
					$or: [{ user1Id: userId }, { user2Id: userId }]
				})
				.exec();
		} catch (e) {
			throw new InternalServerErrorException('An unexpected error occurred');
		}
	}

	async canSendFriendRequest(senderId: string, receiverId: string): Promise<boolean> {
		try {
			const lastRejectedRequest = await this.friendRequestModel
				.findOne({
					senderId,
					receiverId,
					status: 'rejected'
				})
				.sort({ lastRequestDate: -1 })
				.exec();
			if (!lastRejectedRequest) return true;
			const cooldownPeriod = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds
			const timeSinceLastRequest = Date.now() - lastRejectedRequest.lastRequestDate.getTime();
			return timeSinceLastRequest > cooldownPeriod;
		} catch (e) {
			throw new InternalServerErrorException('An unexpected error occurred');
		}
	}
}
