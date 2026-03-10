/**
 * Example: Integrating Agent Log with Cursor
 * 
 * This example shows how to automatically log Cursor interactions
 */

import { getAgentLog } from '../sdk';

const logger = getAgentLog({
  apiUrl: 'http://localhost:3000/api/logs',
});

// Simulating Cursor's event system
class CursorSimulator {
  private listeners: Array<(event: any) => void> = [];

  on(event: string, callback: (data: any) => void) {
    this.listeners.push(callback);
  }

  emit(event: string, data: any) {
    this.listeners.forEach(callback => callback(data));
  }

  async chat(prompt: string) {
    // Simulate AI response
    const response = await this.mockAIResponse(prompt);
    
    this.emit('response', {
      prompt,
      response,
      timestamp: new Date().toISOString()
    });
    
    return response;
  }

  private async mockAIResponse(prompt: string): Promise<string> {
    return `[Mock Response to: ${prompt}]\n\nHere is the solution you requested...`;
  }
}

async function main() {
  const cursor = new CursorSimulator();
  
  // Get git repository context
  const repoContext = {
    repository_url: 'https://github.com/example/my-project',
    repository_name: 'my-project',
    branch: 'main',
  };

  // Set up session
  logger.startSession('cursor-session-' + Date.now());

  // Log all Cursor interactions
  cursor.on('response', async (data) => {
    await logger.logConversation(
      'Cursor',
      data.prompt,
      data.response,
      {
        ...repoContext,
        task_type: inferTaskType(data.prompt),
        file_path: extractFilePath(data.prompt),
        language: inferLanguage(data.prompt),
        tags: extractTags(data.prompt),
      }
    );
  });

  // Simulate some interactions
  console.log('Simulating Cursor interactions...\n');

  await cursor.chat('How do I implement a user authentication system in Node.js?');
  await new Promise(resolve => setTimeout(resolve, 500));

  await cursor.chat('Refactor this React component to use TypeScript');
  await new Promise(resolve => setTimeout(resolve, 500));

  await cursor.chat('Add unit tests for the user service');
  await new Promise(resolve => setTimeout(resolve, 500));

  console.log('\nAll interactions logged!');
  
  // Search logged interactions
  console.log('\nSearching for "authentication"...');
  const results = await logger.search('authentication');
  console.log(`Found ${results.length} matching logs`);

  // Get statistics
  console.log('\nGetting statistics...');
  const stats = await logger.getStats();
  console.log('Total logs:', stats.totalLogs);
}

function inferTaskType(prompt: string): string {
  const lowerPrompt = prompt.toLowerCase();
  
  if (lowerPrompt.includes('refactor')) return 'refactoring';
  if (lowerPrompt.includes('test') || lowerPrompt.includes('spec')) return 'testing';
  if (lowerPrompt.includes('fix') || lowerPrompt.includes('bug')) return 'bug-fix';
  if (lowerPrompt.includes('implement') || lowerPrompt.includes('add')) return 'feature-implementation';
  if (lowerPrompt.includes('review')) return 'code-review';
  if (lowerPrompt.includes('debug')) return 'debugging';
  if (lowerPrompt.includes('setup') || lowerPrompt.includes('configure')) return 'setup';
  
  return 'general';
}

function extractFilePath(prompt: string): string | undefined {
  const match = prompt.match(/[\w\/]+\.(ts|tsx|js|jsx|py|go|rs|java)/i);
  return match ? match[0] : undefined;
}

function inferLanguage(prompt: string): string | undefined {
  const lowerPrompt = prompt.toLowerCase();
  
  if (lowerPrompt.includes('react') || lowerPrompt.includes('typescript') || lowerPrompt.includes('ts')) return 'typescript';
  if (lowerPrompt.includes('python') || lowerPrompt.includes('py')) return 'python';
  if (lowerPrompt.includes('javascript') || lowerPrompt.includes('js')) return 'javascript';
  if (lowerPrompt.includes('go') || lowerPrompt.includes('golang')) return 'go';
  if (lowerPrompt.includes('rust') || lowerPrompt.includes('rs')) return 'rust';
  if (lowerPrompt.includes('java')) return 'java';
  
  return undefined;
}

function extractTags(prompt: string): string[] {
  const tags: string[] = [];
  const keywords = ['api', 'auth', 'database', 'frontend', 'backend', 'ui', 'testing', 'docker', 'kubernetes'];
  
  const lowerPrompt = prompt.toLowerCase();
  keywords.forEach(keyword => {
    if (lowerPrompt.includes(keyword)) {
      tags.push(keyword);
    }
  });
  
  return tags;
}

// Run the example
if (require.main === module) {
  main().catch(console.error);
}

export { main };