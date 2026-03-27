"use client"

import Link from "next/link"
import { SendHorizontal } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

type ProfileAiLatestPanelProps = {
  latestAiReply: string | null
  input: string
  loading: boolean
  canUseMatchingAi: boolean
  onInputChange: (value: string) => void
  onSend: () => void
}

export function ProfileAiLatestPanel({
  latestAiReply,
  input,
  loading,
  canUseMatchingAi,
  onInputChange,
  onSend,
}: ProfileAiLatestPanelProps) {
  return (
    <>
      <div className="flex flex-1 items-center justify-center px-4 pt-8">
        <div className="w-full max-w-2xl rounded-3xl border border-black/10 bg-white/80 p-6 text-center shadow-sm backdrop-blur-sm">
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
          {canUseMatchingAi && (
            <div className="mt-4 flex flex-col items-center gap-3">
              <Link
                href="/discovery-ai"
                className="inline-flex rounded-full bg-[linear-gradient(135deg,#0062FF_0%,#8AFFAD_100%)] px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
              >
                友達探しへ進む
              </Link>
              <p className="text-sm text-black/60">
                今後あなた自身についてもっと伝えたい時はここで教えてね！
              </p>
            </div>
          )}
        </div>
      </div>

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
    </>
  )
}
