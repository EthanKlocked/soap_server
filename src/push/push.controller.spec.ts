import { Test, TestingModule } from '@nestjs/testing';
import { PushController } from './push.controller';
import { PushService } from './push.service';
import { JwtAuthGuard } from '@src/auth/guard/jwt.guard';
import { ApiGuard } from '@src/auth/guard/api.guard';

describe('PushController', () => {
	let controller: PushController;

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			controllers: [PushController],
			providers: [
				{
					provide: PushService,
					useValue: {
						registerToken: jest.fn(),
						sendPush: jest.fn(),
						getNotificationSetting: jest.fn(),
						updateNotificationSetting: jest.fn()
					}
				}
			]
		})
			.overrideGuard(ApiGuard)
			.useValue({ canActivate: jest.fn(() => true) })
			.overrideGuard(JwtAuthGuard)
			.useValue({ canActivate: jest.fn(() => true) })
			.compile();

		controller = module.get<PushController>(PushController);
	});

	it('should be defined', () => {
		expect(controller).toBeDefined();
	});
});
