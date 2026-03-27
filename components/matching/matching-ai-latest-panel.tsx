"use client"

import { SendHorizontal } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { MatchResult } from "@/hooks/use-matching-ai-chat"

type MatchingAiLatestPanelProps = {
  latestAiReply: string | null
  input: string
  loading: boolean
  canUseMatchingAi: boolean
  showMatchingResults: boolean
  matchResults: MatchResult[]
  onInputChange: (value: string) => void
  onSend: () => void
  onOpenDm: (targetUserId: string) => Promise<void>
}

export function MatchingAiLatestPanel({
  latestAiReply,
  input,
  loading,
  canUseMatchingAi,
  showMatchingResults,
  matchResults,
  onInputChange,
  onSend,
  onOpenDm,
}: MatchingAiLatestPanelProps) {
  return (
    <>
      <div className="flex flex-1 items-center justify-center px-4 pt-8">
        <div
          className={`w-full max-w-2xl rounded-3xl border border-black/10 bg-white/80 p-6 text-center shadow-sm backdrop-blur-sm ${
            showMatchingResults ? "mt-48" : ""
          }`}
        >
          {!showMatchingResults && (
            <>
              <p className="text-sm text-black/50">Latest Reply</p>
              {loading ? (
                <div className="mt-4 flex justify-center">
                  <Button
                    disabled
                    className="rounded-full border border-black/10 bg-white px-4 py-2 text-sm font-medium text-black/60 hover:bg-white"
                  >
                    考え中...
                  </Button>
                </div>
              ) : (
                <p className="mt-3 text-lg leading-8 text-black">
                  {latestAiReply ?? "まだ返信はありません"}
                </p>
              )}
            </>
          )}
          {showMatchingResults && matchResults.length > 0 && (
            <div className="mt-8 text-left">
              <p className="text-base font-semibold text-black">
                あなたに合いそうな友達を探してきたよ
              </p>
              <div className="mt-4 grid grid-cols-3 gap-3">
                {matchResults.map((match) => (
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
          )}
        </div>
      </div>

      {canUseMatchingAi && (
        <div className="fixed inset-x-0 bottom-0 z-20 flex justify-center px-4 pb-6">
          <div className="flex w-full max-w-2xl gap-2 rounded-2xl border border-black/10 bg-white/90 p-3 shadow-lg backdrop-blur-sm">
            <Input
              className="bg-white text-black placeholder:text-black/40 border-black/10"
              placeholder="メッセージを入力..."
              value={input}
              onChange={(e) => onInputChange(e.target.value)}
              disabled={loading}
            />
            <Button
              onClick={onSend}
              disabled={loading}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-black/10 bg-transparent p-0 text-black/70 transition-colors hover:bg-black/5 hover:text-black disabled:cursor-not-allowed disabled:border-black/5 disabled:text-black/35"
            >
              <SendHorizontal className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </>
  )
}
