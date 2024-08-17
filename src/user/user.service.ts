import {
  Inject,
  Injectable,
  NotImplementedException,
  UnauthorizedException,
  RequestTimeoutException,
  ConflictException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { User } from '@src/user/schema/user.schema';
import { Model } from 'mongoose';
import { UserRequestDto } from '@src/user/dto/user.request.dto';
import { Cache } from 'cache-manager';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { generateRandomNumber } from '@src/lib/common';
import { EmailService } from 'src/email/email.service';
import { EmailRequestDto } from '@src/email/dto/email.request.dto';
import { UserVerifyDto } from './dto/user.verify.dto';
import * as bcrypt from 'bcryptjs';

//onModuleInit interface and addNewField method need to be activated for case new columns added
@Injectable()
export class UserService /*implements OnModuleInit*/ {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<User>,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
    private readonly emailService: EmailService,
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
      throw new NotImplementedException(e.message);
    }
  }

  async findOne(option: object = null) {
    try {
      const user = await this.userModel.findOne(option);
      return user;
    } catch (e) {
      throw new NotImplementedException(e.message);
    }
  }

  async findById(id: string) {
    try {
      const user = await this.userModel.findById(id);
      return user;
    } catch (e) {
      throw new NotImplementedException(e.message);
    }
  }

  async signUp(body: UserRequestDto) {
    try {
      const { email, name, password } = body;

      //check time expired
      const timePass = await this.cacheManager.get(body.email);
      if (!timePass || timePass != 'passed')
        throw new RequestTimeoutException('not verified or timed out');

      //check user duplicated
      const isUserExist = await this.userModel.exists({ email });
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
      throw new NotImplementedException(e.message);
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
      throw new NotImplementedException(e.message);
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
      throw new NotImplementedException(e.message);
    }
  }
}
