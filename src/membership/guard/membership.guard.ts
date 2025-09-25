import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { MEMBERSHIP_KEY } from '../decorator/membership.decorator';
import { MembershipService } from '../membership.service';

@Injectable()
export class MembershipGuard implements CanActivate {
	constructor(
		private reflector: Reflector,
		private membershipService: MembershipService
	) {}

	async canActivate(context: ExecutionContext): Promise<boolean> {
		const membershipRequired = this.reflector.getAllAndOverride(MEMBERSHIP_KEY, [
			context.getHandler(),
			context.getClass()
		]);
		if (!membershipRequired || !membershipRequired.required) {
			return true;
		}
		const request = context.switchToHttp().getRequest();
		const user = request.user;
		if (!user || !user.id) {
			throw new ForbiddenException('사용자 인증이 필요합니다.');
		}
		// 멤버십 정보 조회 및 주입 (없어도 null로 주입)
		const membership = await this.membershipService.getCurrentMembership(user.id);
		request.membership = membership; // 있으면 멤버십 객체, 없으면 null
		// 항상 통과 (서비스에서 membership 유무에 따라 로직 분기)
		return true;
	}
}
