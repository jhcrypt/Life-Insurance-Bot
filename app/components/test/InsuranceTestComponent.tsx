import React, { useState, useEffect, useRef } from 'react';
import { useInsuranceChat, InsuranceMessage } from '../../lib/hooks/useInsuranceChat';
import { 
  testBasicChatInteractions,
  testInsuranceSpecificFeatures,
  testErrorScenarios,
  testPersistence,
  testSuggestions,
  testConversationFlow
} from '../../lib/modules/insurance/__tests__/manual-test-script';

/**
 * Component for testing the insurance chat functionality
 */
export default function InsuranceTestComponent() {
  const [input, setInput] = useState('');
  const [testLogs, setTestLogs] = useState<string[]>([]);
  const [isRunningTest, setIsRunningTest] = useState(false);
  const [selectedTest, setSelectedTest] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Initialize the chat hook
  const {
    messages,
    isLoading,
    error,
    suggestions,
    sendMessage,
    resetChat,
    retryLastMessage
  } = useInsuranceChat({
    onError: (err) => {
      addTestLog(`Error: ${err.message}`);
    },
    persistMessages: true
  });
  
  // Add a log message to the test logs
  const addTestLog = (log: string) => {
    setTestLogs(prev => [...prev, `[${new Date().toISOString()}] ${log}`]);
  };
  
  // Clear the test logs
  const clearTestLogs = () => {
    setTestLogs([]);
  };
  
  // Scroll to bottom of messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, testLogs]);
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    
    try {
      await sendMessage(input);
      setInput('');
    } catch (err) {
      addTestLog(`Error sending message: ${err instanceof Error ? err.message : String(err)}`);
    }
  };
  
  // Handle suggestion click
  const handleSuggestionClick = async (suggestion: string) => {
    if (isLoading) return;
    
    try {
      setInput(suggestion);
      await sendMessage(suggestion);
      setInput('');
    } catch (err) {
      addTestLog(`Error sending suggestion: ${err instanceof Error ? err.message : String(err)}`);
    }
  };
  
  // Run a test function
  const runTest = async (testName: string, testFn: Function) => {
    if (isRunningTest) return;
    
    setIsRunningTest(true);
    setSelectedTest(testName);
    addTestLog(`Starting test: ${testName}`);
    
    try {
      // Override console.log to capture test logs
      const originalConsoleLog = console.log;
      console.log = (...args) => {
        addTestLog(args.join(' '));
        originalConsoleLog(...args);
      };
      
      // Run the test
      await testFn({ 
        messages, 
        isLoading, 
        error, 
        suggestions, 
        sendMessage, 
        resetChat, 
        retryLastMessage 
      });
      
      addTestLog(`Completed test: ${testName}`);
      
      // Restore console.log
      console.log = originalConsoleLog;
    } catch (err) {
      addTestLog(`Test failed: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsRunningTest(false);
    }
  };
  
  // Format timestamp for display
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };
  
  return (
    <div className="flex flex-col h-screen bg-gray-100">
      <header className="bg-blue-600 text-white p-4">
        <h1 className="text-xl font-bold">Insurance Chat Test Component</h1>
        <p>Run tests and validate insurance chat functionality</p>
      </header>
      
      <div className="flex flex-1 overflow-hidden">
        {/* Chat Interface */}
        <div className="flex flex-col w-1/2 p-4 border-r border-gray-300">
          <div className="bg-white rounded-lg shadow-md flex-1 flex flex-col overflow-hidden">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold">Chat Interface</h2>
              {isRunningTest && (
                <div className="mt-2">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                    Running Test: {selectedTest}
                  </span>
                </div>
              )}
            </div>
            
            <div className="flex-1 p-4 overflow-y-auto">
              {messages.length === 0 ? (
                <div className="flex items-center justify-center h-full text-gray-500">
                  No messages yet. Start a conversation or run a test.
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((msg, index) => (
                    <div 
                      key={index} 
                      className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div 
                        className={`max-w-xs md:max-w-md lg:max-w-lg p-3 rounded-lg ${
                          msg.role === 'user' 
                            ? 'bg-blue-600 text-white rounded-br-none' 
                            : 'bg-gray-200 text-gray-800 rounded-bl-none'
                        }`}
                      >
                        <div className="text-xs opacity-70 mb-1">
                          {formatTime(msg.timestamp)}
                          {msg.category && ` • ${msg.category}`}
                        </div>
                        <div>{msg.content}</div>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>
            
            {/* Suggestions */}
            {suggestions.length > 0 && (
              <div className="p-2 border-t border-gray-200 flex flex-wrap gap-2">
                {suggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="text-sm px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-full text-gray-800 transition"
                    disabled={isLoading}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            )}
            
            {/* Input Form */}
            <form onSubmit={handleSubmit} className="p-4 border-t border-gray-200">
              <div className="flex">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Type a message..."
                  disabled={isLoading}
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-r-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={isLoading || !input.trim()}
                >
                  {isLoading ? 'Sending...' : 'Send'}
                </button>
              </div>
              {error && (
                <div className="mt-2 text-red-600 text-sm">
                  Error: {error.message}
                </div>
              )}
            </form>
          </div>
        </div>
        
        {/* Test Controls */}
        <div className="flex flex-col w-1/2 p-4">
          <div className="bg-white rounded-lg shadow-md mb-4">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold">Test Controls</h2>
            </div>
            <div className="p-4 grid grid-cols-2 gap-3">
              <button
                onClick={() => runTest('Basic Chat Interactions', testBasicChatInteractions)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                disabled={isRunningTest || isLoading}
              >
                Test Basic Chat
              </button>
              <button
                onClick={() => runTest('Insurance-Specific Features', testInsuranceSpecificFeatures)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                disabled={isRunningTest || isLoading}
              >
                Test Insurance Features
              </button>
              <button
                onClick={() => runTest('Error Scenarios', testErrorScenarios)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                disabled={isRunningTest || isLoading}
              >
                Test Error Handling
              </button>
              <button
                onClick={() => runTest('Persistence Testing', testPersistence)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                disabled={isRunningTest || isLoading}
              >
                Test Persistence
              </button>
              <button
                onClick={() => runTest('Suggestion Functionality', testSuggestions)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                disabled={isRunningTest || isLoading}
              >
                Test Suggestions
              </button>
              <button
                onClick={() => runTest('Conversation Flow', testConversationFlow)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                disabled={isRunningTest || isLoading}
              >
                Test Conversation Flow
              </button>
            </div>
            <div className="p-4 border-t border-gray-200 flex space-x-2">
              <button
                onClick={resetChat}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                disabled={isRunningTest || isLoading}
              >
                Reset Chat
              </button>
              <button
                onClick={retryLastMessage}
                className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:opacity-50"
                disabled={isRunningTest || isLoading}
              >
                Retry Last Message
              </button>
            </div>
          </div>
          
          {/* Test Logs */}
          <div className="bg-white rounded-lg shadow-md flex-1 flex flex-col overflow-hidden">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-lg font-semibold">Test Logs</h2>
              <button
                onClick={clearTestLogs}
                className="text-sm px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded text-gray-800"
              >
                Clear Logs
              </button>
            </div>
            <div className="flex-1 p-4 overflow-y-auto bg-gray-900 text-gray-100 font-mono text-sm">
              {testLogs.length === 0 ? (
                <div className="text-gray-500">No test logs yet.</div>
              ) : (
                <div className="space-y-1">
                  {testLogs.map((log, index) => (
                    <div key={index} className="whitespace-pre-wrap">{log}</div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Debug State */}
      <div className="bg-gray-800 text-white p-4 overflow-auto max-h-40">
        <h3 className="font-bold mb-2">Debug State</h3>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <h4 className="text-sm font-semibold mb-1">Messages Count</h4>
            <div className="text-xs">
              {messages.length} messages ({messages.filter(m => m.role === 'user').length} user, {messages.filter(m => m.role === 'assistant').length} assistant)
            </div>
          </div>
          <div>
            <h4 className="text-sm font-semibold mb-1">Loading State</h4>
            <div className="text-xs">{isLoading ? 'Loading...' : 'Idle'}</div>
          </div>
          <div>
            <h4 className="text-sm font-semibold mb-1">Suggestions</h4>
            <div className="text-xs">{suggestions.length} available</div>
          </div>
          <div>
            <h4 className="text-sm font-semibold mb-1">Error State</h4>
            <div className="text-xs">{error ? `Error: ${error.message}` : 'No errors'}</div>
          </div>
          <div>
            <h4 className="text-sm font-semibold mb-1">Test Status</h4>
            <div className="text-xs">
              {isRunningTest ? `Running: ${selectedTest}` : 'No test running'}
            </div>
          </div>
          <div>
            <h4 className="text-sm font-semibold mb-1">Local Storage</h4>
            <div className="text-xs">
              {typeof window !== 'undefined' && localStorage.getItem('insurance-chat-history') 
                ? 'Chat history stored' 
                : 'No stored history'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

