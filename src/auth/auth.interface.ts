export interface Payload {
	email: string;
	id: string;
}

export enum SnsValidationResultCase {
	READY = 'ready',
	JOIN = 'join',
	SNS = 'sns',
	LOGIN = 'login'
}

export class SnsValidationInput {
	email: string;
	sns: string;
	token: string;
}

export interface SnsValidationResult {
	resultCase: SnsValidationResultCase;
	resultValue: string;
	auth?: {
		id: string;
		email: string;
	};
}
