export const DEFAULT_ROOM_ITEMS = [
	{
		name: 'books',
		x: 1.47,
		y: 1,
		zIndex: 1,
		visible: true,
		type: 'hobby'
	},
	{
		name: 'movie',
		x: 2.67,
		y: 27.23,
		zIndex: 1,
		visible: true,
		type: 'hobby'
	},
	{
		name: 'music',
		x: 8.67,
		y: 14,
		zIndex: 1,
		visible: true,
		type: 'hobby'
	},
	{
		name: 'picture',
		x: 40,
		y: 5.9,
		zIndex: 1,
		visible: true,
		type: 'interior'
	},
	{
		name: 'plant',
		x: 50.67,
		y: 28.99,
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
		x: 66.67,
		y: 5.2,
		zIndex: 1,
		visible: true,
		type: 'interior'
	},
	{
		name: 'windowNight',
		x: 66.67,
		y: 5.2,
		zIndex: 1,
		visible: true,
		type: 'interior'
	},
	{
		name: 'youtube',
		x: 40,
		y: 17.89,
		zIndex: 1,
		visible: true,
		type: 'hobby'
	}
] as const;

export type ItemName = (typeof DEFAULT_ROOM_ITEMS)[number]['name'];
export type ItemType = (typeof DEFAULT_ROOM_ITEMS)[number]['type'];
