import { Test, TestingModule } from '@nestjs/testing';
import { DiaryController } from './diary.controller';
import { DiaryService } from './diary.service';
import { DiaryAnalysisService } from './diaryAnalysis.service';
import { ThrottleService } from '@src/throttle/throttle.service';
import { JwtAuthGuard } from '@src/auth/guard/jwt.guard';
import { ApiGuard } from '@src/auth/guard/api.guard';
import { MembershipGuard } from '@src/membership/guard/membership.guard';

describe('DiaryController', () => {
	let controller: DiaryController;

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			controllers: [DiaryController],
			providers: [
				{
					provide: DiaryService,
					useValue: {
						findAll: jest.fn(),
						findOne: jest.fn(),
						create: jest.fn(),
						update: jest.fn(),
						remove: jest.fn()
					}
				},
				{
					provide: DiaryAnalysisService,
					useValue: {
						getSimilarUsers: jest.fn()
					}
				},
				{
					provide: ThrottleService,
					useValue: {
						checkAndIncrement: jest.fn(),
						checkLimit: jest.fn(),
						increment: jest.fn()
					}
				}
			]
		})
			.overrideGuard(ApiGuard)
			.useValue({ canActivate: jest.fn(() => true) })
			.overrideGuard(JwtAuthGuard)
			.useValue({ canActivate: jest.fn(() => true) })
			.overrideGuard(MembershipGuard)
			.useValue({ canActivate: jest.fn(() => true) })
			.compile();

		controller = module.get<DiaryController>(DiaryController);
	});

	it('should be defined', () => {
		expect(controller).toBeDefined();
	});
});
