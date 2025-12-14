import {
	Body,
	Controller,
	Post,
	Get,
	Delete,
	UseGuards,
	Request,
	Param,
	HttpCode,
	HttpStatus
} from '@nestjs/common';
import {
	ApiResponse,
	ApiSecurity,
	ApiOperation,
	ApiTags,
	ApiBody,
	ApiParam
} from '@nestjs/swagger';
import { JwtAuthGuard } from '@src/auth/guard/jwt.guard';
import { ApiGuard } from '@src/auth/guard/api.guard';
import { CouponService } from './coupon.service';
import { CouponCreateDto } from './dto/coupon.create.dto';
import { CouponRegisterDto } from './dto/coupon.register.dto';

@UseGuards(ApiGuard, JwtAuthGuard)
@ApiSecurity('api-key')
@ApiSecurity('x-access-token')
@ApiTags('Coupon')
@Controller('coupon')
export class CouponController {
	constructor(private readonly couponService: CouponService) {}

	// TODO: 추후 관리자 인증 시스템 구축 후 JwtAuthGuard 복구 필요
	// 현재는 테스트를 위해 API Key만 체크
	@Post('create')
	@UseGuards(ApiGuard)
	@HttpCode(HttpStatus.CREATED)
	@ApiOperation({
		summary: '쿠폰 생성 (관리자용)',
		description: '새로운 쿠폰을 생성합니다. 현재는 API 키만 필요합니다. (추후 관리자 인증 추가 예정)'
	})
	@ApiBody({ type: CouponCreateDto })
	@ApiResponse({
		status: 201,
		description: '쿠폰 생성 성공',
		schema: {
			type: 'object',
			properties: {
				id: { type: 'string', example: '507f1f77bcf86cd799439011' },
				code: { type: 'string', example: 'FUNDING2024' },
				isUsed: { type: 'boolean', example: false },
				validUntil: { type: 'string', format: 'date-time' },
				expiredDate: { type: 'string', format: 'date-time' },
				membershipDuration: { type: 'number', example: 30 },
				description: { type: 'string', example: '펀딩 참여자 전용 쿠폰' },
				createdAt: { type: 'string', format: 'date-time' },
				updatedAt: { type: 'string', format: 'date-time' }
			}
		}
	})
	@ApiResponse({ status: 400, description: 'Request without API KEY' })
	@ApiResponse({ status: 403, description: 'Invalid API KEY' })
	@ApiResponse({ status: 409, description: '이미 존재하는 쿠폰 코드입니다.' })
	@ApiResponse({ status: 500, description: 'Server Error' })
	async create(@Body() couponCreateDto: CouponCreateDto) {
		const coupon = await this.couponService.create(couponCreateDto);
		return coupon.readOnlyData;
	}

	@Post('register')
	@HttpCode(HttpStatus.OK)
	@ApiOperation({
		summary: '쿠폰 등록 (사용자용)',
		description: '쿠폰 코드를 입력하여 멤버십을 활성화합니다.'
	})
	@ApiBody({ type: CouponRegisterDto })
	@ApiResponse({
		status: 200,
		description: '쿠폰 등록 성공',
		schema: {
			type: 'object',
			properties: {
				success: { type: 'boolean', example: true },
				membership: {
					type: 'object',
					properties: {
						id: { type: 'string', example: '507f1f77bcf86cd799439011' },
						membershipType: { type: 'string', example: 'coupon' },
						startDate: { type: 'string', format: 'date-time' },
						endDate: { type: 'string', format: 'date-time' },
						isActive: { type: 'boolean', example: true }
					}
				},
				message: { type: 'string', example: '쿠폰이 성공적으로 등록되었습니다.' }
			}
		}
	})
	@ApiResponse({
		status: 400,
		description: 'Bad Request - 잘못된 쿠폰 코드 또는 이미 사용된 쿠폰'
	})
	@ApiResponse({ status: 403, description: 'Invalid API KEY' })
	@ApiResponse({ status: 404, description: '존재하지 않는 쿠폰 코드입니다.' })
	@ApiResponse({ status: 500, description: 'Server Error' })
	async register(@Request() req, @Body() couponRegisterDto: CouponRegisterDto) {
		return await this.couponService.register(req.user.id, couponRegisterDto);
	}

	@Get('list')
	@ApiOperation({
		summary: '쿠폰 목록 조회 (관리자용)',
		description: '모든 쿠폰 목록을 조회합니다. 관리자 권한이 필요합니다.'
	})
	@ApiResponse({
		status: 200,
		description: '쿠폰 목록 조회 성공',
		schema: {
			type: 'array',
			items: {
				type: 'object',
				properties: {
					id: { type: 'string' },
					code: { type: 'string' },
					isUsed: { type: 'boolean' },
					validUntil: { type: 'string', format: 'date-time' },
					expiredDate: { type: 'string', format: 'date-time' },
					membershipDuration: { type: 'number' },
					description: { type: 'string' },
					createdAt: { type: 'string', format: 'date-time' }
				}
			}
		}
	})
	@ApiResponse({ status: 400, description: 'Request without API KEY' })
	@ApiResponse({ status: 403, description: 'Invalid API KEY' })
	@ApiResponse({ status: 500, description: 'Server Error' })
	async findAll() {
		const coupons = await this.couponService.findAll();
		return coupons.map(coupon => coupon.readOnlyData);
	}

	@Get(':code')
	@ApiOperation({
		summary: '쿠폰 조회 (관리자용)',
		description: '특정 쿠폰의 상세 정보를 조회합니다. 관리자 권한이 필요합니다.'
	})
	@ApiParam({ name: 'code', description: '쿠폰 코드', example: 'FUNDING2024' })
	@ApiResponse({
		status: 200,
		description: '쿠폰 조회 성공',
		schema: {
			type: 'object',
			properties: {
				id: { type: 'string' },
				code: { type: 'string' },
				isUsed: { type: 'boolean' },
				validUntil: { type: 'string', format: 'date-time' },
				expiredDate: { type: 'string', format: 'date-time' },
				membershipDuration: { type: 'number' },
				description: { type: 'string' },
				createdAt: { type: 'string', format: 'date-time' },
				updatedAt: { type: 'string', format: 'date-time' }
			}
		}
	})
	@ApiResponse({ status: 400, description: 'Request without API KEY' })
	@ApiResponse({ status: 403, description: 'Invalid API KEY' })
	@ApiResponse({ status: 404, description: '존재하지 않는 쿠폰 코드입니다.' })
	@ApiResponse({ status: 500, description: 'Server Error' })
	async findOne(@Param('code') code: string) {
		const coupon = await this.couponService.findOne(code);
		return coupon.readOnlyData;
	}

	@Delete(':code')
	@ApiOperation({
		summary: '쿠폰 삭제 (관리자용)',
		description: '특정 쿠폰을 삭제합니다. 관리자 권한이 필요합니다.'
	})
	@ApiParam({ name: 'code', description: '쿠폰 코드', example: 'FUNDING2024' })
	@ApiResponse({
		status: 200,
		description: '쿠폰 삭제 성공',
		schema: {
			type: 'object',
			properties: {
				message: { type: 'string', example: '쿠폰이 삭제되었습니다.' },
				deletedCoupon: {
					type: 'object',
					properties: {
						code: { type: 'string' },
						description: { type: 'string' }
					}
				}
			}
		}
	})
	@ApiResponse({ status: 400, description: 'Request without API KEY' })
	@ApiResponse({ status: 403, description: 'Invalid API KEY' })
	@ApiResponse({ status: 404, description: '존재하지 않는 쿠폰 코드입니다.' })
	@ApiResponse({ status: 500, description: 'Server Error' })
	async remove(@Param('code') code: string) {
		const deletedCoupon = await this.couponService.remove(code);
		return {
			message: '쿠폰이 삭제되었습니다.',
			deletedCoupon: {
				code: deletedCoupon.code,
				description: deletedCoupon.description
			}
		};
	}
}
