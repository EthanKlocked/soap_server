import { Test, TestingModule } from '@nestjs/testing';
import { FileManagerController } from './file-manager.controller';
import { FileManagerService } from './file-manager.service';
import { JwtAuthGuard } from '@src/auth/guard/jwt.guard';
import { ApiGuard } from '@src/auth/guard/api.guard';

describe('FileManagerController', () => {
	let controller: FileManagerController;

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			controllers: [FileManagerController],
			providers: [
				{
					provide: FileManagerService,
					useValue: {
						generatePresignedUrl: jest.fn(),
						deleteFile: jest.fn()
					}
				}
			]
		})
			.overrideGuard(ApiGuard)
			.useValue({ canActivate: jest.fn(() => true) })
			.overrideGuard(JwtAuthGuard)
			.useValue({ canActivate: jest.fn(() => true) })
			.compile();

		controller = module.get<FileManagerController>(FileManagerController);
	});

	it('should be defined', () => {
		expect(controller).toBeDefined();
	});
});
