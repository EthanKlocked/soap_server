import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { RoomService } from './room.service';

describe('RoomService', () => {
	let service: RoomService;

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [
				RoomService,
				{
					provide: getModelToken('Room'),
					useValue: {
						findOne: jest.fn(),
						create: jest.fn(),
						findOneAndUpdate: jest.fn()
					}
				}
			]
		}).compile();

		service = module.get<RoomService>(RoomService);
	});

	it('should be defined', () => {
		expect(service).toBeDefined();
	});
});
