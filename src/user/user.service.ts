import {
  Inject,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
  RequestTimeoutException,
  ConflictException,
  NotFoundException,
  HttpException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { User } from '@src/user/schema/user.schema';
import { Model } from 'mongoose';
import { UserSignupDto } from '@src/user/dto/user.signup.dto';
import { UserUpdateDto } from '@src/user/dto/user.update.dto';
import { Cache } from 'cache-manager';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { generateRandomNumber } from '@src/lib/common';
import { EmailService } from 'src/email/email.service';
import { EmailRequestDto } from '@src/email/dto/email.request.dto';
import { DiaryService } from '@src/diary/diary.service';
import { DiaryAnalysisService } from '@src/diary/diaryAnalysis.service';
import { UserVerifyDto } from './dto/user.verify.dto';
import * as bcrypt from 'bcryptjs';

//onModuleInit interface and addNewField method need to be activated for case new columns added
@Injectable()
export class UserService /*implements OnModuleInit*/ {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<User>,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
    private readonly emailService: EmailService,
    private readonly diaryService: DiaryService,
    private readonly diaryAnalysisService: DiaryAnalysisService,
  ) {}
  /* ######### OPTIONAL #########
    async onModuleInit() {
        await this.addNewField();
    }
    async addNewField() {
        await this.userModel.updateMany({ refresh: { $exists: false } }, { $set: { refresh: null } });
    } 
    */

  async findAll() {
    try {
      const users = await this.userModel.find().exec();
      return users.map((u: User): User['readOnlyData'] => u.readOnlyData);
    } catch (e) {
      throw new InternalServerErrorException('An unexpected error occurred');
    }
  }

  async findOne(option: object = null) {
    try {
      const user = await this.userModel.findOne(option).exec();
      return user;
    } catch (e) {
      throw new InternalServerErrorException('An unexpected error occurred');
    }
  }

  async findById(id: string) {
    try {
      const user = await this.userModel.findById(id).exec();
      return user;
    } catch (e) {
      throw new InternalServerErrorException('An unexpected error occurred');
    }
  }

  async signUp(body: UserSignupDto) {
    try {
      const { email, name, password } = body;

      //check time expired
      const timePass = await this.cacheManager.get(body.email);
      if (!timePass || timePass != 'passed')
        throw new RequestTimeoutException('not verified or timed out');

      //check user duplicated
      const isUserExist = await this.userModel.exists({ email }).exec();
      if (isUserExist) throw new ConflictException('The user already exists');

      //join start
      const hashedPassword = await bcrypt.hash(password, 10);
      const user = await this.userModel.create({
        email,
        name,
        password: hashedPassword,
      });
      return user.readOnlyData;
    } catch (e) {
      if (e instanceof HttpException) throw e; //controlled
      throw new InternalServerErrorException('An unexpected error occurred');
    }
  }

  async update(userId: string, updateInfo: UserUpdateDto): Promise<User> {
    try {
      //check fields
      const updateFields: Partial<User> = {};
      if (updateInfo.name) updateFields.name = updateInfo.name;
      if (updateInfo.alarm !== undefined) updateFields.alarm = updateInfo.alarm;
      if (updateInfo.imgUrl) updateFields.imgUrl = updateInfo.imgUrl;

      //update start
      const updatedUser = await this.userModel
        .findByIdAndUpdate(
          userId,
          { $set: updateFields },
          { new: true, runValidators: true },
        )
        .exec();
      if (!updatedUser) throw new NotFoundException('User not found');
      return updatedUser;
    } catch (e) {
      if (e instanceof HttpException) throw e; //controlled
      throw new InternalServerErrorException('An unexpected error occurred');
    }
  }

  async sendVerification(body: EmailRequestDto) {
    try {
      const limitSeconds: number = 180;
      const verifyToken: string = generateRandomNumber(6);
      body.subject = 'verifcation number';
      body.content = verifyToken;
      await this.cacheManager.set(body.email, verifyToken, {
        ttl: limitSeconds,
      } as any);
      this.emailService.sendMail(body);
      return limitSeconds;
    } catch (e) {
      throw new InternalServerErrorException('An unexpected error occurred');
    }
  }

  async verify(body: UserVerifyDto) {
    try {
      const targetCode = await this.cacheManager.get(body.email);
      if (targetCode === undefined)
        throw new RequestTimeoutException('not sent or timed out');
      if (body.verificationCode === targetCode) {
        const limitSeconds: number = 300;
        await this.cacheManager.set(body.email, 'passed', {
          ttl: limitSeconds,
        } as any); //limited time session for 5mins in joining process
        return 'Success';
      } else throw new UnauthorizedException('Invalid code');
    } catch (e) {
      if (e instanceof HttpException) throw e;
      throw new InternalServerErrorException('An unexpected error occurred');
    }
  }

  async delete(userId: string) {
    //추후 트랜잭션 고려...
    try {
      const deletedUser = await this.userModel.findByIdAndDelete(userId).exec();
      if (!deletedUser) {
        throw new NotFoundException(`User with ID ${userId} not found`);
      }
      // Delete associated diaries
      await this.diaryService.deleteAllByUserId(userId);
      // Delete associated diary analyses
      await this.diaryAnalysisService.deleteAllByUserId(userId);
      return deletedUser.readOnlyData;
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException(
        'An error occurred while deleting the user',
      );
    }
  }
}
