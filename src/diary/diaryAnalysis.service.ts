import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Diary } from '@src/diary/schema/diary.schema';
import { DiaryAnalysis } from '@src/diary/schema/diaryAnalysis.schema';
import { ConfigService } from '@nestjs/config';
import { ClientSession } from 'mongoose';

@Injectable()
export class DiaryAnalysisService {
  constructor(
    @InjectModel(Diary.name) private diaryModel: Model<Diary>,
    @InjectModel(DiaryAnalysis.name)
    private diaryAnalysisModel: Model<DiaryAnalysis>,
    private configService: ConfigService,
  ) {}

  async getSimilarUsers(userId: string, limit: number = 5): Promise<any[]> {
    try {
      const userAnalyses = await this.diaryAnalysisModel
        .find({ userId })
        .lean();
      const allUserAnalyses = await this.diaryAnalysisModel
        .find({ userId: { $ne: userId } })
        .lean();

      const userProfile = this.createUserProfile(userAnalyses);
      const otherUserProfiles = this.groupAnalysesByUser(allUserAnalyses);

      const similarityScores = Object.entries(otherUserProfiles).map(
        ([otherUserId, analyses]) => {
          const otherUserProfile = this.createUserProfile(analyses);
          const score = this.calculateProfileSimilarity(
            userProfile,
            otherUserProfile,
          );
          return { userId: otherUserId, score };
        },
      );

      return similarityScores.sort((a, b) => b.score - a.score).slice(0, limit);
    } catch (e) {
      throw new InternalServerErrorException(
        'An unexpected error occurred while getting similar users',
      );
    }
  }

  private createUserProfile(analyses: any[]): any {
    return {
      categories: this.countOccurrences(analyses, 'category'),
      subcategories: this.countOccurrences(
        analyses.flatMap((a) => a.subcategories || []),
      ),
      emotions: this.countOccurrences(
        analyses.flatMap((a) =>
          [a.primaryEmotion, a.secondaryEmotion].filter(Boolean),
        ),
      ),
      keywords: this.countOccurrences(
        analyses.flatMap((a) => a.keywords || []),
      ),
      tones: this.countOccurrences(analyses, 'tone'),
      timeFocus: this.countOccurrences(analyses, 'timeFocus'),
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

  private countOccurrences(
    items: any[],
    key?: string,
  ): { [item: string]: number } {
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
      timeFocus: 0.05,
    };

    let totalSimilarity = 0;
    let totalWeight = 0;

    for (const [key, weight] of Object.entries(weights)) {
      const similarity = this.calculateJaccardSimilarity(
        profile1[key],
        profile2[key],
      );
      totalSimilarity += weight * similarity;
      totalWeight += weight;
    }

    return totalSimilarity / totalWeight;
  }

  private calculateJaccardSimilarity(
    set1: { [key: string]: number },
    set2: { [key: string]: number },
  ): number {
    const keys1 = Object.keys(set1);
    const keys2 = Object.keys(set2);
    const intersectionSize = keys1.filter((k) => keys2.includes(k)).length;
    const unionSize = new Set([...keys1, ...keys2]).size;
    return intersectionSize / unionSize;
  }

  //case user deleted
  async deleteAllByUserId(
    userId: string,
    session?: ClientSession,
  ): Promise<void> {
    await this.diaryAnalysisModel
      .deleteMany({ userId })
      .session(session)
      .exec();
  }
}
