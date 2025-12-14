import { IsString, IsDate, IsOptional, IsNumber, MaxLength, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class CouponCreateDto {
	@ApiProperty({
		example: '2030-12-31T23:59:59.999Z',
		description: `쿠폰 등록 가능 마감일 (이 날짜까지만 쿠폰 코드를 입력하여 등록 가능)

• 기본값: 쿠폰 생성 시점으로부터 1년 후
• 예시: 2030-12-31로 설정 시, 2030년 12월 31일까지만 쿠폰 등록 가능
• 이 날짜가 지나면 쿠폰 코드 입력 불가`,
		required: false
	})
	@IsOptional()
	@IsDate()
	@Type(() => Date)
	validUntil?: Date;

	@ApiProperty({
		example: '2030-01-31T23:59:59.999Z',
		description: `멤버십 만료일 (쿠폰으로 활성화된 멤버십이 만료되는 날짜)

• 기본값: 쿠폰 생성 시점으로부터 30일 후
• 예시: 2030-01-31로 설정 시, 쿠폰 등록 즉시 해당 날짜까지 멤버십 유효
• ⚠️ membershipDuration이 설정되어 있으면 이 값은 무시됨`,
		required: false
	})
	@IsOptional()
	@IsDate()
	@Type(() => Date)
	expiredDate?: Date;

	@ApiProperty({
		example: 90,
		description: `멤버십 기간 (일 단위, 쿠폰 등록 시점부터 며칠 동안 멤버십 유효)

• ⭐️ expiredDate보다 우선 적용됨 (둘 다 설정 시 이 값 사용)
• 예시: 90으로 설정 시, 쿠폰 등록일로부터 정확히 90일간 멤버십 유효
• 최소값: 1일
• 사용 권장: 고정 기간 멤버십 제공 시 이 값 사용 (더 명확함)`,
		required: false,
		minimum: 1
	})
	@IsOptional()
	@IsNumber()
	@Min(1)
	membershipDuration?: number;

	@ApiProperty({
		example: '2024 연말 펀딩 참여자 전용 - 3개월 프리미엄 멤버십',
		description: `쿠폰 설명 (관리자용 메모)

• 쿠폰의 용도, 발급 사유 등을 기록
• 최대 200자
• 예시: "크리스마스 이벤트 쿠폰", "얼리버드 후원자 특전" 등`,
		required: false,
		maxLength: 200
	})
	@IsOptional()
	@IsString()
	@MaxLength(200)
	description?: string;
}
