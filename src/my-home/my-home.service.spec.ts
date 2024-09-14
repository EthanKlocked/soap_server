import { Test, TestingModule } from '@nestjs/testing';
import { MyHomeService } from './my-home.service';

describe('MyHomeService', () => {
	let service: MyHomeService;

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [MyHomeService]
		}).compile();

		service = module.get<MyHomeService>(MyHomeService);
	});

	it('should be defined', () => {
		expect(service).toBeDefined();
	});
});
