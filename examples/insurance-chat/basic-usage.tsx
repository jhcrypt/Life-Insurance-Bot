import React from 'react';
import { InsuranceChat } from '~/components/chat/InsuranceChat';

/**
 * Basic Insurance Chat Example
 * 
 * This example demonstrates the simplest way to implement the insurance chat component.
 * It uses all default settings and requires minimal configuration.
 */
export default function BasicInsuranceChat() {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Insurance Assistant</h1>
      <p className="text-gray-600 mb-6">
        Ask any questions about life and health insurance policies, coverage options, and more.
      </p>
      
      {/* The most basic implementation only requires rendering the component */}
      <div className="border rounded-lg shadow-lg overflow-hidden">
        <InsuranceChat />
      </div>
      
      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h2 className="text-lg font-semibold mb-2">Usage Tips</h2>
        <ul className="list-disc pl-5 space-y-1 text-gray-700">
          <li>Click on suggested topics to quickly get information about common insurance topics</li>
          <li>Use follow-up suggestions that appear after each response</li>
          <li>Ask specific questions about policy types, coverage amounts, or health considerations</li>
          <li>Try phrases like "Tell me about term life insurance" or "How much coverage do I need?"</li>
        </ul>
      </div>
      
      <div className="mt-4 text-sm text-gray-500">
        <p>
          This example uses the default configuration. The chat automatically connects to the
          configured AI provider and uses the insurance knowledge base to enhance responses.
        </p>
      </div>
    </div>
  );
}

