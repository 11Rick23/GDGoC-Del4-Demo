import { DmAvatar } from "@/features/dm/components/dm-avatar";
import { MessageComposer } from "@/features/dm/components/message-composer";
import { MessageList } from "@/features/dm/components/message-list";
import { NoActiveConversation } from "@/features/dm/components/no-active-conversation";
import type { DmMessage, DmUser } from "@/features/dm/types";

type MessagePanelProps = {
	activeConversationId?: string;
	activeUser: DmUser | null;
	sendMessageAction: (formData: FormData) => void | Promise<void>;
	messages: DmMessage[];
};

export function MessagePanel({
	activeConversationId,
	activeUser,
	sendMessageAction,
	messages,
}: MessagePanelProps) {
	const hasActiveConversation = activeUser !== null;
	const latestOtherMessage =
		[...messages].reverse().find((message) => message.role === "other")?.body ?? "";

	return (
		<section className="flex h-full min-h-0 flex-col overflow-hidden rounded-[28px] border border-black/10 bg-[linear-gradient(160deg,rgba(255,255,255,0.55),rgba(255,255,255,0.25))] shadow-[0_24px_80px_rgba(0,0,0,0.12)] backdrop-blur-sm">
			<div className="flex items-center justify-between gap-4 border-b border-black/8 px-5 py-5 sm:px-6">
				{hasActiveConversation ? (
					<div className="flex items-center gap-4">
						<DmAvatar
							name={activeUser.name}
							image={activeUser.image}
							sizeClassName="h-14 w-14"
							textClassName="text-base font-semibold text-black"
						/>
						<div>
							<p className="text-xs uppercase tracking-[0.26em] text-black/40">
								Active Chat
							</p>
							<h2 className="mt-1 text-xl font-medium tracking-[-0.03em] text-black/80">
								{activeUser.name}
							</h2>
						</div>
					</div>
				) : (
					<div>
						<p className="text-xs uppercase tracking-[0.26em] text-black/40">
							Direct Messages
						</p>
						<h2 className="mt-1 text-xl font-medium tracking-[-0.03em] text-black/80">
							会話相手を選択してください
						</h2>
					</div>
				)}
			</div>

			<div className="min-h-0 flex-1 overflow-hidden">
				{!hasActiveConversation ? (
					<NoActiveConversation />
				) : (
					<MessageList
						messages={messages}
						conversationId={activeConversationId}
					/>
				)}
			</div>
			<MessageComposer
				activeConversationId={activeConversationId}
				hasActiveConversation={hasActiveConversation}
				latestOtherMessage={latestOtherMessage}
				sendMessageAction={sendMessageAction}
			/>
		</section>
	);
}
