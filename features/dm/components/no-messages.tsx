"use client";

import { useEffect, useState } from "react";

type NoMessagesProps = {
	conversationId?: string;
};

export function NoMessages({ conversationId }: NoMessagesProps) {
	const [starterText, setStarterText] = useState("");

	useEffect(() => {
		if (!conversationId) {
			setStarterText("");
			return;
		}

		let isCancelled = false;

		const loadStarterText = async () => {
			try {
				const response = await fetch("/api/dm/ai-suggest/starter", {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({ conversationId }),
				});

				if (!response.ok) {
					return;
				}

				const data = (await response.json()) as { text?: string };
				if (!isCancelled) {
					setStarterText(data.text?.trim() ?? "");
				}
			} catch {
				if (!isCancelled) {
					setStarterText("");
				}
			}
		};

		void loadStarterText();

		return () => {
			isCancelled = true;
		};
	}, [conversationId]);

	return (
		<div className="flex h-full min-h-80 flex-col items-center justify-center rounded-[28px] border border-dashed border-black/15 bg-black/5 px-6 text-center">
			<p className="text-base font-medium text-black/60">まだメッセージがありません</p>
			<p className="mt-3 max-w-md text-sm leading-6 text-black/45">
				{starterText || "最初のメッセージが送信されると、ここに会話の履歴が表示されます。"}
			</p>
		</div>
	);
}
