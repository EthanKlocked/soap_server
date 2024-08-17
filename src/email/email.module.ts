import { Module } from '@nestjs/common';
import { EmailController } from '@src/email/email.controller';
import { EmailService } from '@src/email/email.service';

@Module({
  controllers: [EmailController],
  providers: [EmailService],
  exports: [EmailService],
})
export class EmailModule {}
