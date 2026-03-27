import type { DmMessage } from "@/features/dm/types";

type ChatBubbleProps = {
	message: DmMessage;
};

export function ChatBubble({ message }: ChatBubbleProps) {
	const isMe = message.role === "me";

	return (
		<div className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
			<div
				className={`max-w-[80%] rounded-3xl px-4 py-3 ${
					isMe
						? "bg-[#bce2e8] text-black/80"
						: "border border-black/10 bg-white/60 text-black/80"
				}`}
			>
				<div className="mb-1 flex items-center gap-2 text-xs">
					<span className={isMe ? "text-black/45" : "text-black/45"}>
						{message.sender}
					</span>
					<span className={isMe ? "text-black/35" : "text-black/35"}>
						{message.time}
					</span>
				</div>
				<p
					className={`text-sm leading-6 ${
						isMe ? "text-black/80" : "text-black/80"
					}`}
				>
					{message.body}
				</p>
			</div>
		</div>
	);
}
