"use client";

import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { MatchingAiHistoryPanel } from "@/components/matching/matching-ai-history-panel";
import { MatchingAiLatestPanel } from "@/components/matching/matching-ai-latest-panel";
import { Button } from "@/components/ui/button";
import { useCharacterTrigger } from "@/hooks/use-character-trigger";
import { useMatchingAiChat } from "@/hooks/use-matching-ai-chat";

const CharacterViewer = dynamic(() => import("@/components/3D/3DViewer"), {
	ssr: false,
});

export function DiscoveryAiPageClient() {
	const router = useRouter();
	const { messages, input, loading, setInput, sendMessage, canUseMatchingAi } =
		useMatchingAiChat();
	const [showHistoryOnly, setShowHistoryOnly] = useState(false);
	const activeTabClass =
		"border-transparent bg-[#bce2e8] text-black/80 hover:bg-[#bce2e8] hover:text-black/80";
	const inactiveTabClass =
		"border-transparent bg-white/80 text-black/70 hover:bg-white hover:text-black";
	const { trigger, handleAnimationEnd, handleSendMessage } =
		useCharacterTrigger(sendMessage, loading);
	const latestMessage = messages[messages.length - 1] ?? null;
	const latestAiReply =
		[...messages]
			.reverse()
			.find((message) => message.role === "ai" && message.messageType !== "match_results")
			?.text ?? null;
	const latestMatchResults =
		latestMessage?.messageType === "match_results" &&
		Array.isArray(latestMessage.payloadJson)
			? latestMessage.payloadJson
			: [];
	const showLatestMatchingResults = latestMatchResults.length > 0;

	const openDm = async (targetUserId: string) => {
		const response = await fetch("/api/dm/open", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({ targetUserId }),
		});

		if (!response.ok) {
			throw new Error("Failed to open DM");
		}

		const data: { conversationId: string } = await response.json();
		router.push(`/dm?conversationId=${data.conversationId}`);
	};

	return (
		<div className="relative flex min-h-0 flex-1 flex-col px-6 py-12 text-[#000000]">
			<div className="absolute inset-0 z-0">
				<CharacterViewer
					trigger={trigger}
					onAnimationEnd={handleAnimationEnd}
				/>
			</div>
			<main className="relative z-10 mx-auto flex min-h-0 w-full max-w-2xl flex-1 flex-col gap-4 p-4 pb-32">
				<div className="-ml-2 flex self-start gap-2">
					<Button
						variant="outline"
						className={!showHistoryOnly ? activeTabClass : inactiveTabClass}
						onClick={() => setShowHistoryOnly(false)}
					>
						チャット表示
					</Button>
					<Button
						variant="outline"
						className={showHistoryOnly ? activeTabClass : inactiveTabClass}
						onClick={() => setShowHistoryOnly(true)}
					>
						履歴表示
					</Button>
				</div>

				{!showHistoryOnly && (
					<MatchingAiLatestPanel
						latestAiReply={latestAiReply}
						input={input}
						loading={loading}
						canUseMatchingAi={canUseMatchingAi}
						showMatchingResults={showLatestMatchingResults}
						matchResults={latestMatchResults}
						onInputChange={setInput}
						onSend={handleSendMessage}
						onOpenDm={openDm}
					/>
				)}

				{showHistoryOnly && (
					<div className="w-full">
						<MatchingAiHistoryPanel
							messages={messages}
							loading={loading}
							onOpenDm={openDm}
						/>
					</div>
				)}
			</main>
		</div>
	);
}
