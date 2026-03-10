# Agent Log SDK

Automatically collect and track your AI agent interactions with rich metadata.

## Installation

```bash
npm install --save-dev agent-log-sdk
```

Or copy the SDK directly into your project.

## Quick Start

```typescript
import { getAgentLog } from './sdk';

const logger = getAgentLog({
  apiUrl: 'http://localhost:3000/api/logs',
});

await logger.logConversation(
  'Cursor',
  'How do I implement a REST API?',
  'Here is a REST API implementation using Express...',
  {
    repository_url: 'https://github.com/user/project',
    repository_name: 'my-project',
    branch: 'main',
    task_type: 'feature-implementation',
    file_path: 'src/api/index.ts',
    language: 'typescript',
    tags: ['api', 'express', 'rest']
  }
);
```

## Configuration

```typescript
const logger = new AgentLog({
  apiUrl: 'http://localhost:3000/api/logs', // Default
  apiKey: 'your-api-key', // Optional
  autoCollect: true, // Default: true
});
```

## Features

### Automatic Session Tracking

```typescript
logger.startSession('session-123');

// All logs will be associated with this session
await logger.logConversation('Cursor', 'Help me with X', 'Here is the solution...');

// End the session
logger.endSession();
```

### Git Repository Context

```typescript
const repoContext = AgentLog.fromGitRepo(
  'https://github.com/user/project',
  'my-project'
);

await logger.logConversation(
  'ClaudeCode',
  'Refactor this component',
  'Here is the refactored code...',
  {
    ...repoContext,
    branch: 'feature/auth',
    file_path: 'src/components/Auth.tsx',
    language: 'typescript',
    task_type: 'refactoring'
  }
);
```

### Search Logs

```typescript
const results = await logger.search('docker setup', {
  repository: 'api-server',
  task_type: 'setup'
});

console.log(results);
```

### Get Statistics

```typescript
const stats = await logger.getStats();
console.log(stats);
// {
//   totalLogs: 100,
//   byAgent: [...],
//   byRepository: [...],
//   byTaskType: [...]
// }
```

## Environment Variables

```bash
AGENT_LOG_URL=http://localhost:3000/api/logs
AGENT_LOG_API_KEY=your-api-key
```

## Use Cases

### Cursor Agent Integration

```typescript
import { cursor } from '@cursor/sdk';

const logger = getAgentLog();

cursor.on('response', async (prompt, response) => {
  await logger.logConversation(
    'Cursor',
    prompt,
    response,
    AgentLog.fromGitRepo(process.cwd())
  );
});
```

### OpenCode/ClaudeCode Integration

```typescript
import { getAgentLog } from './sdk';

const logger = getAgentLog();
const repoContext = AgentLog.fromGitRepo(
  execSync('git remote get-url origin').toString().trim()
);

async function wrapAIInteraction(
  agent: string,
  prompt: string,
  execute: () => Promise<string>
) {
  const response = await execute();
  
  await logger.logConversation(
    agent,
    prompt,
    response,
    {
      ...repoContext,
      timestamp: new Date().toISOString(),
      session_id: process.env.SESSION_ID,
    }
  );
  
  return response;
}
```

### Custom CLI Wrapper

```typescript
#!/usr/bin/env node

const logger = getAgentLog();

process.stdin.on('data', async (data) => {
  const input = data.toString();
  
  const response = await callAIAPI(input);
  
  await logger.logConversation(
    'CustomAgent',
    input,
    response,
    {
      task_type: determineTaskType(input),
      language: detectLanguage(input)
    }
  );
  
  console.log(response);
});
```