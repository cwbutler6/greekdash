"use client"

import React from "react"
import dynamic from "next/dynamic"

// Dynamically import FeedbackBubble with no SSR to avoid hydration issues
// since it uses window.location which is only available on the client
const FeedbackBubble = dynamic(
  () => import("@/components/feedback/feedback-bubble"),
  { ssr: false }
)

export default function FeedbackProvider() {
  return <FeedbackBubble />
}
