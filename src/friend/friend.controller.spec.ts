import { Test, TestingModule } from '@nestjs/testing';
import { FriendController } from './friend.controller';
import { FriendService } from './friend.service';
import { ThrottleService } from '@src/throttle/throttle.service';
import { JwtAuthGuard } from '@src/auth/guard/jwt.guard';
import { ApiGuard } from '@src/auth/guard/api.guard';
import { MembershipGuard } from '@src/membership/guard/membership.guard';

describe('FriendController', () => {
	let controller: FriendController;

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			controllers: [FriendController],
			providers: [
				{
					provide: FriendService,
					useValue: {
						getFriendList: jest.fn(),
						sendRequest: jest.fn(),
						acceptRequest: jest.fn(),
						rejectRequest: jest.fn()
					}
				},
				{
					provide: ThrottleService,
					useValue: {
						checkAndIncrement: jest.fn(),
						checkLimit: jest.fn(),
						increment: jest.fn()
					}
				}
			]
		})
			.overrideGuard(ApiGuard)
			.useValue({ canActivate: jest.fn(() => true) })
			.overrideGuard(JwtAuthGuard)
			.useValue({ canActivate: jest.fn(() => true) })
			.overrideGuard(MembershipGuard)
			.useValue({ canActivate: jest.fn(() => true) })
			.compile();

		controller = module.get<FriendController>(FriendController);
	});

	it('should be defined', () => {
		expect(controller).toBeDefined();
	});
});
