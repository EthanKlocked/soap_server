import {
	Controller,
	Post,
	Body,
	Get,
	UseGuards,
	Request,
	Res,
	Param,
	Delete,
	Patch
} from '@nestjs/common';
import { UserService } from '@src/user/user.service';
import { UserSignupDto } from '@src/user/dto/user.signup.dto';
import { EmailRequestDto } from '@src/email/dto/email.request.dto';
import { UserVerifyDto } from '@src/user/dto/user.verify.dto';
import { ApiTags, ApiOperation, ApiBody, ApiResponse, ApiSecurity } from '@nestjs/swagger';
import { LocalAuthGuard } from '@src/auth/guard/local.guard';
import { RefreshGuard } from '@src/auth/guard/refresh.guard';
import { SnsAuthGuard } from '@src/auth/guard/sns.guard';
import { UserLoginDto } from '@src/user/dto/user.login.dto';
import { UserUpdateDto } from '@src/user/dto/user.update.dto';
import { UserSnsDto } from '@src/user/dto/user.sns.dto';
import { JwtAuthGuard } from '@src/auth/guard/jwt.guard';
import { ApiGuard } from '@src/auth/guard/api.guard';

@UseGuards(ApiGuard)
@Controller('user')
@ApiTags('user')
@ApiSecurity('api-key')
@ApiResponse({ status: 400, description: 'Request without API KEY' })
@ApiResponse({ status: 403, description: 'Invalid API KEY' })
@ApiResponse({ status: 500, description: 'Server Error' })
export class UserController {
	constructor(private readonly userService: UserService) {}

	@Get()
	@ApiOperation({
		summary: 'Find Every Users Info',
		description: 'get every users information for test environment'
	})
	@ApiResponse({ status: 200, description: 'Success' })
	async findAll() {
		return await this.userService.findAll();
	}

	@UseGuards(JwtAuthGuard)
	@Get('profile')
	@ApiOperation({
		summary: 'Get user info',
		description: 'get profile information from accessToken inserted in cookies'
	})
	@ApiResponse({ status: 200, description: 'Success' })
	@ApiResponse({ status: 401, description: 'Empty / Invalid token' })
	@ApiResponse({ status: 410, description: 'Token has expired' })
	async getProfile(@Request() req) {
		return req.user;
	}

	@UseGuards(SnsAuthGuard)
	@Post('sns-login')
	@ApiOperation({
		summary: 'SNS Login',
		description: 'Login or register a user using SNS credentials'
	})
	@ApiBody({ type: UserSnsDto })
	@ApiResponse({ status: 201, description: 'Success' })
	@ApiResponse({ status: 401, description: 'Unauthorized sns' })
	async snsLogin(@Request() req, @Res({ passthrough: true }) response) {
		const { access: accessToken, refresh: refreshToken } = req.user;
		response.cookie('access_token', accessToken, { httpOnly: false });
		response.cookie('refresh_token', refreshToken, { httpOnly: false });
		return { message: 'SNS login successful' };
	}

	@Post()
	@ApiOperation({
		summary: 'Add new user',
		description: 'create new user data in server database'
	})
	@ApiBody({ type: UserSignupDto })
	@ApiResponse({ status: 201, description: 'Success' })
	@ApiResponse({ status: 408, description: 'Not verified or time expired' })
	@ApiResponse({ status: 409, description: 'The user already exists' })
	async signUp(@Body() body: UserSignupDto) {
		return await this.userService.signUp(body);
	}

	@UseGuards(JwtAuthGuard)
	@Patch()
	@ApiOperation({
		summary: 'Update user info',
		description: 'update user info in server database'
	})
	@ApiBody({ type: UserUpdateDto })
	@ApiResponse({ status: 200, description: 'Success' })
	@ApiResponse({ status: 404, description: 'User not found' })
	async update(@Request() req, @Body() updateInfo: UserUpdateDto) {
		const targetId: string = req.user.id;
		return await this.userService.update(targetId, updateInfo);
	}

	@Post('email')
	@ApiOperation({
		summary: 'Send verification email',
		description:
			'send a verifcation email which would be 6digits for <email> value as the target'
	})
	@ApiBody({ type: EmailRequestDto })
	@ApiResponse({ status: 201, description: 'Success' })
	async sendVerification(@Body() body: EmailRequestDto) {
		return await this.userService.sendVerification(body);
	}

	@Post('verify')
	@ApiOperation({
		summary: 'Verify digit code',
		description:
			'Check if the verificationCode value is same with the code server sent and cached for limited time'
	})
	@ApiBody({ type: UserVerifyDto })
	@ApiResponse({ status: 201, description: 'Success' })
	@ApiResponse({ status: 401, description: 'Invalid code' })
	@ApiResponse({ status: 408, description: 'Not sent or time expired' })
	async verify(@Body() body: UserVerifyDto) {
		return await this.userService.verify(body);
	}

	@UseGuards(LocalAuthGuard)
	@Post('login')
	@ApiOperation({
		summary: 'Login',
		description:
			'Login with body information including e-mail and password and issue accessToken if request would be validate.'
	})
	@ApiBody({ type: UserLoginDto })
	@ApiResponse({ status: 201, description: 'Success' })
	@ApiResponse({ status: 401, description: 'Invalid e-mail or password' })
	async login(@Request() req, @Res({ passthrough: true }) response) {
		const accessToken = req.user.access;
		const refreshToken = req.user.refresh;
		response.cookie('access_token', accessToken, { httpOnly: false });
		response.cookie('refresh_token', refreshToken, { httpOnly: false });
		return 'success';
	}

	@UseGuards(RefreshGuard)
	@Post('refresh')
	@ApiOperation({
		summary: 'Refresh',
		description: 'Refresh access token in case previous access token is expired.'
	})
	@ApiResponse({
		status: 201,
		description: 'Object with Token datas in Prod / Success Message in Dev'
	})
	@ApiResponse({ status: 401, description: 'Empty / Invalid token' })
	@ApiResponse({ status: 410, description: 'Token has expired' })
	async refresh(@Request() req, @Res({ passthrough: true }) response) {
		const execution_env = process.env.NODE_ENV;
		const accessToken = req.user.access;
		const refreshToken = req.user.refresh;
		if (execution_env == 'dev') {
			response.cookie('access_token', accessToken, { httpOnly: false });
			response.cookie('refresh_token', refreshToken, { httpOnly: false });
			return 'success';
		}
		if (execution_env == 'prod') {
			return {
				access_token: accessToken,
				refresh_token: refreshToken
			};
		}
	}

	@Post('logout')
	@ApiResponse({ status: 201, description: 'Success' })
	async logout(@Res({ passthrough: true }) response) {
		response.clearCookie('access_token');
		response.clearCookie('refresh_token');
		return 'success';
	}

	@UseGuards(JwtAuthGuard)
	@Delete('delete')
	@ApiOperation({
		summary: 'Delete',
		description: 'Delete a user by their ID from token validated'
	})
	@ApiResponse({ status: 200, description: 'Success' })
	@ApiResponse({ status: 401, description: 'Empty / Invalid token' })
	@ApiResponse({ status: 404, description: 'User not found' })
	@ApiResponse({ status: 410, description: 'Token has expired' })
	async delete(@Request() req, @Res({ passthrough: true }) response) {
		const targetId: string = req.user.id;
		response.clearCookie('access_token');
		response.clearCookie('refresh_token');
		return await this.userService.delete(targetId);
	}

	@UseGuards(JwtAuthGuard)
	@Get('ctoken')
	@ApiOperation({
		summary: 'Get',
		description: 'Request to get the specific token for connecting to chat server'
	})
	@ApiResponse({ status: 200, description: 'Success' })
	@ApiResponse({ status: 401, description: 'Empty / Invalid token' })
	@ApiResponse({ status: 410, description: 'Token has expired' })
	async ctoken(@Request() req) {
		return req.cookies['access_token'];
	}

	@UseGuards(JwtAuthGuard)
	@Post('block')
	@ApiOperation({ summary: 'Block a user', description: 'Block a user by their ID' })
	@ApiResponse({ status: 201, description: 'Success' })
	@ApiResponse({
		status: 400,
		description: 'Target id is not valid format'
	})
	@ApiResponse({ status: 401, description: 'Empty / Invalid token' })
	@ApiResponse({ status: 404, description: 'User not found' })
	@ApiResponse({ status: 410, description: 'Token has expired' })
	@ApiResponse({
		status: 409,
		description: 'Conflict: User is already blocked or you cannot block yourself'
	})
	async blockUser(@Request() req, @Body('userToBlockId') userToBlockId: string) {
		return this.userService.blockUser(req.user.id, userToBlockId);
	}

	@UseGuards(JwtAuthGuard)
	@Delete('unblock/:blockedUserId')
	@ApiOperation({
		summary: 'Unblock a user',
		description: 'Unblock a previously blocked user by their ID'
	})
	@ApiResponse({ status: 200, description: 'Success' })
	@ApiResponse({ status: 401, description: 'Empty / Invalid token' })
	@ApiResponse({ status: 404, description: 'User not found' })
	async unblockUser(@Request() req, @Param('blockedUserId') blockedUserId: string) {
		return this.userService.unblockUser(req.user.id, blockedUserId);
	}

	@UseGuards(JwtAuthGuard)
	@Get('is-blocked/:targetUserId')
	@ApiOperation({
		summary: 'Check if a user is blocked',
		description: 'Check if the current user has blocked the specified target user'
	})
	@ApiResponse({ status: 200, description: 'Success' })
	@ApiResponse({ status: 401, description: 'Empty / Invalid token' })
	@ApiResponse({ status: 410, description: 'Token has expired' })
	async isUserBlocked(@Request() req, @Param('targetUserId') targetUserId: string) {
		return this.userService.isUserBlocked(req.user.id, targetUserId);
	}
}
