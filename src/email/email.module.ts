import { Module } from '@nestjs/common';
import { EmailController } from '@email/email.controller';
import { EmailService } from '@email/email.service';

@Module({
  controllers: [EmailController],
  providers: [EmailService],
  exports: [EmailService]
})
export class EmailModule {}
