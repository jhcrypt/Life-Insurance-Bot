'use client'

import { useState, useCallback } from 'react' 
import { useInsuranceChat } from '~/lib/hooks/useInsuranceChat'
import { ChatMiddleware } from '~/lib/modules/insurance/middleware/chat-middleware'
import { Message } from '~/lib/modules/insurance/types'
import { BaseChat } from './BaseChat'
import { InsurancePrompts } from './InsurancePrompts'
import { ErrorAlert } from '../ui/alerts/ErrorAlert'

export interface InsuranceChatProps {
className?: string
}

export function InsuranceChat({ className }: InsuranceChatProps) {
const [error, setError] = useState<string | null>(null)
const [suggestions, setSuggestions] = useState<string[]>([])
const middleware = new ChatMiddleware()

const { 
    messages,
    isLoading,
    sendMessage: rawSendMessage,
    resetChat 
} = useInsuranceChat({
    onError: (err) => setError(err.message)
})

const sendMessage = useCallback(async (content: string) => {
    try {
    const response = await middleware.processMessage(content)
    await rawSendMessage(response.message)
    if (response.suggestions) {
        setSuggestions(response.suggestions)
    }
    } catch (err) {
    setError(err instanceof Error ? err.message : 'Failed to process message')
    }
}, [middleware, rawSendMessage])

return (
    <div className="relative w-full">
    {error && (
        <ErrorAlert
        message={error}
        className="mb-4"
        onClose={() => setError(null)} 
        />
    )}
    
    <BaseChat
    className={className}
    messages={messages}
    onSendMessage={sendMessage}
    onReset={resetChat}
    isLoading={isLoading}
    promptsComponent={InsurancePrompts}
    suggestions={suggestions}
    placeholder="Ask me anything about insurance..."
    />
    </div>
)
}

