import { AuthGuard } from '@nestjs/passport';

export class SnsAuthGuard extends AuthGuard('sns') {}
