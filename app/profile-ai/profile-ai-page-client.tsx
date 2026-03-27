"use client"

import { useState } from "react"
import dynamic from "next/dynamic"
import { Button } from "@/components/ui/button"
import { ProfileAiHistoryPanel } from "@/components/profile/profile-ai-history-panel"
import { ProfileAiLatestPanel } from "@/components/profile/profile-ai-latest-panel"
import { useProfileAiChat } from "@/hooks/use-profile-ai-chat"
import { useCharacterTrigger } from "@/hooks/use-character-trigger"

const CharacterViewer = dynamic(() => import("@/components/3D/3DViewer"), { ssr: false })

export function ProfileAiPageClient() {
  const { messages, input, loading, setInput, sendMessage, canUseMatchingAi } = useProfileAiChat()
  const [showHistoryOnly, setShowHistoryOnly] = useState(false)
  const latestAiReply = [...messages].reverse().find((message) => message.role === "ai")?.text ?? null
  const { trigger, handleAnimationEnd, handleSendMessage } = useCharacterTrigger(sendMessage, loading)
  const activeTabClass =
    "border-transparent bg-[#bce2e8] text-black/80 hover:bg-[#bce2e8] hover:text-black/80"
  const inactiveTabClass = "border-transparent bg-white/80 text-black/70 hover:bg-white hover:text-black"

  return (
    <div className="relative flex min-h-0 flex-1 flex-col px-6 py-12 text-[#000000]">
      <div className="absolute inset-0 z-0">
        <CharacterViewer trigger={trigger} onAnimationEnd={handleAnimationEnd} />
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
          <ProfileAiLatestPanel
            latestAiReply={latestAiReply}
            input={input}
            loading={loading}
            canUseMatchingAi={canUseMatchingAi}
            onInputChange={setInput}
            onSend={handleSendMessage}
          />
        )}

        {showHistoryOnly && (
          <div className="w-full">
            <ProfileAiHistoryPanel messages={messages} loading={loading} />
          </div>
        )}
      </main>
    </div>
  )
}
