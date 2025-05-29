"use client"

import React, { useState } from "react"
import { MessageSquareIcon, XIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import FeedbackForm from "./feedback-form"

export default function FeedbackBubble() {
  const [isOpen, setIsOpen] = useState(false)
  
  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {isOpen ? (
        <div className="mb-4 w-80 rounded-lg border bg-card text-card-foreground shadow-lg animate-in fade-in-50 zoom-in-95 slide-in-from-bottom-5">
          <div className="flex items-center justify-between border-b p-4">
            <h3 className="text-lg font-semibold">Send Feedback</h3>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setIsOpen(false)}
              className="h-8 w-8 rounded-full"
            >
              <XIcon className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </Button>
          </div>
          <div className="p-4">
            <FeedbackForm onClose={() => setIsOpen(false)} />
          </div>
        </div>
      ) : null}
      
      <Button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "h-12 w-12 rounded-full shadow-lg flex items-center justify-center",
          isOpen ? "bg-muted" : "bg-primary"
        )}
        aria-label="Send feedback"
      >
        <MessageSquareIcon className={cn("h-5 w-5", isOpen ? "text-primary" : "text-primary-foreground")} />
      </Button>
    </div>
  )
}
