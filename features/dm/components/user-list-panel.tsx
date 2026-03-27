import { NoConversations } from "@/features/dm/components/no-conversations";
import type { DmUser } from "@/features/dm/types";
import { UserListItem } from "@/features/dm/components/user-list-item";

type UserListPanelProps = {
	users: DmUser[];
	activeUserId?: string;
};

export function UserListPanel({ users, activeUserId }: UserListPanelProps) {
	return (
		<aside className="flex h-full min-h-0 flex-col overflow-hidden rounded-[28px] border border-black/10 bg-[linear-gradient(145deg,rgba(255,255,255,0.55),rgba(255,255,255,0.25))] shadow-[0_24px_80px_rgba(0,0,0,0.12)] backdrop-blur-sm">
			<div className="border-b border-black/8 px-5 py-5">
				<p className="text-xs uppercase tracking-[0.28em] text-black/40">
					Direct Messages
				</p>
				<h1 className="mt-2 text-2xl font-medium tracking-[-0.03em] text-black/80">
					Chats
				</h1>
			</div>

			<div className="flex min-h-0 flex-1 flex-col overflow-y-auto p-3">
				{users.length > 0 ? (
					users.map((user) => (
						<UserListItem
							key={user.id}
							user={user}
							isActive={user.id === activeUserId}
						/>
					))
				) : (
					<NoConversations />
				)}
			</div>
		</aside>
	);
}
