import { Body, Controller, Post } from '@nestjs/common';
import { EmailService } from '@src/email/email.service';
import { EmailRequestDto } from '@src/email/dto/email.request.dto';
import { ApiTags, ApiOperation, ApiBody, ApiResponse} from '@nestjs/swagger';


@Controller('email')
@ApiTags('email')
export class EmailController {
	constructor(private readonly mailService: EmailService){}

	@Post('send')
	@ApiOperation({ summary: 'Send mail', description: 'send the mail with subject and content description to the target address' })
	@ApiBody({ type: EmailRequestDto })
	@ApiResponse({ status: 201, description: 'Success' })
	@ApiResponse({ status: 500, description: 'Server Error' })
	async sendMail(@Body() body: EmailRequestDto){
		await this.mailService.sendMail(body);
	}
}