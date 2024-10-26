export type PushMessageKey = 'request_soaf';

export const PUSH_MESSAGE_LIST: {
	[key in PushMessageKey]: {
		title: string;
		description: string;
	};
} = {
	request_soaf: {
		title: '소프 신청이 도착했어요',
		description: '{nickname}님, 운명의 상대를 만나러 가보실까요?'
	}
};
