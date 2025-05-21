import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
	MyHome,
	CategoryType,
	ContentType,
	MovieContent,
	MusicContent,
	YoutubeContent,
	BookContent
} from './schema/my-home.schema';
import { CreateMyHomeDto } from './dto/my-home.create.dto';
import { UpdateMyHomeDto } from './dto/my-home.update.dto';
import { assertNever } from '@src/lib/common';

@Injectable()
export class MyHomeService {
	constructor(@InjectModel(MyHome.name) private myHomeModel: Model<MyHome>) {}

	async create(createMyHomeDto: CreateMyHomeDto): Promise<MyHome> {
		try {
			const createdMyHome = new this.myHomeModel(createMyHomeDto);
			return await createdMyHome.save();
		} catch (error) {
			// MongoDB 중복 키 에러 (E11000)
			if (error.code === 11000 || error.name === 'ConflictException') {
				throw new ConflictException(
					this.generateDuplicateErrorMessage(
						createMyHomeDto.category,
						createMyHomeDto.content
					)
				);
			}
			throw error;
		}
	}

	async findAll(userId: string, category?: CategoryType): Promise<MyHome[]> {
		const query = {
			...{ userId },
			...(category && { category })
		};

		return this.myHomeModel.find(query).exec();
	}

	async findOne(id: string): Promise<MyHome> {
		const myHome = await this.myHomeModel.findById(id).exec();
		if (!myHome) {
			throw new NotFoundException(`MyHome with ID "${id}" not found`);
		}
		return myHome;
	}

	async update(
		id: string,
		updateMyHomeDto: UpdateMyHomeDto | Partial<MyHome['content']>
	): Promise<MyHome> {
		const existingMyHome = await this.myHomeModel.findById(id).exec();

		if (!existingMyHome) {
			throw new NotFoundException(`MyHome with ID "${id}" not found`);
		}

		// 최상위 레벨 필드 업데이트
		if ('review' in updateMyHomeDto) {
			existingMyHome.review = updateMyHomeDto.review;
		}

		// content 필드 업데이트
		if ('content' in updateMyHomeDto && updateMyHomeDto.content) {
			existingMyHome.content = {
				...existingMyHome.content,
				...updateMyHomeDto.content
			};
		} else if (!('review' in updateMyHomeDto)) {
			// updateMyHomeDto가 Partial<MyHome['content']>인 경우
			existingMyHome.content = {
				...existingMyHome.content,
				...updateMyHomeDto
			};
		}

		try {
			const updatedMyHome = await existingMyHome.save();
			return updatedMyHome;
		} catch (error) {
			// MongoDB 중복 키 에러 (E11000)
			if (error.code === 11000) {
				throw new ConflictException(
					this.generateDuplicateErrorMessage(
						existingMyHome.category,
						existingMyHome.content
					)
				);
			}
			throw error;
		}
	}

	async remove(id: string): Promise<MyHome> {
		const deletedMyHome = await this.myHomeModel.findByIdAndDelete(id).exec();
		if (!deletedMyHome) {
			throw new NotFoundException(`MyHome with ID "${id}" not found`);
		}
		return deletedMyHome;
	}

	// 중복 체크 메서드
	async checkDuplicate(
		userId: string,
		category: CategoryType,
		content: ContentType
	): Promise<void> {
		const query = this.buildDuplicateCheckQuery(userId, category, content);
		const count = await this.myHomeModel.countDocuments(query);

		if (count > 0) {
			throw new ConflictException(this.generateDuplicateErrorMessage(category, content));
		}
	}

	// 업데이트 시 중복 체크 (자기 자신 제외)
	async checkDuplicateForUpdate(
		userId: string,
		category: CategoryType,
		content: ContentType,
		currentId: string
	): Promise<void> {
		const query = {
			...this.buildDuplicateCheckQuery(userId, category, content),
			_id: { $ne: currentId } // 현재 문서 제외
		};

		const count = await this.myHomeModel.countDocuments(query);

		if (count > 0) {
			throw new ConflictException(this.generateDuplicateErrorMessage(category, content));
		}
	}

	// 중복 체크 쿼리 생성
	private buildDuplicateCheckQuery(
		userId: string,
		category: CategoryType,
		content: ContentType
	): any {
		const baseQuery = { userId, category };

		switch (category) {
			case CategoryType.MOVIE:
				const movieContent = content as MovieContent;
				return {
					...baseQuery,
					'content.title': movieContent.title,
					'content.director': movieContent.director
				};

			case CategoryType.MUSIC:
				const musicContent = content as MusicContent;
				return {
					...baseQuery,
					'content.title': musicContent.title,
					'content.artist': musicContent.artist
				};

			case CategoryType.YOUTUBE:
				const youtubeContent = content as YoutubeContent;
				return {
					...baseQuery,
					'content.url': youtubeContent.url
				};

			case CategoryType.BOOK:
				const bookContent = content as BookContent;
				return {
					...baseQuery,
					'content.title': bookContent.title,
					'content.author': bookContent.author
				};

			default:
				return assertNever(category);
		}
	}

	// 중복 관련 에러 메시지 생성
	private generateDuplicateErrorMessage(category: CategoryType, content: ContentType): string {
		switch (category) {
			case CategoryType.MOVIE:
				const movieContent = content as MovieContent;
				return `영화 '${movieContent.title}' (감독: ${movieContent.director})는 이미 추가되어 있습니다.`;

			case CategoryType.MUSIC:
				const musicContent = content as MusicContent;
				return `음악 '${musicContent.title}' (아티스트: ${musicContent.artist})는 이미 추가되어 있습니다.`;

			case CategoryType.YOUTUBE:
				const youtubeContent = content as YoutubeContent;
				return `유튜브 영상 '${youtubeContent.title}'은 이미 추가되어 있습니다.`;

			case CategoryType.BOOK:
				const bookContent = content as BookContent;
				return `책 '${bookContent.title}' (저자: ${bookContent.author})는 이미 추가되어 있습니다.`;

			default:
				return assertNever(category);
		}
	}

	// 고유 필드가 변경되었는지 확인
	private hasUniqueFieldsChanged(
		oldContent: ContentType,
		newContent: ContentType,
		category: CategoryType
	): boolean {
		switch (category) {
			case CategoryType.MOVIE:
				return (
					(oldContent as any).title !== (newContent as any).title ||
					(oldContent as any).director !== (newContent as any).director
				);

			case CategoryType.MUSIC:
				return (
					(oldContent as any).title !== (newContent as any).title ||
					(oldContent as any).artist !== (newContent as any).artist
				);

			case CategoryType.YOUTUBE:
				return (oldContent as any).url !== (newContent as any).url;

			case CategoryType.BOOK:
				return (
					(oldContent as any).title !== (newContent as any).title ||
					(oldContent as any).author !== (newContent as any).author
				);

			default:
				return false;
		}
	}
}
