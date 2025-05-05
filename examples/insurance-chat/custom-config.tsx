import React from 'react';
import { InsuranceChat } from '~/components/chat/InsuranceChat';
import { toast } from 'react-toastify';

/**
 * Example of insurance chat with custom configuration
 * 
 * This example shows how to customize the insurance chat with different
 * model settings, temperatures, and error handling.
 */
export default function CustomConfigChat() {
  // Define the custom configuration
  const insuranceConfig = {
    model: 'gpt-4o',        // Use a specific model
    temperature: 0.5,       // Lower temperature for more focused responses
    maxTokens: 1000,        // Allow longer responses
    useAI: true             // Ensure AI is used even if disabled globally
  };
  
  // Custom error handler
  const handleError = (error: Error) => {
    console.error('Insurance chat error:', error);
    toast.error(`Error: ${error.message}`, {
      position: 'bottom-right',
      autoClose: 5000
    });
  };
  
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Advanced Insurance Assistant</h1>
      <div className="bg-yellow-50 p-4 rounded-lg mb-4">
        <h2 className="text-lg font-semibold">Custom Configuration</h2>
        <ul className="list-disc pl-5 mt-2">
          <li>Model: {insuranceConfig.model}</li>
          <li>Temperature: {insuranceConfig.temperature}</li>
          <li>Max Tokens: {insuranceConfig.maxTokens}</li>
        </ul>
      </div>
      
      {/* Pass custom configuration and error handler to the component */}
      <InsuranceChat 
        className="border rounded-lg shadow-lg" 
        config={insuranceConfig}
        onError={handleError}
      />
    </div>
  );
}

