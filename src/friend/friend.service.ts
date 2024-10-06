import {
	Injectable,
	InternalServerErrorException,
	ConflictException,
	NotFoundException,
	HttpException,
	BadRequestException,
	UnprocessableEntityException
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, isValidObjectId, Types } from 'mongoose';
import { FriendRequest } from '@src/friend/schema/friendRequest.schema';
import { Friendship } from '@src/friend/schema/friendship.schema';
import { BlockedUser } from '@src/user/schema/blockedUser.schema';
import { User } from '@src/user/schema/user.schema';
import { UserService } from '@src/user/user.service';

@Injectable()
export class FriendService {
	constructor(
		@InjectModel(FriendRequest.name) private friendRequestModel: Model<FriendRequest>,
		@InjectModel(Friendship.name) private friendshipModel: Model<Friendship>,
		@InjectModel(BlockedUser.name) private blockedUserModel: Model<BlockedUser>,
		@InjectModel(User.name) private userModel: Model<User>,
		private userService: UserService
	) { }

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
			if (senderId === receiverId)
				throw new BadRequestException('You cannot send a friend request to yourself');
			if (!isValidObjectId(receiverId))
				throw new BadRequestException('Invalid receiver ID format');
			const receiverExists = await this.userService.userExists(receiverId);
			if (!receiverExists) throw new NotFoundException('Receiver user not found');
			if (await this.areFriends(senderId, receiverId))
				throw new UnprocessableEntityException('Users are already friends');
			const existingRequest = await this.friendRequestModel
				.findOne({
					$or: [
						{ senderId, receiverId },
						{ senderId: receiverId, receiverId: senderId }
					]
				})
				.exec();
			if (existingRequest) {
				if (existingRequest.status === 'pending') {
					if (existingRequest.senderId.toString() === senderId) {
						throw new ConflictException(
							'You already have a pending friend request to this user'
						);
					} else {
						throw new ConflictException(
							'This user has already sent you a friend request. Please respond to that request.'
						);
					}
				} else if (existingRequest.status === 'rejected') {
					if (existingRequest.senderId.toString() === senderId) {
						const canSendRequest = await this.canSendFriendRequest(
							senderId,
							receiverId
						);
						if (!canSendRequest) {
							throw new ConflictException(
								'You must wait before sending another request to this user'
							);
						}
						existingRequest.status = 'pending';
						existingRequest.message = message;
						existingRequest.lastRequestDate = new Date();
						return await existingRequest.save();
					}
				}
			}
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

	async acceptFriendRequest(userId: string, requestId: string): Promise<Friendship> {
		try {
			const request = await this.friendRequestModel.findById(requestId).exec();
			if (!request || request.status !== 'pending')
				throw new NotFoundException('Friend request not found or already processed');
			if (request.receiverId.toString() !== userId)
				throw new ConflictException('You can only accept friend requests sent to you');
			if (await this.areFriends(request.senderId.toString(), request.receiverId.toString()))
				throw new UnprocessableEntityException('Users are already friends');
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

	async rejectFriendRequest(userId: string, requestId: string): Promise<FriendRequest> {
		try {
			const request = await this.friendRequestModel.findById(requestId).exec();
			if (!request || request.status !== 'pending')
				throw new NotFoundException('Friend request not found or already processed');
			if (request.receiverId.toString() !== userId)
				throw new ConflictException('You can only reject friend requests sent to you');
			if (await this.areFriends(request.senderId.toString(), request.receiverId.toString()))
				throw new UnprocessableEntityException('Users are already friends');
			request.status = 'rejected';
			request.lastRequestDate = new Date();
			return await request.save();
		} catch (e) {
			if (e instanceof HttpException) throw e;
			throw new InternalServerErrorException('An unexpected error occurred');
		}
	}

	//only for test
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

	async getSentFriendRequests(userId: string): Promise<FriendRequest[]> {
		try {
			return await this.friendRequestModel
				.find({
					senderId: userId,
					status: { $in: ['pending', 'rejected'] }
				})
				.sort({ lastRequestDate: -1 })
				.exec();
		} catch (e) {
			throw new InternalServerErrorException(
				'An unexpected error occurred while fetching sent friend requests'
			);
		}
	}

	async getFriends(userId: string): Promise<Friendship[]> {
		try {
			const blockedUsers = await this.blockedUserModel
				.find({ userId })
				.distinct('blockedUserId');
			const friendships = await this.friendshipModel
				.find({
					$or: [{ user1Id: userId }, { user2Id: userId }],
					$and: [{ user1Id: { $nin: blockedUsers } }, { user2Id: { $nin: blockedUsers } }]
				})
				.lean()
				.exec();
			const friendsWithDetails = await Promise.all(friendships.map(async (friendship) => {
				const friendId = friendship.user1Id.toString() === userId
					? friendship.user2Id
					: friendship.user1Id;
				const friendDetails = await this.userModel.findById(friendId)
					.select('name email imgUrl status')
					.lean()
					.exec();
				return {
					...friendship,
					friend: friendDetails
				};
			}));
			return friendsWithDetails;
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

	async unfriend(userId: string, friendId: string): Promise<void> {
		try {
			const deletedFriendship = await this.friendshipModel.findOneAndDelete({
				$or: [
					{ user1Id: userId, user2Id: friendId },
					{ user1Id: friendId, user2Id: userId }
				]
			});
			if (!deletedFriendship) {
				throw new NotFoundException('Friendship not found');
			}
			await this.friendRequestModel.deleteMany({
				$or: [
					{ senderId: userId, receiverId: friendId },
					{ senderId: friendId, receiverId: userId }
				]
			});
		} catch (e) {
			if (e instanceof HttpException) throw e;
			throw new InternalServerErrorException('Failed to unfriend');
		}
	}
}
