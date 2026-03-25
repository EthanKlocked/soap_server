import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { UserService } from './user.service';
import { EmailService } from '@src/email/email.service';
import { FileManagerService } from '@src/file-manager/file-manager.service';

describe('UserService', () => {
	let service: UserService;

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
				UserService,
				{ provide: getModelToken('User'), useValue: mockModel },
				{ provide: getModelToken('BlockedUser'), useValue: mockModel },
				{ provide: getModelToken('Friendship'), useValue: mockModel },
				{ provide: getModelToken('FriendRequest'), useValue: mockModel },
				{ provide: getModelToken('Diary'), useValue: mockModel },
				{ provide: getModelToken('DiaryAnalysis'), useValue: mockModel },
				{
					provide: CACHE_MANAGER,
					useValue: { get: jest.fn(), set: jest.fn(), del: jest.fn() }
				},
				{
					provide: EmailService,
					useValue: { send: jest.fn() }
				},
				{
					provide: FileManagerService,
					useValue: { deleteFile: jest.fn() }
				}
			]
		}).compile();

		service = module.get<UserService>(UserService);
	});

	it('should be defined', () => {
		expect(service).toBeDefined();
	});
});
