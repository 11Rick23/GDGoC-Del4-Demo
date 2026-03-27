import { redirect } from "next/navigation";
import { DmWebSocketListener } from "@/features/dm/components/dm-websocket-listener";
import { MessagePanel } from "@/features/dm/components/message-panel";
import { UserListPanel } from "@/features/dm/components/user-list-panel";
import type { DmPageSearchParams } from "@/features/dm/types";
import { sendDirectMessage } from "@/features/dm/server/actions";
import { getDmPageData } from "@/features/dm/server/page-data";
import { auth } from "@/lib/auth";

type DmPageProps = {
	searchParams?: DmPageSearchParams;
};

export default async function DmPage({ searchParams }: DmPageProps) {
	const session = await auth();

	if (!session?.user?.id) {
		redirect("/");
	}

	const data = await getDmPageData(searchParams);

	return (
		<main className="flex h-[calc(100vh-6.5rem)] overflow-hidden px-4 pb-4 pl-28 pt-22 text-[#000000] md:px-6 md:pb-6 md:pl-6 md:pt-16">
			<DmWebSocketListener />
			<div className="mx-auto grid h-full min-h-0 w-full max-w-7xl gap-4 lg:grid-cols-[320px_minmax(0,1fr)]">
				<UserListPanel
					users={data.users}
					activeUserId={data.activeUser?.id}
				/>
				<MessagePanel
					activeConversationId={data.activeConversationId}
					activeUser={data.activeUser}
					sendMessageAction={sendDirectMessage}
					messages={data.messages}
				/>
			</div>
		</main>
	);
}
