import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MembershipController } from './membership.controller';
import { MembershipService } from './membership.service';
import { UserMembership, UserMembershipSchema } from './schema/user-membership.schema';
import { MembershipGuard } from './guard/membership.guard';

@Module({
	imports: [
		MongooseModule.forFeature([{ name: UserMembership.name, schema: UserMembershipSchema }])
	],
	controllers: [MembershipController],
	providers: [MembershipService, MembershipGuard],
	exports: [MembershipService, MembershipGuard]
})
export class MembershipModule {}
