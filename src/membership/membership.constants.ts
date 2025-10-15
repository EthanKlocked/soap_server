// null = 무제한
export const MEMBERSHIP_LIMITS = {
	DIARY_IMAGES: {
		FREE: 1,
		PREMIUM: 5
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

export const THROTTLE_TTL = 86400; // 24시간
