import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { ApiResponse, ApiSecurity, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '@src/auth/guard/jwt.guard';
import { ApiGuard } from '@src/auth/guard/api.guard';
import { MembershipService } from './membership.service';

@UseGuards(ApiGuard, JwtAuthGuard)
@ApiSecurity('api-key')
@ApiSecurity('x-access-token')
@ApiTags('Membership')
@Controller('membership')
export class MembershipController {
	constructor(private readonly membershipService: MembershipService) {}

	@Get('check')
	@ApiOperation({
		summary: '멤버십 활성 여부 확인',
		description: '현재 로그인한 사용자의 멤버십 활성 여부를 확인합니다.'
	})
	@ApiResponse({
		status: 200,
		description: '멤버십 체크 결과',
		schema: {
			type: 'object',
			properties: {
				hasMembership: { type: 'boolean', example: true },
				message: { type: 'string', example: '멤버십이 활성화되어 있습니다.' }
			}
		}
	})
	@ApiResponse({ status: 400, description: 'Request without API KEY' })
	@ApiResponse({ status: 403, description: 'Invalid API KEY' })
	@ApiResponse({ status: 500, description: 'Server Error' })
	async checkMembership(@Request() req) {
		const hasMembership = await this.membershipService.hasMembership(req.user.id);

		return {
			hasMembership,
			message: hasMembership ? '멤버십이 활성화되어 있습니다.' : '활성화된 멤버십이 없습니다.'
		};
	}

	@Get('current')
	@ApiOperation({
		summary: '현재 멤버십 정보 조회',
		description: '현재 로그인한 사용자의 활성 멤버십 상세 정보를 조회합니다.'
	})
	@ApiResponse({
		status: 200,
		description: '현재 멤버십 정보',
		schema: {
			type: 'object',
			properties: {
				membership: {
					type: 'object',
					nullable: true,
					properties: {
						id: { type: 'string', example: '507f1f77bcf86cd799439011' },
						membershipType: { type: 'string', example: 'coupon' },
						startDate: { type: 'string', format: 'date-time' },
						endDate: { type: 'string', format: 'date-time' },
						isActive: { type: 'boolean', example: true }
					}
				}
			}
		}
	})
	@ApiResponse({ status: 400, description: 'Request without API KEY' })
	@ApiResponse({ status: 403, description: 'Invalid API KEY' })
	@ApiResponse({ status: 500, description: 'Server Error' })
	async getCurrentMembership(@Request() req) {
		const membership = await this.membershipService.getCurrentMembership(req.user.id);

		return {
			membership: membership?.readOnlyData || null
		};
	}

	@Get('history')
	@ApiOperation({
		summary: '멤버십 이력 조회',
		description: '현재 로그인한 사용자의 모든 멤버십 이력을 조회합니다.'
	})
	@ApiResponse({
		status: 200,
		description: '멤버십 이력 목록',
		schema: {
			type: 'object',
			properties: {
				memberships: {
					type: 'array',
					items: {
						type: 'object',
						properties: {
							id: { type: 'string', example: '507f1f77bcf86cd799439011' },
							membershipType: { type: 'string', example: 'coupon' },
							startDate: { type: 'string', format: 'date-time' },
							endDate: { type: 'string', format: 'date-time' },
							isActive: { type: 'boolean', example: true },
							createdAt: { type: 'string', format: 'date-time' }
						}
					}
				}
			}
		}
	})
	@ApiResponse({ status: 400, description: 'Request without API KEY' })
	@ApiResponse({ status: 403, description: 'Invalid API KEY' })
	@ApiResponse({ status: 500, description: 'Server Error' })
	async getMembershipHistory(@Request() req) {
		const memberships = await this.membershipService.getMembershipHistory(req.user.id);

		return {
			memberships: memberships.map(m => m.readOnlyData)
		};
	}
}
