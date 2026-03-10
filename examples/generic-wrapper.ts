/**
 * Example: Generic Agent Wrapper
 * 
 * This example shows how to wrap any AI agent interaction
 * to automatically log to the Agent Log system.
 */

import { getAgentLog } from '../sdk';
import { execSync } from 'child_process';
import { randomUUID } from 'crypto';

interface AIInteraction {
  agent: string;
  prompt: string;
  response: string;
}

const logger = getAgentLog({
  apiUrl: 'http://localhost:3000/api/logs',
  autoCollect: true,
});

/**
 * Wrap any AI interaction with automatic logging
 */
export async function withLogging<T>(
  agentName: string,
  prompt: string,
  execute: () => Promise<T>,
  options?: {
    repository_url?: string;
    repository_name?: string;
    branch?: string;
    task_type?: string;
    file_path?: string;
    language?: string;
    tags?: string[];
    session_id?: string;
  }
): Promise<T> {
  // Get git context if not provided
  const gitContext = getGitContext();
  
  const response = await execute();
  
  // Log the interaction
  await logger.logConversation(
    agentName,
    prompt,
    String(response),
    {
      ...gitContext,
      ...options,
    }
  );
  
  return response;
}

/**
 * Get repository context from git
 */
function getGitContext() {
  try {
    const remoteUrl = execSync('git remote get-url origin', { encoding: 'utf-8' }).trim();
    const repoName = execSync('git rev-parse --show-toplevel', { encoding: 'utf-8' })
      .trim()
      .split('/')
      .pop();
    const branch = execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf-8' }).trim();
    
    return {
      repository_url: remoteUrl,
      repository_name: repoName,
      branch: branch,
    } as Record<string, any>;
  } catch (error) {
    return {} as Record<string, any>;
  }
}

/**
 * Create a session for related interactions
 */
export class AgentSession {
  private sessionId: string;
  
  constructor(name?: string) {
    this.sessionId = name || randomUUID();
    logger.startSession(this.sessionId);
  }
  
  async interact(
    agentName: string,
    prompt: string,
    execute: () => Promise<any>,
    options?: Parameters<typeof withLogging>[3]
  ) {
    return withLogging(agentName, prompt, execute, {
      ...options,
      session_id: this.sessionId,
    } as any);
  }
  
  end() {
    logger.endSession();
  }
}

/**
 * Example: Using with a mock AI client
 */
class MockAIClient {
  constructor(private name: string) {}
  
  async chat(prompt: string): Promise<string> {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 100));
    return `[${this.name} Response] I analyzed your request: "${prompt}"`;
  }
}

// Example usage
async function example1() {
  console.log('Example 1: Basic interaction with logging\n');
  
  const ai = new MockAIClient('GPT-4');
  
  const response = await withLogging(
    'ChatGPT',
    'Explain React hooks',
    () => ai.chat('Explain React hooks'),
    {
      task_type: 'explanation',
      tags: ['react', 'hooks'],
    }
  );
  
  console.log('Response:', response);
}

async function example2() {
  console.log('\nExample 2: Session-based logging\n');
  
  const ai = new MockAIClient('Claude');
  const session = new AgentSession('feature-development');
  
  // Related interactions in a session
  await session.interact(
    'Claude',
    'Create a user authentication API',
    () => ai.chat('Create a user authentication API'),
    {
      task_type: 'feature-implementation',
      file_path: 'src/api/auth.ts',
      language: 'typescript',
    }
  );
  
  await session.interact(
    'Claude',
    'Add unit tests for the auth API',
    () => ai.chat('Add unit tests for the auth API'),
    {
      task_type: 'testing',
      file_path: 'src/api/auth.test.ts',
      language: 'typescript',
      tags: ['testing', 'jest'],
    }
  );
  
  await session.interact(
    'Claude',
    'Update the documentation',
    () => ai.chat('Update the documentation'),
    {
      task_type: 'documentation',
      file_path: 'docs/api-auth.md',
      language: 'markdown',
    }
  );
  
  session.end();
  console.log('Session completed');
}

async function example3() {
  console.log('\nExample 3: Searching logged interactions\n');
  
  const results = await logger.search('authentication', {
    task_type: 'feature-implementation',
  });
  
  console.log(`Found ${results.length} results about authentication feature implementation`);
  
  if (results.length > 0) {
    console.log('\nFirst result:');
    console.log('Agent:', results[0].agent);
    console.log('Prompt:', results[0].user_prompt);
  }
}

async function example4() {
  console.log('\nExample 4: Getting statistics\n');
  
  const stats = await logger.getStats();
  
  console.log('Total interactions:', stats.totalLogs);
  console.log('\nBy agent:');
  stats.byAgent.forEach((item: any) => {
    console.log(`  ${item.agent}: ${item.count}`);
  });
  
  console.log('\nBy task type:');
  stats.byTaskType.forEach((item: any) => {
    console.log(`  ${item.task_type}: ${item.count}`);
  });
}

// Run all examples
async function runAllExamples() {
  try {
    await example1();
    await new Promise(resolve => setTimeout(resolve, 500));
    await example2();
    await new Promise(resolve => setTimeout(resolve, 500));
    await example3();
    await example4();
    
    console.log('\n✓ All examples completed');
  } catch (error) {
    console.error('Error:', error);
  }
}

// Run if executed directly
if (require.main === module) {
  runAllExamples();
}

export { example1, example2, example3, example4, runAllExamples };