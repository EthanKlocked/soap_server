import { ApiProperty } from '@nestjs/swagger';

export class RoomItemResponseDto {
	@ApiProperty({ example: '671ceeb19a2b2778abd071b5' })
	_id: string;

	@ApiProperty({ example: 'books' })
	name: string;

	@ApiProperty({ example: 1.47 })
	x: number;

	@ApiProperty({ example: 6 })
	y: number;

	@ApiProperty({ example: 1 })
	zIndex: number;

	@ApiProperty({ example: true })
	visible: boolean;

	@ApiProperty({ example: 'hobby', enum: ['hobby', 'interior'] })
	type: 'hobby' | 'interior';

	@ApiProperty({ example: '2024-10-26T13:30:02.988Z' })
	createdAt: string;

	@ApiProperty({ example: '2024-10-26T13:30:02.988Z' })
	updatedAt: string;
}

export class UserInfoDto {
	@ApiProperty({ example: '66fc12ba54c3c91cb8ff2393' })
	_id: string;

	@ApiProperty({ example: 'test@test.com' })
	email: string;

	@ApiProperty({ example: 'Ethan Kim' })
	name: string;
}

export class RoomResponseDto {
	@ApiProperty({ example: '507f1f77bcf86cd799439011' })
	id: string;

	@ApiProperty({ example: '507f1f77bcf86cd799439012' })
	userId: string;

	@ApiProperty({ type: [RoomItemResponseDto] })
	items: RoomItemResponseDto[];

	@ApiProperty({ example: '2024-10-01T09:00:00.000Z' })
	createdAt: string;

	@ApiProperty({ example: '2024-10-01T09:00:00.000Z' })
	updatedAt: string;
}

export class UserRoomResponseDto extends RoomResponseDto {
	@ApiProperty({ type: UserInfoDto })
	user: UserInfoDto;

	@ApiProperty({ example: 'pending' })
	friendshipStatus: string;

	@ApiProperty({ example: 5, required: false })
	remainingDays?: number;
}
