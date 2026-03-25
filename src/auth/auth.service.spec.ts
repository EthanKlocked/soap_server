import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { UserService } from '@src/user/user.service';

describe('AuthService', () => {
	let service: AuthService;

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [
				AuthService,
				{
					provide: UserService,
					useValue: { findOne: jest.fn(), create: jest.fn() }
				},
				{
					provide: JwtService,
					useValue: { sign: jest.fn(), verify: jest.fn() }
				},
				{
					provide: ConfigService,
					useValue: { get: jest.fn() }
				}
			]
		}).compile();

		service = module.get<AuthService>(AuthService);
	});

	it('should be defined', () => {
		expect(service).toBeDefined();
	});
});
