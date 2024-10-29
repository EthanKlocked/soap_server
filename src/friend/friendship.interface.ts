export enum FriendRequestStatus {
	EMPTY = 'empty', // START
	PENDING = 'pending', // WAITING
	REJECTED = 'rejected', // END -> POSSIBLY START AFTER LIMITED DAYS
	ACCEPTED = 'accepted', // FINAL
	INVALID = 'invalid' // CASE : ERROR HANDLING
}
