import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { PushService } from './push.service';

jest.mock('firebase-admin', () => ({
	apps: [{}],
	initializeApp: jest.fn(),
	credential: { cert: jest.fn() },
	messaging: jest.fn().mockReturnValue({
		send: jest.fn(),
		sendEachForMulticast: jest.fn()
	})
}));

describe('PushService', () => {
	let service: PushService;

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [
				PushService,
				{
					provide: getModelToken('DeviceToken'),
					useValue: {
						findOne: jest.fn(),
						findOneAndUpdate: jest.fn(),
						find: jest.fn(),
						deleteMany: jest.fn()
					}
				},
				{
					provide: getModelToken('NotificationSetting'),
					useValue: {
						findOne: jest.fn(),
						findOneAndUpdate: jest.fn()
					}
				}
			]
		}).compile();

		service = module.get<PushService>(PushService);
	});

	it('should be defined', () => {
		expect(service).toBeDefined();
	});
});
