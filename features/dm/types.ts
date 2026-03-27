export type DmUser = {
	id: string;
	name: string;
	image?: string | null;
	lastMessage: string;
	lastSeen: string;
	unread: number;
};

export type DmMessage = {
	id: string;
	sender: string;
	role: "me" | "other";
	time: string;
	body: string;
};

export type DmSelectableUser = {
	id: string;
	name: string;
	image?: string | null;
};

export type DmPageSearchParams =
	| Promise<{
			conversationId?: string;
	  }>
	| undefined;

export type DmPageData = {
	currentUserId: string | null;
	activeConversationId?: string;
	activeUser: DmUser | null;
	messages: DmMessage[];
	selectableUsers: DmSelectableUser[];
	users: DmUser[];
};
