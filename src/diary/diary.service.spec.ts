import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { DiaryService } from './diary.service';
import { FileManagerService } from '@src/file-manager/file-manager.service';

describe('DiaryService', () => {
	let service: DiaryService;

	const mockModel = {
		findOne: jest.fn(),
		find: jest.fn(),
		create: jest.fn(),
		findByIdAndUpdate: jest.fn(),
		findByIdAndDelete: jest.fn(),
		countDocuments: jest.fn(),
		aggregate: jest.fn()
	};

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [
				DiaryService,
				{ provide: getModelToken('Diary'), useValue: mockModel },
				{ provide: getModelToken('DiaryAnalysis'), useValue: mockModel },
				{ provide: getModelToken('DiaryReport'), useValue: mockModel },
				{
					provide: HttpService,
					useValue: { post: jest.fn(), get: jest.fn() }
				},
				{
					provide: ConfigService,
					useValue: { get: jest.fn().mockReturnValue('localhost') }
				},
				{
					provide: FileManagerService,
					useValue: { deleteFile: jest.fn() }
				}
			]
		}).compile();

		service = module.get<DiaryService>(DiaryService);
	});

	it('should be defined', () => {
		expect(service).toBeDefined();
	});
});
