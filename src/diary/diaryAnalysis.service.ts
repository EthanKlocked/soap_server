import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Diary } from '@src/diary/schema/diary.schema';
import { DiaryAnalysis } from '@src/diary/schema/diaryAnalysis.schema';
import { ClientSession } from 'mongoose';
import { BlockedUser } from '@src/user/schema/blockedUser.schema';
import { UserService } from '@src/user/user.service';

@Injectable()
export class DiaryAnalysisService {
	constructor(
		@InjectModel(Diary.name) private diaryModel: Model<Diary>,
		@InjectModel(DiaryAnalysis.name) private diaryAnalysisModel: Model<DiaryAnalysis>,
		@InjectModel(BlockedUser.name) private blockedUserModel: Model<BlockedUser>,
		private readonly userService: UserService
	) {}

	async getSimilarUsers(userId: string, limit: number = 5, diaryId?: string): Promise<any[]> {
		try {
			const userAnalysesOption = diaryId ? { userId, diaryId } : { userId };
			const userAnalyses = await this.diaryAnalysisModel.find(userAnalysesOption).lean();

			// search only for available datasets
			const blockedUsers = await this.blockedUserModel
				.find({ userId })
				.distinct('blockedUserId');
			const publicDiaryIds = await this.diaryModel
				.find({ userId: { $ne: userId, $nin: blockedUsers }, isPublic: true })
				.distinct('_id');
			const allUserAnalyses = await this.diaryAnalysisModel
				.find({
					userId: { $ne: userId },
					diaryId: { $in: publicDiaryIds }
				})
				.lean();

			const userProfile = this.createUserProfile(userAnalyses);
			const otherUserProfiles = this.groupAnalysesByUser(allUserAnalyses);

			const similarityScores = Object.entries(otherUserProfiles).map(
				([otherUserId, analyses]) => {
					const otherUserProfile = this.createUserProfile(analyses);
					const score = this.calculateProfileSimilarity(userProfile, otherUserProfile);
					const adjustedScore = this.adjustSimilarityScore(score);
					return { userId: otherUserId, score: adjustedScore };
				}
			);

			const topSimilarUsers = similarityScores
				.sort((a, b) => b.score - a.score)
				.slice(0, limit);

			//return extra info added
			const resultSimilarUsers = await Promise.all(
				topSimilarUsers.map(async user => {
					const userData = await this.userService.findProfile(user.userId);
					return {
						userId: user.userId,
						userName: userData.name,
						score: user.score
					};
				})
			);

			return resultSimilarUsers;
		} catch (e) {
			throw new InternalServerErrorException(
				'An unexpected error occurred while getting similar users'
			);
		}
	}

	private createUserProfile(analyses: any[]): any {
		return {
			categories: this.countOccurrences(analyses, 'category'),
			subcategories: this.countOccurrences(analyses.flatMap(a => a.subcategories || [])),
			emotions: this.countOccurrences(
				analyses.flatMap(a => [a.primaryEmotion, a.secondaryEmotion].filter(Boolean))
			),
			keywords: this.countOccurrences(analyses.flatMap(a => a.keywords || [])),
			tones: this.countOccurrences(analyses, 'tone'),
			timeFocus: this.countOccurrences(analyses, 'timeFocus')
		};
	}

	private groupAnalysesByUser(analyses: any[]): { [userId: string]: any[] } {
		return analyses.reduce((groups, analysis) => {
			const userId = analysis.userId.toString();
			if (!groups[userId]) groups[userId] = [];
			groups[userId].push(analysis);
			return groups;
		}, {});
	}

	private countOccurrences(items: any[], key?: string): { [item: string]: number } {
		return items.reduce((counts, item) => {
			const value = key ? item[key] : item;
			if (value) counts[value] = (counts[value] || 0) + 1;
			return counts;
		}, {});
	}

	private calculateProfileSimilarity(profile1: any, profile2: any): number {
		const weights = {
			categories: 0.25,
			subcategories: 0.2,
			emotions: 0.25,
			keywords: 0.15,
			tones: 0.1,
			timeFocus: 0.05
		};

		let totalSimilarity = 0;
		let totalWeight = 0;

		for (const [key, weight] of Object.entries(weights)) {
			const similarity = this.calculateJaccardSimilarity(profile1[key], profile2[key]);
			totalSimilarity += weight * similarity;
			totalWeight += weight;
		}

		return totalSimilarity / totalWeight;
	}

	private calculateJaccardSimilarity(
		set1: { [key: string]: number },
		set2: { [key: string]: number }
	): number {
		const keys1 = Object.keys(set1);
		const keys2 = Object.keys(set2);
		const intersectionSize = keys1.filter(k => keys2.includes(k)).length;
		const unionSize = new Set([...keys1, ...keys2]).size;
		return intersectionSize / unionSize;
	}

	private adjustSimilarityScore(score: number): number {
		const adjustedScore = 50 + score * 50;
		return Math.round(adjustedScore * 100) / 100;
	}
}
