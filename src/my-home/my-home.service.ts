import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { MyHome, CategoryType } from './schema/my-home.schema';
import { CreateMyHomeDto } from './dto/my-home.create.dto';
import { UpdateMyHomeDto } from './dto/my-home.update.dto';

@Injectable()
export class MyHomeService {
	constructor(@InjectModel(MyHome.name) private myHomeModel: Model<MyHome>) {}

	async create(createMyHomeDto: CreateMyHomeDto): Promise<MyHome> {
		const createdMyHome = new this.myHomeModel(createMyHomeDto);
		return createdMyHome.save();
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

		const updatedMyHome = await existingMyHome.save();
		return updatedMyHome;
	}

	async remove(id: string): Promise<MyHome> {
		const deletedMyHome = await this.myHomeModel.findByIdAndDelete(id).exec();
		if (!deletedMyHome) {
			throw new NotFoundException(`MyHome with ID "${id}" not found`);
		}
		return deletedMyHome;
	}
}
