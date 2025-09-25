import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CouponController } from './coupon.controller';
import { CouponService } from './coupon.service';
import { Coupon, CouponSchema } from './schema/coupon.schema';
import { MembershipModule } from '@src/membership/membership.module';

@Module({
	imports: [
		MongooseModule.forFeature([{ name: Coupon.name, schema: CouponSchema }]),
		MembershipModule
	],
	controllers: [CouponController],
	providers: [CouponService],
	exports: [CouponService]
})
export class CouponModule {}
