import { Module } from '@nestjs/common';
import { AppController } from '@app.controller';
import { AppService } from '@app.service';
import { UserModule } from '@user/user.module';
import { EmailModule } from '@email/email.module';
import { AuthModule } from '@auth/auth.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CacheModule } from '@nestjs/cache-manager';
import { MongooseModule } from '@nestjs/mongoose';
import { cacheConfig } from '@config/cache.config';
import { dbConfig } from '@config/db.config';

@Module({
  imports: [
		/********* CONFIG SETTING *********/
		ConfigModule.forRoot({
			cache:true,
			isGlobal:true,
			envFilePath: `.env.${process.env.NODE_ENV}`,
		}),    
		/********* CACHE SETTING *********/
		CacheModule.registerAsync(cacheConfig),
    /******* DATABASE SETTING ********/
    MongooseModule.forRootAsync(dbConfig),
    /********* CUSTOM MODULES *********/
    UserModule, 
    EmailModule, 
    AuthModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
