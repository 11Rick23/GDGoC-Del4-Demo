import Link from "next/link";
import { DmAvatar } from "@/features/dm/components/dm-avatar";
import type { DmUser } from "@/features/dm/types";

type UserListItemProps = {
	user: DmUser;
	isActive: boolean;
};

export function UserListItem({ user, isActive }: UserListItemProps) {
	return (
		<Link
			href={`/dm?conversationId=${user.id}`}
			className={`flex items-center gap-3 rounded-2xl px-3 py-3 text-left transition-colors ${
				isActive ? "bg-[#bce2e8]" : "hover:bg-black/5"
			}`}
		>
			<DmAvatar
				name={user.name}
				image={user.image}
				sizeClassName="h-12 w-12"
				textClassName="text-sm font-semibold text-black"
			/>

			<div className="min-w-0 flex-1">
				<div className="flex items-start justify-between gap-3">
					<p className="min-w-0 truncate text-sm font-medium text-black/80">
						{user.name}
					</p>
					<p className="shrink-0 text-xs text-black/40">{user.lastSeen}</p>
				</div>

				<div className="mt-2 flex items-center justify-between gap-3">
					<p className="truncate text-sm text-black/55">{user.lastMessage}</p>
					{user.unread > 0 && (
						<span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-black/80 px-2 text-xs font-semibold text-white">

							{user.unread}
						</span>
					)}
				</div>
			</div>
		</Link>
	);
}
