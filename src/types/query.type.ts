import { SortOrder } from 'mongoose';

export interface DiaryFindOption {
	userId: string;
	date?: {
		$gte: Date;
		$lte: Date;
	};
}

export type SortOption = {
	[key: string]: SortOrder;
};
