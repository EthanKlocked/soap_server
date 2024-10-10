//####### REACTION CONFIG ########
export enum ReactionType {
	Best = 'best',
	Funny = 'funny',
	Touching = 'touching',
	Good = 'good',
	Empathy = 'empathy',
	Sad = 'sad',
	Angry = 'angry',
	Amazing = 'amazing',
	Support = 'support',
	Cheer = 'cheer'
}

export type ReactionMap = {
	[key in ReactionType]: string[]; // Array of user ids for each reaction type
};

export const defaultReactions: ReactionMap = {
	[ReactionType.Best]: [],
	[ReactionType.Funny]: [],
	[ReactionType.Touching]: [],
	[ReactionType.Good]: [],
	[ReactionType.Empathy]: [],
	[ReactionType.Sad]: [],
	[ReactionType.Angry]: [],
	[ReactionType.Amazing]: [],
	[ReactionType.Support]: [],
	[ReactionType.Cheer]: []
};

//####### EMOTION CONFIG ########
export const validEmotionList = [
	'happy', // 행복한
	'good', // 기분좋은
	'joyful', // 즐거운 (fun에서 변경됨)
	'excited', // 설레는
	'proud', // 뿌듯한
	'calm', // 편안한
	'tired', // 피곤한
	'lonely', // 외로운
	'sad', // 슬픈
	'down', // 우울한
	'worried', // 불안한
	'angry' // 화난
] as const;

export type ValidEmotion = (typeof validEmotionList)[number];
