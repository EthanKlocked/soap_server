import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './user/user.module';
import { EmailModule } from './email/email.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [UserModule, EmailModule, AuthModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
