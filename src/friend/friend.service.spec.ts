import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { FriendService } from './friend.service';
import { UserService } from '@src/user/user.service';
import { PushService } from '@src/push/push.service';

describe('FriendService', () => {
	let service: FriendService;

	const mockModel = {
		findOne: jest.fn(),
		find: jest.fn(),
		create: jest.fn(),
		findByIdAndUpdate: jest.fn(),
		findByIdAndDelete: jest.fn(),
		deleteMany: jest.fn(),
		countDocuments: jest.fn(),
		aggregate: jest.fn()
	};

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [
				FriendService,
				{ provide: getModelToken('FriendRequest'), useValue: mockModel },
				{ provide: getModelToken('Friendship'), useValue: mockModel },
				{ provide: getModelToken('BlockedUser'), useValue: mockModel },
				{ provide: getModelToken('User'), useValue: mockModel },
				{
					provide: UserService,
					useValue: { findOne: jest.fn() }
				},
				{
					provide: PushService,
					useValue: { sendPush: jest.fn() }
				}
			]
		}).compile();

		service = module.get<FriendService>(FriendService);
	});

	it('should be defined', () => {
		expect(service).toBeDefined();
	});
});
