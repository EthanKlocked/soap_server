import { Injectable, NotFoundException } from '@nestjs/common';
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

@Injectable()
export class MyHomeService {
	constructor(@InjectModel(MyHome.name) private myHomeModel: Model<MyHome>) {}

	async create(createMyHomeDto: CreateMyHomeDto): Promise<MyHome> {
		try {
			const createdMyHome = new this.myHomeModel(createMyHomeDto);
			return await createdMyHome.save();
		} catch (error) {
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

	// 중복 체크 메서드 (boolean 반환)
	async checkDuplicate(
		userId: string,
		category: CategoryType,
		content: ContentType
	): Promise<boolean> {
		const query = this.buildDuplicateCheckQuery(userId, category, content);
		const count = await this.myHomeModel.countDocuments(query);
		return count > 0;
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
				throw new Error(`Unsupported category: ${category}`);
		}
	}
}
