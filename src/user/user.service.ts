import {
	Inject,
	Injectable,
	InternalServerErrorException,
	UnauthorizedException,
	RequestTimeoutException,
	ConflictException,
	NotFoundException,
	HttpException,
	BadRequestException
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { User } from '@src/user/schema/user.schema';
import { Model } from 'mongoose';
import { UserSignupDto, UserSnsSignupDto } from '@src/user/dto/user.signup.dto';
import { UserUpdateDto } from '@src/user/dto/user.update.dto';
import { Cache } from 'cache-manager';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { generateRandomNumber } from '@src/lib/common';
import { EmailService } from 'src/email/email.service';
import { EmailRequestDto } from '@src/email/dto/email.request.dto';
import { UserVerifyDto } from '@src/user/dto/user.verify.dto';
import { UserBlockDto } from '@src/user/dto/user.block.dto';
import { BlockedUser } from '@src/user/schema/blockedUser.schema';
import { Friendship } from '@src/friend/schema/friendship.schema';
import { FriendRequest } from '@src/friend/schema/friendRequest.schema';
import { Diary } from '@src/diary/schema/diary.schema';
import { DiaryAnalysis } from '@src/diary/schema/diaryAnalysis.schema';
import * as bcrypt from 'bcryptjs';
import { isValidObjectId } from 'mongoose';

//onModuleInit interface and addNewField method need to be activated for case new columns added
@Injectable()
export class UserService /*implements OnModuleInit*/ {
	constructor(
		@InjectModel(User.name) private readonly userModel: Model<User>,
		@InjectModel(BlockedUser.name) private readonly blockedUserModel: Model<BlockedUser>,
		@InjectModel(Friendship.name) private friendshipModel: Model<Friendship>,
		@InjectModel(FriendRequest.name) private friendRequestModel: Model<FriendRequest>,
		@InjectModel(Diary.name) private diaryModel: Model<Diary>,
		@InjectModel(DiaryAnalysis.name) private diaryAnalysisModel: Model<DiaryAnalysis>,
		@Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
		private readonly emailService: EmailService
	) {}
	/* ######### OPTIONAL #########
	async onModuleInit() {
		await this.addNewField();
	}
	async addNewField() {
		await this.userModel.updateMany({ refresh: { $exists: false } }, { $set: { refresh: null } });
	} 
	*/

	async findAll() {
		try {
			const users = await this.userModel.find().exec();
			return users.map((u: User): User['readOnlyData'] => u.readOnlyData);
		} catch (e) {
			throw new InternalServerErrorException('An unexpected error occurred');
		}
	}

	async findOne(option: object = null) {
		try {
			const user = await this.userModel.findOne(option).exec();
			return user;
		} catch (e) {
			throw new InternalServerErrorException('An unexpected error occurred');
		}
	}

	async findById(id: string) {
		try {
			const user = await this.userModel.findById(id).exec();
			return user;
		} catch (e) {
			throw new InternalServerErrorException('An unexpected error occurred');
		}
	}

	async findProfile(id: string) {
		try {
			const user = await this.userModel.findById(id).exec();
			if (!user) throw new NotFoundException(`User with ID "${id}" not found`);
			return user.readOnlyData;
		} catch (e) {
			if (e instanceof HttpException) throw e;
			throw new InternalServerErrorException('An unexpected error occurred');
		}
	}

	async userExists(userId: string): Promise<boolean> {
		const user = await this.userModel.findById(userId).exec();
		return !!user;
	}

	async createUser(
		email: string,
		name: string,
		password: string,
		sns: string = 'local'
	): Promise<User> {
		try {
			const hashedPassword = await bcrypt.hash(password, 10);
			const user = await this.userModel.create({
				email,
				name,
				password: hashedPassword,
				sns
			});
			return user;
		} catch (e) {
			throw new InternalServerErrorException(
				'An unexpected error occurred while creating user'
			);
		}
	}

	async signUp(body: UserSignupDto) {
		try {
			const { email, name, password } = body;

			//check time expired
			const timePass = await this.cacheManager.get(body.email);
			if (!timePass || timePass != 'passed')
				throw new RequestTimeoutException('not verified or timed out');

			//check user duplicated
			const isUserExist = await this.userModel.exists({ email }).exec();
			if (isUserExist) throw new ConflictException('The user already exists');

			//join start
			const user = await this.createUser(email, name, password);
			return user.readOnlyData;
		} catch (e) {
			if (e instanceof HttpException) throw e; //controlled
			throw new InternalServerErrorException('An unexpected error occurred');
		}
	}

	async snsSignUp(snsSignupDto: UserSnsSignupDto): Promise<User> {
		try {
			const { email, password, name, sns } = snsSignupDto;
			const existingUser = await this.userModel.findOne({ email });
			if (existingUser) throw new ConflictException('The user already exists');
			const hashedPassword = await bcrypt.hash(password, 10);
			const newUser = new this.userModel({
				email,
				password: hashedPassword,
				name,
				sns
			});
			return newUser.save();
		} catch (e) {
			if (e instanceof HttpException) throw e; //controlled
			throw new InternalServerErrorException('An unexpected error occurred');
		}
	}

	async update(userId: string, updateInfo: UserUpdateDto): Promise<User> {
		try {
			//check fields
			const updateFields: Partial<User> = {};
			if (updateInfo.name) updateFields.name = updateInfo.name;
			if (updateInfo.alarm !== undefined) updateFields.alarm = updateInfo.alarm;
			if (updateInfo.imgUrl) updateFields.imgUrl = updateInfo.imgUrl;
			if (updateInfo.status !== undefined) {
				updateFields.status = updateInfo.status === '' ? null : updateInfo.status;
			}

			//update start
			const updatedUser = await this.userModel
				.findByIdAndUpdate(
					userId,
					{ $set: updateFields },
					{ new: true, runValidators: true }
				)
				.exec();
			if (!updatedUser) throw new NotFoundException('User not found');
			return updatedUser;
		} catch (e) {
			if (e instanceof HttpException) throw e; //controlled
			throw new InternalServerErrorException('An unexpected error occurred');
		}
	}

	async sendVerification(body: EmailRequestDto) {
		try {
			const limitSeconds: number = 180;
			const verifyToken: string = generateRandomNumber(6);
			body.subject = 'verifcation number';
			body.content = verifyToken;
			await this.cacheManager.set(body.email, verifyToken, { ttl: limitSeconds } as any);
			this.emailService.sendMail(body);
			return limitSeconds;
		} catch (e) {
			throw new InternalServerErrorException('An unexpected error occurred');
		}
	}

	async verify(body: UserVerifyDto) {
		try {
			const targetCode = await this.cacheManager.get(body.email);
			if (targetCode === undefined)
				throw new RequestTimeoutException('not sent or timed out');
			if (body.verificationCode === targetCode) {
				const limitSeconds: number = 300;
				await this.cacheManager.set(body.email, 'passed', { ttl: limitSeconds } as any); //limited time session for 5mins in joining process
				return 'Success';
			} else throw new UnauthorizedException('Invalid code');
		} catch (e) {
			if (e instanceof HttpException) throw e;
			throw new InternalServerErrorException('An unexpected error occurred');
		}
	}

	async delete(userId: string) {
		try {
			const deletedUser = await this.userModel.findByIdAndDelete(userId).exec();
			if (!deletedUser) {
				throw new NotFoundException(`User with ID ${userId} not found`);
			}
			// Delete associated diaries
			await this.diaryModel.deleteMany({ userId }).exec();

			// Delete associated diary analyses
			await this.diaryAnalysisModel.deleteMany({ userId }).exec();

			// Delete blocked reationship
			await this.blockedUserModel
				.deleteMany({
					$or: [{ userId }, { blockedUserId: userId }]
				})
				.exec();

			// Delete friendship
			await this.friendshipModel
				.deleteMany({
					$or: [{ user1Id: userId }, { user2Id: userId }]
				})
				.exec();

			// Delete friend request
			await this.friendRequestModel
				.deleteMany({
					$or: [{ senderId: userId }, { receiverId: userId }]
				})
				.exec();

			return deletedUser.readOnlyData;
		} catch (e) {
			if (e instanceof HttpException) throw e;
			throw new InternalServerErrorException('An unexpected error occurred');
		}
	}

	async blockUser(userId: string, userBlockDto: UserBlockDto): Promise<BlockedUser> {
		try {
			const { userToBlockId, blockedReason } = userBlockDto;
			if (!isValidObjectId(userToBlockId))
				throw new BadRequestException('Invalid user ID format');
			const userToBlock = await this.userModel.findById(userToBlockId);
			if (!userToBlock) throw new NotFoundException('User to block not found');
			if (userId === userToBlockId) throw new ConflictException('You cannot block yourself');

			const existingBlock = await this.blockedUserModel.findOne({
				userId,
				blockedUserId: userToBlockId
			});
			if (existingBlock) throw new ConflictException('User is already blocked');
			const newBlock = new this.blockedUserModel({
				userId,
				blockedUserId: userToBlockId,
				blockedReason: blockedReason || null
			});
			return newBlock.save();
		} catch (e) {
			if (e instanceof HttpException) throw e;
			throw new InternalServerErrorException('An unexpected error occurred');
		}
	}

	async unblockUser(userId: string, blockedUserId: string): Promise<void> {
		try {
			const result = await this.blockedUserModel.deleteOne({
				userId,
				blockedUserId
			});
			if (result.deletedCount === 0) throw new NotFoundException('Blocked user not found');
		} catch (e) {
			if (e instanceof HttpException) throw e;
			throw new InternalServerErrorException('An unexpected error occurred');
		}
	}

	async isUserBlocked(userId: string, targetUserId: string): Promise<boolean> {
		try {
			const block = await this.blockedUserModel.exists({
				userId,
				blockedUserId: targetUserId
			});
			return !!block;
		} catch (e) {
			if (e instanceof HttpException) throw e;
			throw new InternalServerErrorException('An unexpected error occurred');
		}
	}

	async getBlockedUsers(userId: string) {
		try {
			const blockedUsers = await this.blockedUserModel
				.find({ userId })
				.populate('blockedUserId', 'email name')
				.lean()
				.exec();

			const friendIds = await this.friendshipModel.distinct('user1Id', {
				$or: [{ user1Id: userId }, { user2Id: userId }]
			});

			return blockedUsers.map(block => ({
				id: block.blockedUserId._id,
				email: block.blockedUserId['email'],
				name: block.blockedUserId['name'],
				isFriend: friendIds.includes(block.blockedUserId._id)
			}));
		} catch (e) {
			if (e instanceof HttpException) throw e;
			throw new InternalServerErrorException('An unexpected error occurred');
		}
	}

	async isNameDuplicate(name: string): Promise<boolean> {
		try {
			const existingUser = await this.userModel.exists({ name }).exec();
			return !!existingUser;
		} catch (e) {
			throw new InternalServerErrorException('An unexpected error occurred');
		}
	}
}
