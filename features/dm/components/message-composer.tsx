"use client";

import { RotateCw, SendHorizontal } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { SendMessageButton } from "@/features/dm/components/send-message-button";
import { HaroIcon } from "@/components/ui/icon";

type MessageComposerProps = {
	activeConversationId?: string;
	hasActiveConversation: boolean;
	latestOtherMessage: string;
	sendMessageAction: (formData: FormData) => void | Promise<void>;
};

export function MessageComposer({
	activeConversationId,
	hasActiveConversation,
	latestOtherMessage,
	sendMessageAction,
}: MessageComposerProps) {
	const [showAiPrompt, setShowAiPrompt] = useState(false);
	const [aiPrompt, setAiPrompt] = useState("");
	const [creatingDraft, setCreatingDraft] = useState(false);
	const [loadingSuggestions, setLoadingSuggestions] = useState(false);
	const [body, setBody] = useState("");
	const [draftSuggestions, setDraftSuggestions] = useState<string[]>([
		"いいね！その話もっと聞きたい",
		"それ面白そう、詳しく教えて",
		"わかる、自分も気になるかも",
	]);

	/**
	 * 返信3件をAPI経由で取得
	 */
	const loadSuggestions = useCallback(async () => {
		if (!hasActiveConversation) {
			return;
		}

		setLoadingSuggestions(true);

		try {
			const response = await fetch("/api/dm/ai-suggest/suggest", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					text: latestOtherMessage,
				}),
			});

			if (!response.ok) {
				return;
			}

			const data = (await response.json()) as { suggestions?: string[] };
			if (Array.isArray(data.suggestions) && data.suggestions.length > 0) {
				setDraftSuggestions(data.suggestions);
			}
		} catch {
			// Keep the fallback suggestions when the request fails.
		} finally {
			setLoadingSuggestions(false);
		}
	}, [hasActiveConversation, latestOtherMessage]);

	useEffect(() => {
		if (!hasActiveConversation) {
			return;
		}
		void loadSuggestions();
	}, [activeConversationId, hasActiveConversation, loadSuggestions]);

	/** 
	 * AI生成入力欄の内容からAPI経由で通常入力欄に下書きを作成
	 */
	async function handleCreateDraft() {
		const instruction = aiPrompt.trim();
		if (!instruction || !hasActiveConversation) {
			return;
		}

		setCreatingDraft(true);

		try {
			const response = await fetch("/api/dm/ai-suggest/create", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					input: body,
					instruction,
				}),
			});

			if (!response.ok) {
				return;
			}

			const data = (await response.json()) as { text?: string };
			if (data.text) {
				setBody(data.text);
			}
		} finally {
			setCreatingDraft(false);
		}
	}

	/**
	 * AI入力欄の開閉切替
	 */
	function handleToggleAiPrompt() {
		setShowAiPrompt((prev) => {
			if (prev) {
				setAiPrompt("");
			}

			return !prev;
		});
	}

	/** 
	 * DM送信時にAPI経由でbot返信を作成
	 */
	function handleSendSubmit() {
		const latestUserMessage = body.trim();

		if (!activeConversationId || !latestUserMessage) {
			return;
		}

		void fetch("/api/dm/bot-reply", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				conversationId: activeConversationId,
				latestUserMessage,
			}),
			keepalive: true,
		});
	}

	return (
		<div className="border-t border-black/8 px-5 py-4 sm:px-6">
			{hasActiveConversation && !showAiPrompt && (
				<div className="mb-3 flex flex-wrap items-center gap-2">
					{draftSuggestions.map((suggestion) => (
						<button
							type="button"
							key={suggestion}
							onClick={() => setBody(suggestion)}
							className="rounded-full border border-black/10 bg-black/5 px-3 py-2 text-xs text-black/70 transition-colors hover:bg-black/10"
						>
							{suggestion}
						</button>
					))}
					<button
						type="button"
						onClick={() => void loadSuggestions()}
						disabled={loadingSuggestions}
						className="flex h-9 w-9 items-center justify-center rounded-full border border-black/10 bg-black/5 text-black/70 transition-colors hover:bg-black/10 disabled:cursor-not-allowed disabled:opacity-50"
						aria-label="候補を更新"
					>
						<RotateCw className={`h-4 w-4 ${loadingSuggestions ? "animate-spin" : ""}`} />
					</button>
				</div>
			)}

			{showAiPrompt && (
				<div className="mb-3 flex h-9 items-center rounded-[24px] border border-black/10 bg-black/5 px-3">
					<div className="flex w-full items-center gap-2">
						<input
							type="text"
							placeholder="AIに生成してほしい内容を入力"
							value={aiPrompt}
							onChange={(event) => setAiPrompt(event.target.value)}
							disabled={!hasActiveConversation || creatingDraft}
							className="min-w-0 flex-1 bg-transparent text-xs leading-none text-black/80 outline-none placeholder:text-black/35 disabled:cursor-not-allowed disabled:text-black/35"
						/>
						<button
							type="button"
							onClick={() => void handleCreateDraft()}
							disabled={!hasActiveConversation || creatingDraft}
							className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-black/10 bg-transparent text-black/70 transition-colors hover:bg-black/5 hover:text-black disabled:cursor-not-allowed disabled:border-black/5 disabled:text-black/35"
							aria-label="AI生成"
						>
							<SendHorizontal className={`h-3.5 w-3.5 ${creatingDraft ? "animate-pulse" : ""}`} />
						</button>
					</div>
				</div>
			)}

			<form
				action={sendMessageAction}
				onSubmit={handleSendSubmit}
				className="flex items-center gap-3 rounded-[24px] border border-black/10 bg-black/5 px-4 py-3"
			>
				<input
					type="hidden"
					name="conversationId"
					value={activeConversationId ?? ""}
				/>
				<input
					type="text"
					name="body"
					value={body}
					placeholder={
						hasActiveConversation
							? "メッセージを入力"
							: "会話を選択すると入力できます"
					}
					onChange={(event) => setBody(event.target.value)}
					disabled={!hasActiveConversation}
					className="h-9 min-w-0 flex-1 bg-transparent text-sm text-black/80 outline-none placeholder:text-black/35 disabled:cursor-not-allowed disabled:text-black/35"
				/>
				<button
					type="button"
					disabled={!hasActiveConversation}
					onClick={handleToggleAiPrompt}
					className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-black/10 bg-transparent text-black/70 transition-colors hover:bg-black/5 hover:text-black disabled:cursor-not-allowed disabled:border-black/5 disabled:text-black/35"
					aria-label="AI入力を開く"
				>
					<HaroIcon className="h-6 w-6" />
				</button>
				<SendMessageButton disabled={!hasActiveConversation} />
			</form>
		</div>
	);
}
