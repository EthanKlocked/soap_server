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
		y: 18.0,
		visible: true,
		type: 'hobby'
	},
	{
		name: 'picture',
		x: 40.0,
		y: 9.9,
		visible: true,
		type: 'interior'
	},
	{
		name: 'plant',
		x: 50.67,
		y: 34.99,
		visible: true,
		type: 'interior'
	},
	{
		name: 'sofa',
		x: 66.67,
		y: 29.99,
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
		x: 40.0,
		y: 24.89,
		visible: true,
		type: 'hobby'
	}
] as const;

export type ItemName = (typeof DEFAULT_ROOM_ITEMS)[number]['name'];
export type ItemType = (typeof DEFAULT_ROOM_ITEMS)[number]['type'];
