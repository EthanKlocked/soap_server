import { Test, TestingModule } from '@nestjs/testing';
import { MyHomeController } from './my-home.controller';

describe('MyHomeController', () => {
	let controller: MyHomeController;

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			controllers: [MyHomeController]
		}).compile();

		controller = module.get<MyHomeController>(MyHomeController);
	});

	it('should be defined', () => {
		expect(controller).toBeDefined();
	});
});
