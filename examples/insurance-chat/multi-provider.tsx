import React, { useState, useCallback } from 'react';
import { InsuranceChat } from '~/components/chat/InsuranceChat';
import type { IProviderSetting } from '~/types/model';

/**
 * Example of insurance chat with multiple AI providers
 * 
 * This example demonstrates how to configure the insurance chat
 * to work with multiple AI providers, allowing users to choose
 * which provider to use for their queries.
 */
export default function MultiProviderChat() {
  const [selectedProvider, setSelectedProvider] = useState('OpenAI');
  
  // Available providers
  const providers = [
    { name: 'OpenAI', models: ['gpt-4o', 'gpt-3.5-turbo'] },
    { name: 'Anthropic', models: ['claude-3-opus', 'claude-3-sonnet'] },
    { name: 'Mistral', models: ['mistral-large', 'mistral-medium'] }
  ];
  
  // Provider settings
  const providerSettings: Record<string, IProviderSetting> = {
    'OpenAI': { enabled: true },
    'Anthropic': { enabled: true },
    'Mistral': { enabled: true }
  };
  
  // API keys (in a real app, these would come from environment variables or secure storage)
  const apiKeys = {
    'OpenAI': process.env.OPENAI_API_KEY || '',
    'Anthropic': process.env.ANTHROPIC_API_KEY || '',
    'Mistral': process.env.MISTRAL_API_KEY || ''
  };
  
  // Handle provider selection
  const handleProviderChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedProvider(e.target.value);
  }, []);
  
  // Get the selected provider's configuration
  const getSelectedProviderConfig = useCallback(() => {
    const provider = providers.find(p => p.name === selectedProvider);
    
    if (!provider) {
      return {
        model: 'gpt-3.5-turbo',
        temperature: 0.7,
        maxTokens: 500
      };
    }
    
    return {
      model: provider.models[0],
      temperature: 0.7,
      maxTokens: 500
    };
  }, [selectedProvider, providers]);
  
  // Get current configuration text for display
  const configDetails = getSelectedProviderConfig();
  
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Multi-Provider Insurance Assistant</h1>
      
      {/* Provider Selection */}
      <div className="bg-white p-4 rounded-lg shadow-md mb-4">
        <h2 className="text-lg font-semibold mb-2">Provider Settings</h2>
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <div>
            <label htmlFor="provider-select" className="block text-sm font-medium text-gray-700 mb-1">
              AI Provider
            </label>
            <select
              id="provider-select"
              value={selectedProvider}
              onChange={handleProviderChange}
              className="p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {providers.map(provider => (
                <option key={provider.name} value={provider.name}>
                  {provider.name}
                </option>
              ))}
            </select>
          </div>
          
          <div className="bg-gray-50 p-3 rounded-md">
            <h3 className="text-sm font-medium text-gray-700 mb-1">Current Configuration</h3>
            <ul className="text-sm text-gray-600">
              <li><strong>Provider:</strong> {selectedProvider}</li>
              <li><strong>Model:</strong> {configDetails.model}</li>
              <li><strong>Available Models:</strong> {providers.find(p => p.name === selectedProvider)?.models.join(', ')}</li>
            </ul>
          </div>
        </div>
        
        <div className="mt-3 text-sm text-gray-500">
          <p>The insurance chat will use the selected provider with its default model. API keys are required for each provider.</p>
        </div>
      </div>
      
      {/* Insurance Chat Component */}
      <div className="border rounded-lg shadow-lg overflow-hidden">
        <InsuranceChat
          config={getSelectedProviderConfig()}
          apiKeys={apiKeys}
          providerSettings={providerSettings}
        />
      </div>
    </div>
  );
}

