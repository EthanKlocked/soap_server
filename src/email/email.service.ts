import { Injectable, NotImplementedException } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { ConfigService } from "@nestjs/config";
import { EmailRequestDto } from '@src/email/dto/email.request.dto';

@Injectable()
export class EmailService {
	private readonly transporter;

	constructor(private readonly configService: ConfigService){
		this.transporter = nodemailer.createTransport({
			host: 'smtp.gmail.com',
			port: 587,
			secure: false,
			auth: {
				user : this.configService.get<string>("MAIL_ID"),
				pass : this.configService.get<string>("MAIL_PASSWORD"),
			}
		});
	}

	async sendMail(body: EmailRequestDto) {
		try{
			await this.transporter.sendMail({
				from : 'Email from @ivory.com <ethanklocked@gmail.com>',
				to : body.email,
				subject : body.subject,
				text : body.content
			});
			return 'Success';
		}catch(e){
			throw new NotImplementedException(e.message); 
		}
	}
}