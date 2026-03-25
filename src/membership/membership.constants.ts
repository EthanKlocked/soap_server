// null = 무제한
export const MEMBERSHIP_LIMITS = {
	DIARY_IMAGES: {
		FREE: 5,
		PREMIUM: 10
	},
	FRIEND_REQUEST: {
		FREE: 5,
		PREMIUM: null
	},
	AI_MATCHING: {
		FREE: 5,
		PREMIUM: null
	},
	CONTENT_BOX: {
		FREE: 30,
		PREMIUM: null
	}
} as const;

export const THROTTLE_FEATURES = {
	FRIEND_REQUEST: 'friend_request',
	AI_MATCHING: 'ai_matching'
} as const;

// 광고 보상 보너스 상한 (기능별 하루 최대 광고 보너스 횟수)
export const AD_REWARD_LIMITS = {
	FRIEND_REQUEST: 3,
	AI_MATCHING: 3
} as const;

export const AD_TXN_DEDUP_TTL = 172800; // 48시간
