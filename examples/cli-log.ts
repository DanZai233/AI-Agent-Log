#!/usr/bin/env node

/**
 * Command-line tool to log AI agent interactions
 * 
 * Usage:
 *   node examples/cli-log.js --agent Cursor --prompt "How do I..."
 *   node examples/cli-log.js --agent Claude --session sess-123 --type refactoring
 */

import { getAgentLog } from '../sdk';
import { createInterface } from 'readline';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const logger = getAgentLog();

interface CLIOptions {
  agent: string;
  prompt?: string;
  response?: string;
  session?: string;
  type?: string;
  repo?: string;
  branch?: string;
  file?: string;
  lang?: string;
  tags?: string;
}

function parseArgs(): CLIOptions {
  const args = process.argv.slice(2);
  const options: Partial<CLIOptions> = {};
  
  for (let i = 0; i < args.length; i += 2) {
    const key = args[i]?.replace(/^--/, '');
    const value = args[i + 1];
    
    switch (key) {
      case 'agent':
        options.agent = value;
        break;
      case 'prompt':
        options.prompt = value;
        break;
      case 'response':
        options.response = value;
        break;
      case 'session':
        options.session = value;
        break;
      case 'type':
        options.type = value;
        break;
      case 'repo':
        options.repo = value;
        break;
      case 'branch':
        options.branch = value;
        break;
      case 'file':
        options.file = value;
        break;
      case 'lang':
        options.lang = value;
        break;
      case 'tags':
        options.tags = value;
        break;
    }
  }
  
  if (!options.agent) {
    throw new Error('Agent is required (--agent <name>)');
  }
  
  return options as CLIOptions;
}

function getRepositoryContext() {
  try {
    // Try to get git context
    const { execSync } = require('child_process');
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
    };
  } catch {
    return {};
  }
}

async function interactiveInput(prompt: string): Promise<string> {
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  
  return new Promise((resolve) => {
    rl.question(prompt, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

async function main() {
  try {
    const options = parseArgs();
    
    console.log(`\n🤖 Logging interaction with ${options.agent}\n`);
    
    // Get prompt if not provided
    let prompt = options.prompt;
    if (!prompt) {
      prompt = await interactiveInput('Enter your prompt: ');
    }
    
    // Get response if not provided
    let response = options.response;
    if (!response) {
      console.log('\nEnter the AI response (Ctrl+D when done):\n');
      response = await interactiveInput('');
    }
    
    // Get repository context
    const gitContext = getRepositoryContext();
    
    // Build log data
    const logData = {
      agent: options.agent,
      user_prompt: prompt,
      ai_response: response,
      timestamp: new Date().toISOString(),
      session_id: options.session,
      task_type: options.type,
      repository_url: options.repo || gitContext.repository_url,
      repository_name: options.repo ? options.repo.split('/').pop() : gitContext.repository_name,
      branch: options.branch || gitContext.branch,
      file_path: options.file,
      language: options.lang,
      tags: options.tags ? options.tags.split(',').map(t => t.trim()) : undefined,
    };
    
    console.log('\n📝 Logging interaction...');
    
    await logger.log(logData);
    
    console.log('✓ Interaction logged successfully!');
    console.log(`  - Agent: ${logData.agent}`);
    console.log(`  - Time: ${logData.timestamp}`);
    console.log(`  - Repository: ${logData.repository_name || 'N/A'}`);
    console.log(`  - Session: ${logData.session_id || 'N/A'}`);
    console.log(`  - Task Type: ${logData.task_type || 'N/A'}`);
    
  } catch (error: any) {
    console.error('✗ Error:', error.message);
    console.log('\nUsage:');
    console.log('  node examples/cli-log.js --agent <name> [--prompt "..."] [--response "..."]');
    console.log('  node examples/cli-log.js --agent Cursor --session sess-123 --type refactoring');
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { main as cliMain };