"use client"

import { useCallback, useEffect, useState } from "react"

export type Message = {
  id: number | string
  role: "user" | "ai"
  text: string
}

export type ChatState = {
  name: string | null
  answers: Record<string, string[]>
  attempts: Record<string, number>
  profile_txt: string | null
  step: string
}

type ChatResponse = {
  reply: string
  state: ChatState
  canUseMatchingAi?: boolean
}

type InitialChatResponse = {
  replies?: string[]
  messages?: Message[]
  state: ChatState
  canUseMatchingAi?: boolean
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export function useProfileAiChat() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [chatState, setChatState] = useState<ChatState | null>(null)
  const [canUseMatchingAi, setCanUseMatchingAi] = useState(false)

  const appendMessage = useCallback((role: Message["role"], text: string) => {
    setMessages((prev) => [...prev, { id: Date.now(), role, text }])
  }, [])

  const applyAssistantReply = useCallback((data: ChatResponse) => {
    setChatState(data.state)
    setCanUseMatchingAi(Boolean(data.canUseMatchingAi))
    appendMessage("ai", data.reply)
  }, [appendMessage])

  const applyInitialReplies = useCallback((data: InitialChatResponse) => {
    setChatState(data.state)
    setCanUseMatchingAi(Boolean(data.canUseMatchingAi))
    if (data.messages && data.messages.length > 0) {
      setMessages(data.messages)
      return
    }

    setMessages((data.replies ?? []).map((text, index) => ({
      id: Date.now() + index,
      role: "ai" as const,
      text,
    })))
  }, [])

  const requestInitialReplies = async (): Promise<InitialChatResponse> => {
    const response = await fetch("/api/ai-chat_myProfile", {
      method: "GET",
    })

    if (!response.ok) {
      throw new Error("Failed to start chat")
    }

    return response.json()
  }

  const requestChatReply = async (message: string, state: ChatState | null): Promise<ChatResponse> => {
    const response = await fetch("/api/ai-chat_myProfile", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message,
        state,
      }),
    })

    if (!response.ok) {
      throw new Error("Failed to send message")
    }

    return response.json()
  }

  useEffect(() => {
    const startChat = async () => {
      setLoading(true)

      try {
        const data = await requestInitialReplies()
        applyInitialReplies(data)
      } catch (error) {
        console.error(error)
        appendMessage("ai", "チャットの開始に失敗しました。時間をおいて再度お試しください。")
      } finally {
        setLoading(false)
      }
    }

    void startChat()
  }, [appendMessage, applyInitialReplies])

  const sendMessage = useCallback(async (onUserSend?: () => void, onAiReply?: () => void) => {
    const message = input.trim()
    if (!message || loading) return

    appendMessage("user", message)
    onUserSend?.()
    setInput("")
    setLoading(true)

    try {
      const data = await requestChatReply(message, chatState)
      await sleep(1500)
      applyAssistantReply(data)
      onAiReply?.()
    } catch (error) {
      console.error(error)
      appendMessage("ai", "返信の取得に失敗しました。再度送信してください。")
    } finally {
      setLoading(false)
    }
  }, [input, loading, chatState, appendMessage, applyAssistantReply])

  return {
    messages,
    input,
    loading,
    setInput,
    sendMessage,
    canUseMatchingAi,
  }
}
