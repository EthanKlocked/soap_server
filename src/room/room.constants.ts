export const DEFAULT_ROOM_ITEMS = [
	{
		name: 'windowDay',
		x: 64.21,
		y: 1,
		zIndex: 1,
		visible: true,
		type: 'interior'
	},
	{
		name: 'books',
		x: 5.34,
		y: 1,
		zIndex: 1,
		visible: true,
		type: 'hobby'
	},
	{
		name: 'music',
		x: 12.65,
		y: 11.89,
		zIndex: 1,
		visible: true,
		type: 'hobby'
	},
	{
		name: 'picture',
		x: 42.98,
		y: 6.53,
		zIndex: 1,
		visible: true,
		type: 'interior'
	},
	{
		name: 'sofa',
		x: 68.07,
		y: 28.39,
		zIndex: 1,
		visible: true,
		type: 'interior'
	},
	{
		name: 'windowNight',
		x: 65.01,
		y: 5.89,
		zIndex: 1,
		visible: true,
		type: 'interior'
	},
	{
		name: 'desk',
		x: 8.47,
		y: 33.78,
		zIndex: 1,
		visible: true,
		type: 'interior'
	},
	{
		name: 'plant',
		x: 51.91,
		y: 30.27,
		zIndex: 1,
		visible: true,
		type: 'interior'
	},
	{
		name: 'movie',
		x: 12.97,
		y: 25.39,
		zIndex: 2,
		visible: true,
		type: 'hobby'
	}
] as const;

export type ItemName = (typeof DEFAULT_ROOM_ITEMS)[number]['name'];
export type ItemType = (typeof DEFAULT_ROOM_ITEMS)[number]['type'];
