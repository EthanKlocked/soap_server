import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { DiaryFindDto, MaxCurrentYearConstraint } from './diary.find.dto';

describe('DiaryFindDto', () => {
	describe('MaxCurrentYearConstraint', () => {
		let validator: MaxCurrentYearConstraint;

		beforeEach(() => {
			validator = new MaxCurrentYearConstraint();
		});

		it('should accept current year', () => {
			const currentYear = new Date().getFullYear();
			expect(validator.validate(currentYear)).toBe(true);
		});

		it('should accept past years', () => {
			const pastYear = new Date().getFullYear() - 1;
			expect(validator.validate(pastYear)).toBe(true);
		});

		it('should reject future years', () => {
			const futureYear = new Date().getFullYear() + 1;
			expect(validator.validate(futureYear)).toBe(false);
		});

		it('should accept undefined', () => {
			expect(validator.validate(undefined)).toBe(true);
		});

		it('should accept null', () => {
			expect(validator.validate(null)).toBe(true);
		});

		it('should return correct error message', () => {
			const currentYear = new Date().getFullYear();
			const message = validator.defaultMessage();
			expect(message).toBe(`year must not be greater than ${currentYear}`);
		});
	});

	describe('DiaryFindDto validation', () => {
		it('should pass validation with valid year', async () => {
			const dto = plainToInstance(DiaryFindDto, {
				year: new Date().getFullYear(),
				page: 1,
				limit: 10
			});

			const errors = await validate(dto);
			expect(errors.length).toBe(0);
		});

		it('should fail validation with future year', async () => {
			const dto = plainToInstance(DiaryFindDto, {
				year: new Date().getFullYear() + 1,
				page: 1,
				limit: 10
			});

			const errors = await validate(dto);
			const yearError = errors.find(error => error.property === 'year');
			expect(yearError).toBeDefined();
		});

		it('should pass validation with valid month', async () => {
			const dto = plainToInstance(DiaryFindDto, {
				year: new Date().getFullYear(),
				month: 6,
				page: 1,
				limit: 10
			});

			const errors = await validate(dto);
			expect(errors.length).toBe(0);
		});

		it('should fail validation with invalid month (0)', async () => {
			const dto = plainToInstance(DiaryFindDto, {
				year: new Date().getFullYear(),
				month: 0,
				page: 1,
				limit: 10
			});

			const errors = await validate(dto);
			const monthError = errors.find(error => error.property === 'month');
			expect(monthError).toBeDefined();
		});

		it('should fail validation with invalid month (13)', async () => {
			const dto = plainToInstance(DiaryFindDto, {
				year: new Date().getFullYear(),
				month: 13,
				page: 1,
				limit: 10
			});

			const errors = await validate(dto);
			const monthError = errors.find(error => error.property === 'month');
			expect(monthError).toBeDefined();
		});

		it('should pass validation with boolean isPublic', async () => {
			const dto = plainToInstance(DiaryFindDto, {
				year: new Date().getFullYear(),
				isPublic: true,
				page: 1,
				limit: 10
			});

			const errors = await validate(dto);
			expect(errors.length).toBe(0);
		});

		it('should pass validation with optional fields omitted', async () => {
			const dto = plainToInstance(DiaryFindDto, {
				page: 1,
				limit: 10
			});

			const errors = await validate(dto);
			expect(errors.length).toBe(0);
		});
	});
});
