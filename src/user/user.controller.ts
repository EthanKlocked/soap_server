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
import { UserSignupDto, UserSnsSignupDto } from '@src/user/dto/user.signup.dto';
import { EmailRequestDto } from '@src/email/dto/email.request.dto';
import { UserVerifyDto } from '@src/user/dto/user.verify.dto';
import {
	ApiTags,
	ApiOperation,
	ApiBody,
	ApiResponse,
	ApiSecurity,
	ApiParam
} from '@nestjs/swagger';
import { LocalAuthGuard } from '@src/auth/guard/local.guard';
import { RefreshGuard } from '@src/auth/guard/refresh.guard';
import { SnsAuthGuard } from '@src/auth/guard/sns.guard';
import { UserLoginDto } from '@src/user/dto/user.login.dto';
import { UserUpdateDto } from '@src/user/dto/user.update.dto';
import { UserSnsLoginDto } from './dto/user.snsLogin.dto';
import { UserBlockDto } from '@src/user/dto/user.block.dto';
import { JwtAuthGuard } from '@src/auth/guard/jwt.guard';
import { ApiGuard } from '@src/auth/guard/api.guard';
import { SnsValidationResultCase } from '@src/auth/auth.interface';

@UseGuards(ApiGuard)
@Controller('user')
@ApiSecurity('api-key')
@ApiResponse({ status: 400, description: 'Request without API KEY' })
@ApiResponse({ status: 403, description: 'Invalid API KEY' })
@ApiResponse({ status: 500, description: 'Server Error' })
export class UserController {
	constructor(private readonly userService: UserService) {}

	@ApiTags('User-Auth')
	@Post('email')
	@ApiOperation({
		summary: 'Send verification email',
		description: 'Sends a 6-digit verification code to the specified email address'
	})
	@ApiBody({ type: EmailRequestDto })
	@ApiResponse({ status: 201, description: 'Success' })
	async sendVerification(@Body() body: EmailRequestDto) {
		return await this.userService.sendVerification(body);
	}

	@ApiTags('User-Auth')
	@Post('verify')
	@ApiOperation({
		summary: 'Verify email code',
		description: 'Validates the 6-digit verification code sent to the email'
	})
	@ApiBody({ type: UserVerifyDto })
	@ApiResponse({ status: 201, description: 'Success' })
	@ApiResponse({ status: 401, description: 'Invalid code' })
	@ApiResponse({ status: 408, description: 'Not sent or time expired' })
	async verify(@Body() body: UserVerifyDto) {
		return await this.userService.verify(body);
	}

	@ApiTags('User-Auth')
	@Post()
	@ApiOperation({
		summary: 'Register new user',
		description: 'Creates a new user account after email verification'
	})
	@ApiBody({ type: UserSignupDto })
	@ApiResponse({ status: 201, description: 'Success' })
	@ApiResponse({ status: 408, description: 'Not verified or time expired' })
	@ApiResponse({ status: 409, description: 'The user already exists' })
	async signUp(@Body() body: UserSignupDto) {
		return await this.userService.signUp(body);
	}

	@ApiTags('User-Auth')
	@UseGuards(LocalAuthGuard)
	@Post('login')
	@ApiOperation({
		summary: 'User login',
		description:
			'Authenticates user with email and password, and issues access&refresh token set'
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

	@ApiTags('User-Auth')
	@UseGuards(SnsAuthGuard)
	@Post('sns-login')
	@ApiOperation({
		summary: 'SNS Login',
		description: `Authenticates SNS credentials.
	
	Response:
	The response will contain a 'resultCase' field indicating one of three scenarios:
	
	1. LOGIN: User successfully logged in
	   - Includes 'access' and 'refresh' tokens
	
	2. JOIN: User needs to register
	   - Includes a temporary 'password'
	
	3. SNS: A different SNS account exists for this email
	   - Includes the 'existingSns' type
	
	Note: Status code 201 is returned for all successful scenarios.`
	})
	@ApiBody({ type: UserSnsLoginDto })
	@ApiResponse({ status: 201, description: 'Success' })
	@ApiResponse({ status: 401, description: 'Unauthorized sns' })
	async snsLogin(@Request() req, @Res({ passthrough: true }) response) {
		const result = req.user;
		if (result.resultCase === SnsValidationResultCase.LOGIN) {
			response.cookie('access_token', result.access, { httpOnly: false });
			response.cookie('refresh_token', result.refresh, { httpOnly: false });
		}
		return result;
	}

	@ApiTags('User-Auth')
	@Post('sns-signup')
	@ApiOperation({
		summary: 'Register new user with SNS',
		description: 'Creates a new user account with SNS information'
	})
	@ApiBody({ type: UserSnsSignupDto })
	@ApiResponse({ status: 201, description: 'Success' })
	@ApiResponse({ status: 409, description: 'The user already exists' })
	async snsSignUp(@Body() body: UserSnsSignupDto) {
		return await this.userService.snsSignUp(body);
	}

	@ApiTags('User-Auth')
	@UseGuards(RefreshGuard)
	@Post('refresh')
	@ApiOperation({
		summary: 'Refresh access token',
		description: 'Issues a new access token using the refresh token'
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

	@ApiTags('User-Auth')
	@UseGuards(JwtAuthGuard)
	@Post('logout')
	@ApiOperation({
		summary: 'User logout',
		description: 'Logs out the user and invalidates the current session'
	})
	@ApiResponse({ status: 201, description: 'Success' })
	@ApiResponse({ status: 401, description: 'Empty / Invalid token' })
	@ApiResponse({ status: 410, description: 'Token has expired' })
	async logout(@Res({ passthrough: true }) response) {
		response.clearCookie('access_token');
		response.clearCookie('refresh_token');
		return 'success';
	}

	@ApiTags('User-Info')
	@Get()
	@ApiOperation({
		summary: 'Get all users',
		description: 'Retrieves information of all users (for testing purposes only)'
	})
	@ApiResponse({ status: 200, description: 'Success' })
	async findAll() {
		return await this.userService.findAll();
	}

	@ApiTags('User-Info')
	@UseGuards(JwtAuthGuard)
	@Get('profile')
	@ApiOperation({
		summary: 'Get user profile',
		description: 'Retrieves the profile information of the authenticated user'
	})
	@ApiResponse({ status: 200, description: 'Success' })
	@ApiResponse({ status: 401, description: 'Empty / Invalid token' })
	@ApiResponse({ status: 404, description: 'User not found' })
	@ApiResponse({ status: 410, description: 'Token has expired' })
	async getProfile(@Request() req) {
		return await this.userService.findProfile(req.user.id);
	}

	@ApiTags('User-Management')
	@UseGuards(JwtAuthGuard)
	@Patch()
	@ApiOperation({
		summary: 'Update user info',
		description: 'Updates the profile information of the authenticated user'
	})
	@ApiBody({ type: UserUpdateDto })
	@ApiResponse({ status: 200, description: 'Success' })
	@ApiResponse({ status: 404, description: 'User not found' })
	async update(@Request() req, @Body() updateInfo: UserUpdateDto) {
		const targetId: string = req.user.id;
		return await this.userService.update(targetId, updateInfo);
	}

	@ApiTags('User-Management')
	@UseGuards(JwtAuthGuard)
	@Delete('delete')
	@ApiOperation({
		summary: 'Delete user account',
		description: "Permanently deletes the authenticated user's account"
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

	@ApiTags('User-Management')
	@UseGuards(JwtAuthGuard)
	@Post('block')
	@ApiOperation({
		summary: 'Block a user',
		description: 'Blocks a specified user, preventing interactions'
	})
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
	async blockUser(@Request() req, @Body() blockData: UserBlockDto) {
		return this.userService.blockUser(req.user.id, blockData);
	}

	@ApiTags('User-Management')
	@UseGuards(JwtAuthGuard)
	@Delete('unblock/:blockedUserId')
	@ApiOperation({
		summary: 'Unblock a user',
		description: 'Removes the block restriction on a previously blocked user'
	})
	@ApiParam({ name: 'blockedUserId', type: 'string', description: 'ID of the user to unblock' })
	@ApiResponse({ status: 200, description: 'Success' })
	@ApiResponse({ status: 401, description: 'Empty / Invalid token' })
	@ApiResponse({ status: 404, description: 'User not found' })
	async unblockUser(@Request() req, @Param('blockedUserId') blockedUserId: string) {
		return this.userService.unblockUser(req.user.id, blockedUserId);
	}

	@ApiTags('User-Management')
	@UseGuards(JwtAuthGuard)
	@Get('is-blocked/:targetUserId')
	@ApiOperation({
		summary: 'Check block status',
		description: 'Checks if a specified user is blocked by the authenticated user'
	})
	@ApiParam({
		name: 'targetUserId',
		type: 'string',
		description: 'ID of the user to check if blocked'
	})
	@ApiResponse({ status: 200, description: 'Success' })
	@ApiResponse({ status: 401, description: 'Empty / Invalid token' })
	@ApiResponse({ status: 410, description: 'Token has expired' })
	async isUserBlocked(@Request() req, @Param('targetUserId') targetUserId: string) {
		return this.userService.isUserBlocked(req.user.id, targetUserId);
	}

	@ApiTags('User-Management')
	@UseGuards(JwtAuthGuard)
	@Get('blocked-users')
	@ApiOperation({
		summary: 'Get blocked users list',
		description: 'Retrieves a list of all users blocked by the authenticated user'
	})
	@ApiResponse({ status: 200, description: 'Success' })
	@ApiResponse({ status: 401, description: 'Empty / Invalid token' })
	@ApiResponse({ status: 410, description: 'Token has expired' })
	async getBlockedUsers(@Request() req) {
		return this.userService.getBlockedUsers(req.user.id);
	}

	@ApiTags('User-Extra')
	@UseGuards(JwtAuthGuard)
	@Get('ctoken')
	@ApiOperation({
		summary: 'Get chat token',
		description: 'Retrieves the token required for connecting to the chat server'
	})
	@ApiResponse({ status: 200, description: 'Success' })
	@ApiResponse({ status: 401, description: 'Empty / Invalid token' })
	@ApiResponse({ status: 410, description: 'Token has expired' })
	async ctoken(@Request() req) {
		return req.cookies['access_token'];
	}
}
