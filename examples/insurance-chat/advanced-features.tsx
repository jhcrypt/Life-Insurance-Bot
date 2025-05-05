import React, { useState, useCallback } from 'react';
import { useInsuranceChat } from '~/lib/hooks/useInsuranceChat';
import type { KnowledgeBaseEntry } from '~/lib/modules/insurance/types';

/**
 * Example of advanced insurance chat implementation
 * 
 * This example demonstrates how to use the useInsuranceChat hook directly
 * to build a custom interface with additional features like:
 * - Knowledge base search
 * - Model selection
 * - Detailed message analysis
 * - Custom styling
 */
export default function AdvancedInsuranceChat() {
  const [input, setInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<KnowledgeBaseEntry[]>([]);
  const [selectedModel, setSelectedModel] = useState<string | undefined>(undefined);
  
  // Available models for selection
  const availableModels = [
    { name: 'Default', id: undefined },
    { name: 'GPT-4o', id: 'gpt-4o' },
    { name: 'GPT-3.5 Turbo', id: 'gpt-3.5-turbo' },
    { name: 'Claude 3', id: 'claude-3-sonnet-20240229' }
  ];
  
  // Initialize the chat hook with custom configuration
  const {
    messages,
    isLoading,
    error,
    suggestions,
    sendMessage,
    resetChat,
    searchKnowledgeBase,
    setModelOverride,
    retryLastMessage
  } = useInsuranceChat({
    onError: (err) => console.error('Chat error:', err.message),
    persistMessages: true
  });
  
  // Handle model selection
  const handleModelChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const model = e.target.value === 'default' ? undefined : e.target.value;
    setSelectedModel(model);
    setModelOverride(model);
  }, [setModelOverride]);
  
  // Handle search in knowledge base
  const handleSearch = useCallback(() => {
    if (!searchQuery.trim()) return;
    const results = searchKnowledgeBase(searchQuery);
    setSearchResults(results);
  }, [searchQuery, searchKnowledgeBase]);
  
  // Handle form submission
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    
    await sendMessage(input);
    setInput('');
  }, [input, isLoading, sendMessage]);
  
  return (
    <div className="container mx-auto p-4 flex flex-col lg:flex-row gap-4">
      {/* Main Chat Interface */}
      <div className="flex-1">
        <div className="border rounded-lg shadow-lg overflow-hidden">
          {/* Header with model selection */}
          <div className="bg-blue-600 text-white p-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold">Insurance Assistant</h2>
              <div className="flex items-center gap-2">
                <label htmlFor="model-select" className="text-sm">Model:</label>
                <select
                  id="model-select"
                  value={selectedModel || 'default'}
                  onChange={handleModelChange}
                  className="bg-blue-700 text-white p-1 rounded text-sm"
                >
                  {availableModels.map(model => (
                    <option key={model.id || 'default'} value={model.id || 'default'}>
                      {model.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
          
          {/* Message display area */}
          <div className="h-96 p-4 overflow-y-auto bg-white">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-400">
                <p>No messages yet. Start a conversation!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((msg, idx) => (
                  <div 
                    key={idx} 
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-xs md:max-w-md lg:max-w-lg p-3 rounded-lg ${
                      msg.role === 'user' 
                        ? 'bg-blue-600 text-white rounded-br-none' 
                        : 'bg-gray-200 text-gray-800 rounded-bl-none'
                    }`}>
                      <div className="text-xs opacity-70 mb-1">
                        {msg.timestamp.toLocaleTimeString()}
                        {msg.category && ` • ${msg.category}`}
                      </div>
                      <div>{msg.content}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Error display */}
          {error && (
            <div className="bg-red-50 text-red-700 p-3 border-t border-red-200 flex justify-between items-center">
              <div>{error.message}</div>
              <div className="flex gap-2">
                <button 
                  onClick={retryLastMessage}
                  className="px-3 py-1 bg-red-600 text-white rounded-md text-sm hover:bg-red-700"
                >
                  Retry
                </button>
                <button 
                  onClick={() => setError(null)}
                  className="px-3 py-1 bg-gray-200 text-gray-800 rounded-md text-sm hover:bg-gray-300"
                >
                  Dismiss
                </button>
              </div>
            </div>
          )}
          
          {/* Suggestions */}
          {suggestions.length > 0 && (
            <div className="p-3 border-t border-gray-200 flex flex-wrap gap-2">
              {suggestions.map((suggestion, idx) => (
                <button
                  key={idx}
                  onClick={() => sendMessage(suggestion)}
                  disabled={isLoading}
                  className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-full text-sm text-gray-800 transition"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          )}
          
          {/* Input form */}
          <form onSubmit={handleSubmit} className="border-t border-gray-200 p-3">
            <div className="flex">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-l focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ask about insurance..."
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-r hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {isLoading ? 'Sending...' : 'Send'}
              </button>
            </div>
            <div className="flex justify-between mt-2">
              <button
                type="button"
                onClick={resetChat}
                className="text-sm text-gray-600 hover:text-gray-800"
              >
                Reset Chat
              </button>
            </div>
          </form>
        </div>
      </div>
      
      {/* Sidebar with knowledge base search */}
      <div className="lg:w-80">
        <div className="border rounded-lg shadow-lg overflow-hidden">
          <div className="bg-gray-800 text-white p-3">
            <h3 className="font-bold">Knowledge Base Search</h3>
          </div>
          <div className="p-3">
            <div className="flex mb-3">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-l focus:outline-none"
                placeholder="Search term..."
              />
              <button
                onClick={handleSearch}
                className="px-3 py-2 bg-gray-800 text-white rounded-r"
              >
                Search
              </button>
            </div>
            
            <div className="max-h-96 overflow-y-auto">
              {searchResults.length > 0 ? (
                <div className="space-y-3">
                  {searchResults.map((result, idx) => (
                    <div key={idx} className="border rounded p-3">
                      <h4 className="font-bold">{result.term}</h4>
                      <p className="text-sm text-gray-600 mt-1">{result.definition}</p>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {result.relatedTerms?.map((term, i) => (
                          <span key={i} className="text-xs bg-gray-100 px-2 py-1 rounded">
                            {term}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : searchQuery ? (
                <p className="text-gray-500">No results found.</p>
              ) : (
                <p className="text-gray-500">Search the insurance knowledge base.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

