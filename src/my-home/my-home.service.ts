import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { MyHome } from './schema/my-home.schema';
import { CreateMyHomeDto } from './dto/my-home.create.dto';
import { UpdateMyHomeDto } from './dto/my-home.update.dto';

@Injectable()
export class MyHomeService {
	constructor(@InjectModel(MyHome.name) private myHomeModel: Model<MyHome>) {}

	async create(createMyHomeDto: CreateMyHomeDto): Promise<MyHome> {
		const createdMyHome = new this.myHomeModel(createMyHomeDto);
		return createdMyHome.save();
	}

	async findAll(userId?: string): Promise<MyHome[]> {
		if (userId) {
			return this.myHomeModel.find({ userId }).exec();
		}
		return this.myHomeModel.find().exec();
	}

	async findOne(id: string): Promise<MyHome> {
		const myHome = await this.myHomeModel.findById(id).exec();
		if (!myHome) {
			throw new NotFoundException(`MyHome with ID "${id}" not found`);
		}
		return myHome;
	}

	async update(id: string, updateMyHomeDto: UpdateMyHomeDto): Promise<MyHome> {
		const updatedMyHome = await this.myHomeModel
			.findByIdAndUpdate(id, { $set: updateMyHomeDto }, { new: true })
			.exec();

		if (!updatedMyHome) {
			throw new NotFoundException(`MyHome with ID "${id}" not found`);
		}
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
