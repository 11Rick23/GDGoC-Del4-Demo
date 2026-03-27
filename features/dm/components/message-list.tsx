"use client";

import { useEffect, useRef } from "react";
import { ChatBubble } from "@/features/dm/components/chat-bubble";
import { NoMessages } from "@/features/dm/components/no-messages";
import type { DmMessage } from "@/features/dm/types";

type MessageListProps = {
	messages: DmMessage[];
	conversationId?: string;
};

export function MessageList({ messages, conversationId }: MessageListProps) {
	const scrollContainerRef = useRef<HTMLDivElement | null>(null);

	useEffect(() => {
		if (!scrollContainerRef.current) {
			return;
		}

		scrollContainerRef.current.scrollTop =
			scrollContainerRef.current.scrollHeight;
	}, [messages]);

	if (messages.length === 0) {
		return <NoMessages conversationId={conversationId} />;
	}

	return (
		<div
			ref={scrollContainerRef}
			className="h-full overflow-y-auto px-5 py-6 sm:px-6"
		>
			<div className="space-y-4">
				<p className="text-center text-xs uppercase tracking-[0.28em] text-white/30">
					Today
				</p>

				{messages.map((message) => (
					<ChatBubble key={message.id} message={message} />
				))}
			</div>
		</div>
	);
}
