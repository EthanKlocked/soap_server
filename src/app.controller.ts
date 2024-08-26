import { Controller, Get } from '@nestjs/common';
import { ConfigService } from "@nestjs/config";
import { ApiOperation, ApiResponse} from '@nestjs/swagger'


@Controller('')
export class AppController {
    constructor(private readonly configService: ConfigService) {}

    @Get()
    @ApiOperation({ summary: 'default endpoint', description: 'welcome page / description for server and client application' })
    @ApiResponse({ status: 200, description: 'Success' })    
    @ApiResponse({ status: 304, description: 'Cached / no need to be modified' })
    home(){
        const name = this.configService.get<string>("APP_NAME");
        return `Welcome to my ${name}!`;
    }   
}