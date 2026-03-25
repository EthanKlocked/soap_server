export enum AdRewardFeature {
	FRIEND_REQUEST = 'friend_request',
	AI_MATCHING = 'ai_matching'
}

export interface AdmobSsvParams {
	ad_network: string;
	ad_unit: string;
	custom_data: string;
	reward_amount: string;
	reward_item: string;
	timestamp: string;
	transaction_id: string;
	user_id: string;
	signature: string;
	key_id: string;
}
