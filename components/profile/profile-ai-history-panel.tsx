"use client"

import { HaroIcon } from "@/components/ui/icon"
import { Skeleton } from "@/components/ui/skeleton"
import type { Message } from "@/hooks/use-profile-ai-chat"

type ProfileAiHistoryPanelProps = {
  messages: Message[]
  loading: boolean
}

export function ProfileAiHistoryPanel({
  messages,
  loading,
}: ProfileAiHistoryPanelProps) {
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
            <div
              className={`max-w-xs rounded-2xl px-4 py-2 text-sm ${
                msg.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted"
              }`}
            >
              {msg.text}
            </div>
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
