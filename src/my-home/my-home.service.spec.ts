import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { MyHomeService } from './my-home.service';
import { MyHome, CategoryType } from './schema/my-home.schema';
import { PaginationQueryDto } from './dto/pagination.dto';

describe('MyHomeService', () => {
	let service: MyHomeService;
	let mockMyHomeModel: any;

	// Mock 데이터 생성
	const mockUserId = '507f1f77bcf86cd799439011';
	const mockMyHomeItems = [
		{
			_id: '1',
			category: CategoryType.MUSIC,
			review: 'Great music',
			content: { title: 'Song 1', artist: 'Artist 1' },
			userId: mockUserId,
			createdAt: new Date('2024-01-01'),
			updatedAt: new Date('2024-01-01')
		},
		{
			_id: '2',
			category: CategoryType.MOVIE,
			review: 'Good movie',
			content: { title: 'Movie 1', director: 'Director 1' },
			userId: mockUserId,
			createdAt: new Date('2024-01-02'),
			updatedAt: new Date('2024-01-02')
		},
		{
			_id: '3',
			category: CategoryType.MUSIC,
			review: 'Another great song',
			content: { title: 'Song 2', artist: 'Artist 2' },
			userId: mockUserId,
			createdAt: new Date('2024-01-03'),
			updatedAt: new Date('2024-01-03')
		}
	];

	// Mock Model 생성
	const mockQuery = {
		sort: jest.fn().mockReturnThis(),
		skip: jest.fn().mockReturnThis(),
		limit: jest.fn().mockReturnThis(),
		exec: jest.fn()
	};

	beforeEach(async () => {
		mockMyHomeModel = {
			countDocuments: jest.fn(),
			find: jest.fn(() => mockQuery),
			findById: jest.fn(),
			create: jest.fn(),
			findByIdAndUpdate: jest.fn(),
			findByIdAndDelete: jest.fn()
		};

		const module: TestingModule = await Test.createTestingModule({
			providers: [
				MyHomeService,
				{
					provide: getModelToken(MyHome.name),
					useValue: mockMyHomeModel
				}
			]
		}).compile();

		service = module.get<MyHomeService>(MyHomeService);
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	describe('findAllPaginated', () => {
		it('기본 페이지네이션 동작 테스트 (page=1, limit=10)', async () => {
			// Given
			const paginationQuery: PaginationQueryDto = {
				page: 1,
				limit: 10,
				sortBy: 'createdAt',
				sortOrder: 'desc'
			};

			mockMyHomeModel.countDocuments.mockResolvedValue(15);
			mockQuery.exec.mockResolvedValue(mockMyHomeItems);

			// When
			const result = await service.findAllPaginated(mockUserId, paginationQuery);

			// Then
			expect(mockMyHomeModel.countDocuments).toHaveBeenCalledWith({ userId: mockUserId });
			expect(mockMyHomeModel.find).toHaveBeenCalledWith({ userId: mockUserId });
			expect(mockQuery.sort).toHaveBeenCalledWith({ createdAt: -1 });
			expect(mockQuery.skip).toHaveBeenCalledWith(0);
			expect(mockQuery.limit).toHaveBeenCalledWith(10);

			expect(result).toEqual({
				data: mockMyHomeItems,
				meta: {
					currentPage: 1,
					itemsPerPage: 10,
					totalItems: 15,
					totalPages: 2,
					hasNextPage: true,
					hasPreviousPage: false
				}
			});
		});

		it('두 번째 페이지 조회 테스트', async () => {
			// Given
			const paginationQuery: PaginationQueryDto = {
				page: 2,
				limit: 5,
				sortBy: 'createdAt',
				sortOrder: 'desc'
			};

			mockMyHomeModel.countDocuments.mockResolvedValue(12);
			mockQuery.exec.mockResolvedValue(mockMyHomeItems.slice(5, 10));

			// When
			const result = await service.findAllPaginated(mockUserId, paginationQuery);

			// Then
			expect(mockQuery.skip).toHaveBeenCalledWith(5); // (2-1) * 5
			expect(mockQuery.limit).toHaveBeenCalledWith(5);

			expect(result.meta).toEqual({
				currentPage: 2,
				itemsPerPage: 5,
				totalItems: 12,
				totalPages: 3,
				hasNextPage: true,
				hasPreviousPage: true
			});
		});

		it('마지막 페이지 조회 테스트', async () => {
			// Given
			const paginationQuery: PaginationQueryDto = {
				page: 3,
				limit: 5,
				sortBy: 'createdAt',
				sortOrder: 'desc'
			};

			mockMyHomeModel.countDocuments.mockResolvedValue(12);
			mockQuery.exec.mockResolvedValue(mockMyHomeItems.slice(10, 12));

			// When
			const result = await service.findAllPaginated(mockUserId, paginationQuery);

			// Then
			expect(result.meta).toEqual({
				currentPage: 3,
				itemsPerPage: 5,
				totalItems: 12,
				totalPages: 3,
				hasNextPage: false,
				hasPreviousPage: true
			});
		});

		it('오름차순 정렬 테스트', async () => {
			// Given
			const paginationQuery: PaginationQueryDto = {
				page: 1,
				limit: 10,
				sortBy: 'updatedAt',
				sortOrder: 'asc'
			};

			mockMyHomeModel.countDocuments.mockResolvedValue(3);
			mockQuery.exec.mockResolvedValue(mockMyHomeItems);

			// When
			await service.findAllPaginated(mockUserId, paginationQuery);

			// Then
			expect(mockQuery.sort).toHaveBeenCalledWith({ updatedAt: 1 });
		});

		it('빈 결과 처리 테스트', async () => {
			// Given
			const paginationQuery: PaginationQueryDto = {
				page: 1,
				limit: 10,
				sortBy: 'createdAt',
				sortOrder: 'desc'
			};

			mockMyHomeModel.countDocuments.mockResolvedValue(0);
			mockQuery.exec.mockResolvedValue([]);

			// When
			const result = await service.findAllPaginated(mockUserId, paginationQuery);

			// Then
			expect(result).toEqual({
				data: [],
				meta: {
					currentPage: 1,
					itemsPerPage: 10,
					totalItems: 0,
					totalPages: 0,
					hasNextPage: false,
					hasPreviousPage: false
				}
			});
		});

		it('기본값 테스트 (page와 limit가 undefined인 경우)', async () => {
			// Given
			const paginationQuery: PaginationQueryDto = {};

			mockMyHomeModel.countDocuments.mockResolvedValue(5);
			mockQuery.exec.mockResolvedValue(mockMyHomeItems);

			// When
			const result = await service.findAllPaginated(mockUserId, paginationQuery);

			// Then
			expect(mockQuery.skip).toHaveBeenCalledWith(0); // (1-1) * 10
			expect(mockQuery.limit).toHaveBeenCalledWith(10);
			expect(mockQuery.sort).toHaveBeenCalledWith({ createdAt: -1 });

			expect(result.meta.currentPage).toBe(1);
			expect(result.meta.itemsPerPage).toBe(10);
		});

		it('다양한 sortBy 옵션 테스트', async () => {
			// Given
			const paginationQuery: PaginationQueryDto = {
				page: 1,
				limit: 10,
				sortBy: 'category',
				sortOrder: 'asc'
			};

			mockMyHomeModel.countDocuments.mockResolvedValue(3);
			mockQuery.exec.mockResolvedValue(mockMyHomeItems);

			// When
			await service.findAllPaginated(mockUserId, paginationQuery);

			// Then
			expect(mockQuery.sort).toHaveBeenCalledWith({ category: 1 });
		});

		it('페이지 수 계산 정확성 테스트', async () => {
			// Given
			const testCases = [
				{ totalItems: 0, limit: 10, expectedPages: 0 },
				{ totalItems: 5, limit: 10, expectedPages: 1 },
				{ totalItems: 10, limit: 10, expectedPages: 1 },
				{ totalItems: 11, limit: 10, expectedPages: 2 },
				{ totalItems: 20, limit: 10, expectedPages: 2 },
				{ totalItems: 21, limit: 10, expectedPages: 3 }
			];

			for (const testCase of testCases) {
				const paginationQuery: PaginationQueryDto = {
					page: 1,
					limit: testCase.limit,
					sortBy: 'createdAt',
					sortOrder: 'desc'
				};

				mockMyHomeModel.countDocuments.mockResolvedValue(testCase.totalItems);
				mockQuery.exec.mockResolvedValue([]);

				// When
				const result = await service.findAllPaginated(mockUserId, paginationQuery);

				// Then
				expect(result.meta.totalPages).toBe(testCase.expectedPages);
				expect(result.meta.totalItems).toBe(testCase.totalItems);
			}
		});
	});

	it('should be defined', () => {
		expect(service).toBeDefined();
	});
});
