import {
	Injectable,
	InternalServerErrorException,
	ConflictException,
	NotFoundException,
	HttpException,
	BadRequestException,
	UnprocessableEntityException,
	Logger
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, isValidObjectId } from 'mongoose';
import { FriendRequest } from '@src/friend/schema/friendRequest.schema';
import { Friendship } from '@src/friend/schema/friendship.schema';
import { BlockedUser } from '@src/user/schema/blockedUser.schema';
import { User } from '@src/user/schema/user.schema';
import { UserService } from '@src/user/user.service';
import { PushService } from '@src/push/push.service';
import { PUSH_MESSAGE_LIST } from '@src/push/push.constants';
import { FriendRequestStatus } from '@src/friend/friendship.interface';

@Injectable()
export class FriendService {
	private readonly logger = new Logger(FriendService.name);
	private readonly FRIEND_REQUEST_COOLDOWN = 7 * 24 * 60 * 60 * 1000;

	constructor(
		@InjectModel(FriendRequest.name) private friendRequestModel: Model<FriendRequest>,
		@InjectModel(Friendship.name) private friendshipModel: Model<Friendship>,
		@InjectModel(BlockedUser.name) private blockedUserModel: Model<BlockedUser>,
		@InjectModel(User.name) private userModel: Model<User>,
		private userService: UserService,
		private readonly pushService: PushService
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

	private async sendFriendRequestPush(receiverId: string, sender: User, requestId: string) {
		try {
			const receiver = await this.userModel.findOne({ _id: receiverId });
			if (!receiver) {
				this.logger.warn(`User not found for receiverId: ${receiverId}`);
				return;
			}
			await this.pushService.sendPushToUser(receiverId, {
				title: PUSH_MESSAGE_LIST.request_soaf.title,
				body: PUSH_MESSAGE_LIST.request_soaf.description.replace(
					'{nickname}',
					receiver.name
				),
				data: {
					type: 'NAVIGATION',
					nav_link: 'notification'
					// requestId: requestId,
					// senderId: sender._id.toString(),
					// senderName: sender.name
				}
			});
		} catch (e) {
			this.logger.warn(`Failed to send push notification: ${e.message}`);
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
				if (existingRequest.status === FriendRequestStatus.PENDING) {
					if (existingRequest.senderId.toString() === senderId) {
						throw new ConflictException(
							'You already have a pending friend request to this user'
						);
					} else {
						throw new ConflictException(
							'This user has already sent you a friend request. Please respond to that request.'
						);
					}
				} else if (existingRequest.status === FriendRequestStatus.REJECTED) {
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
						existingRequest.status = FriendRequestStatus.PENDING;
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
				status: FriendRequestStatus.PENDING
			});

			const savedRequest = await newRequest.save();
			const sender = await this.userService.findById(senderId);

			this.sendFriendRequestPush(receiverId, sender, savedRequest._id.toString()).catch(
				error => this.logger.error('Background push notification failed:', error)
			);

			return savedRequest;
		} catch (e) {
			if (e instanceof HttpException) throw e;
			throw new InternalServerErrorException('An unexpected error occurred');
		}
	}

	async acceptFriendRequest(userId: string, requestId: string): Promise<Friendship> {
		try {
			const request = await this.friendRequestModel.findById(requestId).exec();
			if (!request || request.status !== FriendRequestStatus.PENDING)
				throw new NotFoundException('Friend request not found or already processed');
			if (request.receiverId.toString() !== userId)
				throw new ConflictException('You can only accept friend requests sent to you');
			if (await this.areFriends(request.senderId.toString(), request.receiverId.toString()))
				throw new UnprocessableEntityException('Users are already friends');
			request.status = FriendRequestStatus.ACCEPTED;
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
			if (!request || request.status !== FriendRequestStatus.PENDING)
				throw new NotFoundException('Friend request not found or already processed');
			if (request.receiverId.toString() !== userId)
				throw new ConflictException('You can only reject friend requests sent to you');
			if (await this.areFriends(request.senderId.toString(), request.receiverId.toString()))
				throw new UnprocessableEntityException('Users are already friends');
			request.status = FriendRequestStatus.REJECTED;
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
			const requests = await this.friendRequestModel
				.find({
					receiverId: userId,
					status: FriendRequestStatus.PENDING
				})
				.populate<{ senderId: User }>({
					path: 'senderId',
					select: 'name',
					model: 'User'
				})
				.sort({ lastRequestDate: -1 })
				.lean()
				.exec();
			return requests.map(request => ({
				...request,
				senderName: request.senderId.name,
				senderId: request.senderId._id
			}));
		} catch (e) {
			throw new InternalServerErrorException('An unexpected error occurred');
		}
	}

	async getSentFriendRequests(
		userId: string
	): Promise<Array<FriendRequest & { remainingDays?: number }>> {
		try {
			const requests = await this.friendRequestModel
				.find({
					senderId: userId,
					status: { $in: [FriendRequestStatus.PENDING, FriendRequestStatus.REJECTED] }
				})
				.sort({ lastRequestDate: -1 })
				.lean()
				.exec();

			return requests.map(request =>
				request.status === FriendRequestStatus.REJECTED
					? {
							...request,
							remainingDays: this.calculateRemainingDays(request.lastRequestDate)
						}
					: request
			);
		} catch (e) {
			throw new InternalServerErrorException(
				'An unexpected error occurred while fetching sent friend requests'
			);
		}
	}

	async getFriends(userId: string): Promise<Friendship[]> {
		try {
			const blockedUsers = [
				...(await this.blockedUserModel.distinct('blockedUserId', { userId })),
				...(await this.blockedUserModel.distinct('userId', { blockedUserId: userId }))
			];
			const friendships = await this.friendshipModel
				.find({
					$or: [{ user1Id: userId }, { user2Id: userId }],
					$and: [{ user1Id: { $nin: blockedUsers } }, { user2Id: { $nin: blockedUsers } }]
				})
				.lean()
				.exec();
			const friendsWithDetails = await Promise.all(
				friendships.map(async friendship => {
					const friendId =
						friendship.user1Id.toString() === userId
							? friendship.user2Id
							: friendship.user1Id;
					const friendDetails = await this.userModel
						.findById(friendId)
						.select('name email imgUrl status')
						.lean()
						.exec();
					return {
						...friendship,
						friend: friendDetails
					};
				})
			);
			return friendsWithDetails;
		} catch (e) {
			throw new InternalServerErrorException('An unexpected error occurred');
		}
	}

	async getFriendshipStatus(
		userId: string,
		targetUserId: string
	): Promise<{ status: FriendRequestStatus; remainingDays?: number }> {
		try {
			const requests = await this.friendRequestModel
				.find({
					$or: [
						{ senderId: userId, receiverId: targetUserId },
						{ senderId: targetUserId, receiverId: userId }
					]
				})
				.sort({ lastRequestDate: -1 })
				.limit(2); //defense ( request must be created once )
			const myRequest = requests.find(req => req.senderId.toString() === userId);
			if (requests.some(req => req.status === FriendRequestStatus.ACCEPTED))
				return { status: FriendRequestStatus.ACCEPTED };
			if (!myRequest) return { status: FriendRequestStatus.EMPTY };
			if (myRequest.status === FriendRequestStatus.PENDING)
				return { status: FriendRequestStatus.PENDING };
			if (myRequest.status === FriendRequestStatus.REJECTED) {
				return {
					status: FriendRequestStatus.REJECTED,
					remainingDays: this.calculateRemainingDays(myRequest.lastRequestDate)
				};
			}
			return { status: FriendRequestStatus.INVALID };
		} catch (e) {
			throw new InternalServerErrorException('Failed to check friendship status');
		}
	}

	async canSendFriendRequest(senderId: string, receiverId: string): Promise<boolean> {
		try {
			const lastRejectedRequest = await this.friendRequestModel
				.findOne({
					senderId,
					receiverId,
					status: FriendRequestStatus.REJECTED
				})
				.sort({ lastRequestDate: -1 })
				.exec();
			if (!lastRejectedRequest) return true;
			const timeSinceLastRequest = Date.now() - lastRejectedRequest.lastRequestDate.getTime();
			return timeSinceLastRequest > this.FRIEND_REQUEST_COOLDOWN;
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

	private calculateRemainingDays(lastRequestDate: Date): number {
		return Math.max(
			0,
			Math.ceil(
				(this.FRIEND_REQUEST_COOLDOWN -
					(Date.now() - new Date(lastRequestDate).getTime())) /
					(24 * 60 * 60 * 1000)
			)
		);
	}
}
