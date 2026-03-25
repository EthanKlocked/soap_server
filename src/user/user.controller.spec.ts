import { Test, TestingModule } from '@nestjs/testing';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { JwtAuthGuard } from '@src/auth/guard/jwt.guard';
import { ApiGuard } from '@src/auth/guard/api.guard';
import { LocalAuthGuard } from '@src/auth/guard/local.guard';
import { SnsAuthGuard } from '@src/auth/guard/sns.guard';
import { RefreshGuard } from '@src/auth/guard/refresh.guard';
import { MembershipGuard } from '@src/membership/guard/membership.guard';

describe('UserController', () => {
	let controller: UserController;

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			controllers: [UserController],
			providers: [
				{
					provide: UserService,
					useValue: {
						findOne: jest.fn(),
						create: jest.fn(),
						update: jest.fn(),
						delete: jest.fn()
					}
				}
			]
		})
			.overrideGuard(ApiGuard)
			.useValue({ canActivate: jest.fn(() => true) })
			.overrideGuard(JwtAuthGuard)
			.useValue({ canActivate: jest.fn(() => true) })
			.overrideGuard(LocalAuthGuard)
			.useValue({ canActivate: jest.fn(() => true) })
			.overrideGuard(SnsAuthGuard)
			.useValue({ canActivate: jest.fn(() => true) })
			.overrideGuard(RefreshGuard)
			.useValue({ canActivate: jest.fn(() => true) })
			.overrideGuard(MembershipGuard)
			.useValue({ canActivate: jest.fn(() => true) })
			.compile();

		controller = module.get<UserController>(UserController);
	});

	it('should be defined', () => {
		expect(controller).toBeDefined();
	});
});
