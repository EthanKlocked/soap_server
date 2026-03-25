import { Test, TestingModule } from '@nestjs/testing';
import { RoomController } from './room.controller';
import { RoomService } from './room.service';
import { UserService } from '@src/user/user.service';
import { FriendService } from '@src/friend/friend.service';
import { JwtAuthGuard } from '@src/auth/guard/jwt.guard';
import { ApiGuard } from '@src/auth/guard/api.guard';

describe('RoomController', () => {
	let controller: RoomController;

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			controllers: [RoomController],
			providers: [
				{
					provide: RoomService,
					useValue: {
						findByUserId: jest.fn(),
						updateItems: jest.fn()
					}
				},
				{
					provide: UserService,
					useValue: { findOne: jest.fn() }
				},
				{
					provide: FriendService,
					useValue: { areFriends: jest.fn() }
				}
			]
		})
			.overrideGuard(ApiGuard)
			.useValue({ canActivate: jest.fn(() => true) })
			.overrideGuard(JwtAuthGuard)
			.useValue({ canActivate: jest.fn(() => true) })
			.compile();

		controller = module.get<RoomController>(RoomController);
	});

	it('should be defined', () => {
		expect(controller).toBeDefined();
	});
});
