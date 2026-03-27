"use client"

import { useState, useCallback, useRef, useEffect } from "react"

type Trigger = "yokoyure" | "unazuku" | "speak" | "otefuri" | "nayamu"

export function useCharacterTrigger(
  sendMessage:(onUserSend?: () => void, onAiReply?: () => void) => Promise<void>, loading: boolean
) {
  const [trigger, setTrigger] = useState<Trigger>("yokoyure")
  const [pendingTrigger, setPendingTrigger] = useState<Trigger | null>(null)
  const loadingRef = useRef(loading)
  const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))
  const pendingTriggerRef = useRef(pendingTrigger)
  useEffect(() => { loadingRef.current = loading }, [loading])
  useEffect(() => { pendingTriggerRef.current = pendingTrigger }, [pendingTrigger])

  const handleAnimationEnd = useCallback(async () => {
    if ( pendingTriggerRef.current) {
      setTrigger(pendingTriggerRef.current)
      setPendingTrigger(null) 
    } else if (loadingRef.current){
      await sleep(500)
      if (pendingTriggerRef.current) {                                                          
        setTrigger(pendingTriggerRef.current)                                                 
        setPendingTrigger(null)
      } else if (loadingRef.current) 
      setTrigger("nayamu")
    } else {
      setTrigger("yokoyure")
    }
  }, [])

  // const handleReceiveMessage = useCallback(() => {
  //   if (trigger === "yokoyure") {
  //     setTrigger("speak")
  //   }
  // }, [trigger])

  const handleSendMessage = useCallback(async () => {
    await sendMessage(
      () => setTrigger("unazuku"), //ユーザーメッセージ送信のコールバック（unazukuアニメーション開始）
      () => setPendingTrigger("speak") //AI返信のコールバック（speakアニメーション開始）      
    )
  }, [sendMessage])

  return { trigger, handleAnimationEnd, handleSendMessage }
}
