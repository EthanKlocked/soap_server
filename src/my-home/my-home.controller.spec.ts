import { Test, TestingModule } from '@nestjs/testing';
import { MyHomeController } from './my-home.controller';
import { MyHomeService } from './my-home.service';
import { CategoryType } from './schema/my-home.schema';
import { PaginationQueryDto } from './dto/pagination.dto';
import { JwtAuthGuard } from '@src/auth/guard/jwt.guard';
import { ApiGuard } from '@src/auth/guard/api.guard';

describe('MyHomeController', () => {
	let controller: MyHomeController;
	let service: MyHomeService;

	// Mock 데이터
	const mockUserId = '507f1f77bcf86cd799439011';
	const mockUser = { id: mockUserId, email: 'test@example.com' };
	const mockReq = { user: mockUser };

	const mockMyHomeItems = [
		{
			_id: '1',
			category: CategoryType.MUSIC,
			review: 'Great music',
			content: { title: 'Song 1', artist: 'Artist 1' },
			userId: mockUserId,
			createdAt: new Date('2024-01-01'),
			updatedAt: new Date('2024-01-01')
		}
	] as any;

	const mockPaginatedResult = {
		data: mockMyHomeItems,
		meta: {
			currentPage: 1,
			itemsPerPage: 10,
			totalItems: 15,
			totalPages: 2,
			hasNextPage: true,
			hasPreviousPage: false
		}
	} as any;

	beforeEach(async () => {
		const mockMyHomeService = {
			findAll: jest.fn(),
			findAllPaginated: jest.fn(),
			create: jest.fn(),
			findOne: jest.fn(),
			update: jest.fn(),
			remove: jest.fn(),
			checkDuplicate: jest.fn()
		};

		const module: TestingModule = await Test.createTestingModule({
			controllers: [MyHomeController],
			providers: [
				{
					provide: MyHomeService,
					useValue: mockMyHomeService
				}
			]
		})
			.overrideGuard(JwtAuthGuard)
			.useValue({ canActivate: jest.fn(() => true) })
			.overrideGuard(ApiGuard)
			.useValue({ canActivate: jest.fn(() => true) })
			.compile();

		controller = module.get<MyHomeController>(MyHomeController);
		service = module.get<MyHomeService>(MyHomeService);
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	describe('findAll', () => {
		it('페이지네이션 파라미터가 없으면 기본 findAll 호출', async () => {
			// Given
			const paginationQuery: PaginationQueryDto = {};
			jest.spyOn(service, 'findAll').mockResolvedValue(mockMyHomeItems);

			// When
			const result = await controller.findAll(mockReq, undefined, undefined, paginationQuery);

			// Then
			expect(service.findAll).toHaveBeenCalledWith(mockUserId, undefined);
			expect(service.findAllPaginated).not.toHaveBeenCalled();
			expect(result).toEqual(mockMyHomeItems);
		});

		it('page 파라미터가 있으면 findAllPaginated 호출', async () => {
			// Given
			const paginationQuery: PaginationQueryDto = {
				page: 2,
				sortBy: 'createdAt',
				sortOrder: 'desc'
			};
			jest.spyOn(service, 'findAllPaginated').mockResolvedValue(mockPaginatedResult);

			// When
			const result = await controller.findAll(mockReq, undefined, undefined, paginationQuery);

			// Then
			expect(service.findAllPaginated).toHaveBeenCalledWith(
				mockUserId,
				paginationQuery,
				undefined
			);
			expect(service.findAll).not.toHaveBeenCalled();
			expect(result).toEqual(mockPaginatedResult);
		});

		it('limit 파라미터가 있으면 findAllPaginated 호출', async () => {
			// Given
			const paginationQuery: PaginationQueryDto = {
				limit: 5,
				sortBy: 'createdAt',
				sortOrder: 'desc'
			};
			jest.spyOn(service, 'findAllPaginated').mockResolvedValue(mockPaginatedResult);

			// When
			const result = await controller.findAll(mockReq, undefined, undefined, paginationQuery);

			// Then
			expect(service.findAllPaginated).toHaveBeenCalledWith(
				mockUserId,
				paginationQuery,
				undefined
			);
			expect(service.findAll).not.toHaveBeenCalled();
			expect(result).toEqual(mockPaginatedResult);
		});

		it('userId 파라미터가 제공되면 해당 userId 사용', async () => {
			// Given
			const targetUserId = '507f1f77bcf86cd799439022';
			const paginationQuery: PaginationQueryDto = { page: 1 };
			jest.spyOn(service, 'findAllPaginated').mockResolvedValue(mockPaginatedResult);

			// When
			await controller.findAll(mockReq, targetUserId, undefined, paginationQuery);

			// Then
			expect(service.findAllPaginated).toHaveBeenCalledWith(
				targetUserId,
				paginationQuery,
				undefined
			);
		});

		it('category 파라미터가 제공되면 카테고리 필터링', async () => {
			// Given
			const category = CategoryType.MUSIC;
			const paginationQuery: PaginationQueryDto = { page: 1 };
			jest.spyOn(service, 'findAllPaginated').mockResolvedValue(mockPaginatedResult);

			// When
			await controller.findAll(mockReq, undefined, category, paginationQuery);

			// Then
			expect(service.findAllPaginated).toHaveBeenCalledWith(
				mockUserId,
				paginationQuery,
				category
			);
		});

		it('userId가 제공되지 않으면 토큰의 userId 사용', async () => {
			// Given
			const paginationQuery: PaginationQueryDto = { page: 1 };
			jest.spyOn(service, 'findAllPaginated').mockResolvedValue(mockPaginatedResult);

			// When
			await controller.findAll(mockReq, undefined, undefined, paginationQuery);

			// Then
			expect(service.findAllPaginated).toHaveBeenCalledWith(
				mockUserId,
				paginationQuery,
				undefined
			);
		});

		it('모든 파라미터가 제공되면 모두 적용', async () => {
			// Given
			const targetUserId = '507f1f77bcf86cd799439022';
			const category = CategoryType.MOVIE;
			const paginationQuery: PaginationQueryDto = {
				page: 2,
				limit: 5,
				sortBy: 'updatedAt',
				sortOrder: 'asc'
			};
			jest.spyOn(service, 'findAllPaginated').mockResolvedValue(mockPaginatedResult);

			// When
			await controller.findAll(mockReq, targetUserId, category, paginationQuery);

			// Then
			expect(service.findAllPaginated).toHaveBeenCalledWith(
				targetUserId,
				paginationQuery,
				category
			);
		});

		it('page와 limit가 모두 없으면 기본 findAll 호출', async () => {
			// Given
			const paginationQuery: PaginationQueryDto = {
				sortBy: 'createdAt',
				sortOrder: 'desc'
			};
			jest.spyOn(service, 'findAll').mockResolvedValue(mockMyHomeItems);

			// When
			const result = await controller.findAll(mockReq, undefined, undefined, paginationQuery);

			// Then
			expect(service.findAll).toHaveBeenCalledWith(mockUserId, undefined);
			expect(service.findAllPaginated).not.toHaveBeenCalled();
			expect(result).toEqual(mockMyHomeItems);
		});

		it('page=0인 경우 기본 findAll 호출', async () => {
			// Given
			const paginationQuery: PaginationQueryDto = {
				page: 0,
				sortBy: 'createdAt',
				sortOrder: 'desc'
			};
			jest.spyOn(service, 'findAll').mockResolvedValue(mockMyHomeItems);

			// When
			const result = await controller.findAll(mockReq, undefined, undefined, paginationQuery);

			// Then
			expect(service.findAll).toHaveBeenCalledWith(mockUserId, undefined);
			expect(service.findAllPaginated).not.toHaveBeenCalled();
			expect(result).toEqual(mockMyHomeItems);
		});

		it('limit=0인 경우 기본 findAll 호출', async () => {
			// Given
			const paginationQuery: PaginationQueryDto = {
				limit: 0,
				sortBy: 'createdAt',
				sortOrder: 'desc'
			};
			jest.spyOn(service, 'findAll').mockResolvedValue(mockMyHomeItems);

			// When
			const result = await controller.findAll(mockReq, undefined, undefined, paginationQuery);

			// Then
			expect(service.findAll).toHaveBeenCalledWith(mockUserId, undefined);
			expect(service.findAllPaginated).not.toHaveBeenCalled();
			expect(result).toEqual(mockMyHomeItems);
		});

		it('paginationQuery가 undefined인 경우 기본 findAll 호출', async () => {
			// Given
			jest.spyOn(service, 'findAll').mockResolvedValue(mockMyHomeItems);

			// When
			const result = await controller.findAll(mockReq, undefined, undefined, undefined);

			// Then
			expect(service.findAll).toHaveBeenCalledWith(mockUserId, undefined);
			expect(service.findAllPaginated).not.toHaveBeenCalled();
			expect(result).toEqual(mockMyHomeItems);
		});

		it('다양한 sortBy 옵션 테스트', async () => {
			// Given
			const testCases = ['createdAt', 'updatedAt', 'category'];

			for (const sortBy of testCases) {
				const paginationQuery: PaginationQueryDto = {
					page: 1,
					limit: 10,
					sortBy,
					sortOrder: 'asc'
				};
				jest.spyOn(service, 'findAllPaginated').mockResolvedValue(mockPaginatedResult);

				// When
				await controller.findAll(mockReq, undefined, undefined, paginationQuery);

				// Then
				expect(service.findAllPaginated).toHaveBeenCalledWith(
					mockUserId,
					paginationQuery,
					undefined
				);
			}
		});

		it('다양한 sortOrder 옵션 테스트', async () => {
			// Given
			const testCases: Array<'asc' | 'desc'> = ['asc', 'desc'];

			for (const sortOrder of testCases) {
				const paginationQuery: PaginationQueryDto = {
					page: 1,
					limit: 10,
					sortBy: 'createdAt',
					sortOrder
				};
				jest.spyOn(service, 'findAllPaginated').mockResolvedValue(mockPaginatedResult);

				// When
				await controller.findAll(mockReq, undefined, undefined, paginationQuery);

				// Then
				expect(service.findAllPaginated).toHaveBeenCalledWith(
					mockUserId,
					paginationQuery,
					undefined
				);
			}
		});
	});

	it('should be defined', () => {
		expect(controller).toBeDefined();
	});
});
