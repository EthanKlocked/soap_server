export const DEFAULT_ROOM_ITEMS = [
	{
		name: 'books',
		x: 1.47,
		y: 6.0,
		visible: true,
		type: 'hobby'
	},
	{
		name: 'movie',
		x: 2.67,
		y: 32.23,
		visible: true,
		type: 'hobby'
	},
	{
		name: 'music',
		x: 10.67,
		y: 17.99,
		visible: true,
		type: 'hobby'
	},
	{
		name: 'picture',
		x: 2.67,
		y: 6.0,
		visible: true,
		type: 'interior'
	},
	{
		name: 'plant',
		x: 2.67,
		y: 14.99,
		visible: true,
		type: 'interior'
	},
	{
		name: 'sofa',
		x: 2.67,
		y: 14.99,
		visible: true,
		type: 'interior'
	},
	{
		name: 'windowDay',
		x: 66.67,
		y: 7.2,
		visible: true,
		type: 'interior'
	},
	{
		name: 'windowNight',
		x: 66.67,
		y: 7.2,
		visible: true,
		type: 'interior'
	},
	{
		name: 'youtube',
		x: 4.0,
		y: 24.89,
		visible: true,
		type: 'hobby'
	}
] as const;

export type ItemName = (typeof DEFAULT_ROOM_ITEMS)[number]['name'];
export type ItemType = (typeof DEFAULT_ROOM_ITEMS)[number]['type'];
