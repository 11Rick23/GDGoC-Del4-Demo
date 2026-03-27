"use client"

import { useCallback, useEffect, useState } from "react"

export type MatchingMessage = {
  id: number | string
  role: "user" | "ai"
  text: string
  messageType?: "text" | "match_results"
  payloadJson?: MatchResult[] | null
}

export type MatchingChatState = {
  name: string | null
  answers: Record<string, string[]>
  attempts: Record<string, number>
  profile_txt: string | null
  preferred_profile_txt?: string | null
  avoid_profile_txt?: string | null
  step: string
}

export type MatchResult = {
  userId: string
  nickname: string
  profileText: string
  matchReason: string
}

type ChatResponse = {
  reply: string
  state: MatchingChatState
  shouldFetchMatching?: boolean
}

type InitialChatResponse = {
  replies?: string[]
  messages?: MatchingMessage[]
  state: MatchingChatState
  showMatchingResults?: boolean
  matchResults?: MatchResult[]
  canUseMatchingAi?: boolean
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function createClientMessageId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID()
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

export function useMatchingAiChat() {
  const [messages, setMessages] = useState<MatchingMessage[]>([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [chatState, setChatState] = useState<MatchingChatState | null>(null)
  const [showMatchingResults, setShowMatchingResults] = useState(false)
  const [matchResults, setMatchResults] = useState<MatchResult[]>([])
  const [canUseMatchingAi, setCanUseMatchingAi] = useState(true)

  const appendMessage = useCallback((role: MatchingMessage["role"], text: string) => {
    setMessages((prev) => [...prev, { id: createClientMessageId(), role, text }])
  }, [])

  const appendMatchResultsMessage = useCallback((results: MatchResult[]) => {
    setMessages((prev) => [
      ...prev,
      {
        id: createClientMessageId(),
        role: "ai",
        text: "あなたに合いそうな友達を探してきたよ",
        messageType: "match_results",
        payloadJson: results,
      }
    ])
  }, [])

  const applyAssistantReply = useCallback((data: ChatResponse) => {
    setChatState(data.state)
    appendMessage("ai", data.reply)
  },[appendMessage])

  const applyInitialReplies = (data: InitialChatResponse) => {
    setChatState(data.state)
    setShowMatchingResults(Boolean(data.showMatchingResults))
    setMatchResults(data.matchResults ?? [])
    setCanUseMatchingAi(Boolean(data.canUseMatchingAi))
    if (data.messages && data.messages.length > 0) {
      setMessages(data.messages)
      return
    }

    setMessages((data.replies ?? []).map((text, index) => ({
      id: createClientMessageId(),
      role: "ai" as const,
      text,
    })))
  }

  const requestInitialReplies = async (): Promise<InitialChatResponse> => {
    const response = await fetch("/api/ai-chat_targetProfile/init", {
      method: "GET",
    })

    if (!response.ok) {
      throw new Error("Failed to start chat")
    }

    return response.json()
  }

  const requestChatReply = async (message: string, state: MatchingChatState | null): Promise<ChatResponse> => {
    const response = await fetch("/api/ai-chat_targetProfile/chat", {
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

  const requestMatchingResults = async (): Promise<InitialChatResponse> => {
    const response = await fetch("/api/ai-chat_targetProfile/matching", {
      method: "POST",
    })

    if (!response.ok) {
      throw new Error("Failed to fetch matching results")
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
  }, [appendMessage])

  const sendMessage = useCallback(async (onUserSend?: () => void, onAiReply?: () => void) => {
    const message = input.trim()
    if (!message || loading) return
    if (!canUseMatchingAi) return

    appendMessage("user", message)
    onUserSend?.()
    setInput("")
    setLoading(true)

    try {
      const data = await requestChatReply(message, chatState)
      await sleep(1500)
      applyAssistantReply(data)
      onAiReply?.()

      if (data.shouldFetchMatching) {
        const matchingData = await requestMatchingResults()
        setChatState(matchingData.state)
        setShowMatchingResults(Boolean(matchingData.showMatchingResults))
        setMatchResults(matchingData.matchResults ?? [])
        if ((matchingData.matchResults ?? []).length > 0) {
          appendMatchResultsMessage(matchingData.matchResults ?? [])
        }
      }
    } catch (error) {
      console.error(error)
      appendMessage("ai", "返信の取得に失敗しました。再度送信してください。")
    } finally {
      setLoading(false)
    }
  },[
    input,
    loading,
    canUseMatchingAi,
    chatState,
    appendMessage,
    appendMatchResultsMessage,
    applyAssistantReply,
  ])

  return {
    messages,
    input,
    loading,
    setInput,
    sendMessage,
    showMatchingResults,
    matchResults,
    canUseMatchingAi,
  }
}
