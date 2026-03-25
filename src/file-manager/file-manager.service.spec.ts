import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { FileManagerService } from './file-manager.service';

describe('FileManagerService', () => {
	let service: FileManagerService;

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [
				FileManagerService,
				{
					provide: ConfigService,
					useValue: { get: jest.fn().mockReturnValue('test-value') }
				}
			]
		}).compile();

		service = module.get<FileManagerService>(FileManagerService);
	});

	it('should be defined', () => {
		expect(service).toBeDefined();
	});
});
