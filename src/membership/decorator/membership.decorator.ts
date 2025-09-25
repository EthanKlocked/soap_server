import { SetMetadata } from '@nestjs/common';

export const MEMBERSHIP_KEY = 'membership_required';

/**
 * 멤버십이 필요한 API에 사용하는 데코레이터
 * @param featureType 기능 타입 (향후 기능별 세부 제어용, 현재는 사용하지 않음)
 */
export const RequireMembership = (featureType?: string) =>
	SetMetadata(MEMBERSHIP_KEY, { required: true, featureType });
