"use client"

import { Button } from "@/components/ui/button"
import { HaroIcon } from "@/components/ui/icon"
import { Skeleton } from "@/components/ui/skeleton"
import type { MatchingMessage } from "@/hooks/use-matching-ai-chat"

type MatchingAiHistoryPanelProps = {
  messages: MatchingMessage[]
  loading: boolean
  onOpenDm: (targetUserId: string) => Promise<void>
}

export function MatchingAiHistoryPanel({
  messages,
  loading,
  onOpenDm,
}: MatchingAiHistoryPanelProps) {
  return (
    <div className="w-full p-4">
      <div className="flex max-h-[60vh] flex-col gap-3 overflow-y-auto pr-2">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex items-end gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            {msg.role === "ai" && (
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">
                <HaroIcon className="h-6 w-6" />
              </div>
            )}
            {/* マッチカードの表示 */}
            {msg.messageType === "match_results" && Array.isArray(msg.payloadJson) ? (
              <div className="w-full max-w-2xl rounded-2xl bg-muted p-4">
                <div className="max-w-xs rounded-2xl bg-muted px-4 py-2 text-sm">
                  {msg.text}
                </div>
                <div className="mt-4 grid grid-cols-3 gap-3">
                  {msg.payloadJson.map((match) => (
                    <div
                      key={match.userId}
                      className="min-w-0 rounded-2xl border border-black/10 bg-white p-4 shadow-sm"
                    >
                      <p className="text-base font-semibold text-black">{match.nickname}</p>
                      <p className="mt-2 text-sm leading-6 text-black/70">{match.matchReason}</p>
                      <Button
                        className="mt-4 border border-black/10 bg-white text-black hover:bg-black/10"
                        onClick={() => void onOpenDm(match.userId)}
                      >
                        DMする
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div
                className={`max-w-xs rounded-2xl px-4 py-2 text-sm ${
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted"
                }`}
              >
                {msg.text}
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex items-center gap-3">
            <Skeleton className="h-8 w-8 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-[200px]" />
              <Skeleton className="h-4 w-[150px]" />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
