export const DEFAULT_ROOM_ITEMS = [
	{
		name: 'books',
		x: 5,
		y: 1,
		zIndex: 1,
		visible: true,
		type: 'hobby'
	},
	{
		name: 'movie',
		x: 5,
		y: 26,
		zIndex: 1,
		visible: true,
		type: 'hobby'
	},
	{
		name: 'music',
		x: 15,
		y: 12,
		zIndex: 1,
		visible: true,
		type: 'hobby'
	},
	{
		name: 'picture',
		x: 50,
		y: 16,
		zIndex: 1,
		visible: true,
		type: 'interior'
	},
	{
		name: 'plant',
		x: 50,
		y: 29,
		zIndex: 1,
		visible: true,
		type: 'interior'
	},
	{
		name: 'sofa',
		x: 66.67,
		y: 25.99,
		zIndex: 1,
		visible: true,
		type: 'interior'
	},
	{
		name: 'windowDay',
		x: 65,
		y: 3,
		zIndex: 1,
		visible: true,
		type: 'interior'
	},
	{
		name: 'windowNight',
		x: 65,
		y: 3,
		zIndex: 1,
		visible: true,
		type: 'interior'
	}
] as const;

export type ItemName = (typeof DEFAULT_ROOM_ITEMS)[number]['name'];
export type ItemType = (typeof DEFAULT_ROOM_ITEMS)[number]['type'];
