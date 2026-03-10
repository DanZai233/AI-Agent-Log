/**
 * Cursor History Import Plugin
 * Imports conversations from Cursor's conversation history files
 */

import { LogPlugin, ImportedConversation } from '../plugin-system';
import * as path from 'path';

function parseJSON(content: string): ImportedConversation[] {
  const data = JSON.parse(content);
  const conversations: ImportedConversation[] = [];
  
  const messages = data.messages || data;
  
  if (!Array.isArray(messages)) {
    throw new Error('Invalid Cursor format: messages not found');
  }
  
  let currentPrompt = '';
  let currentResponse = '';
  let lastRole: string = '';
  let metadata: any = {};
  
  for (const msg of messages) {
    const role = msg.role || msg.type;
    const content = msg.content || msg.text || '';
    
    if (role === 'user' || role === 'human') {
      if (currentPrompt && currentResponse) {
        conversations.push(createConversation(currentPrompt, currentResponse, metadata));
      }
      currentPrompt = content;
      currentResponse = '';
      metadata = extractMetadata(msg, data);
    } else if (role === 'assistant' || role === 'ai') {
      currentResponse += content;
    }
    
    lastRole = role;
  }
  
  if (currentPrompt && currentResponse) {
    conversations.push(createConversation(currentPrompt, currentResponse, metadata));
  }
  
  return conversations;
}

function parseJSONL(content: string): ImportedConversation[] {
  const lines = content.trim().split('\n');
  const conversations: ImportedConversation[] = [];
  
  for (const line of lines) {
    try {
      const data = JSON.parse(line);
      const convs = parseJSON(JSON.stringify(data));
      conversations.push(...convs);
    } catch (error) {
      console.warn(`Failed to parse line: ${error}`);
    }
  }
  
  return conversations;
}

function createConversation(prompt: string, response: string, metadata: any): ImportedConversation {
  const conv: ImportedConversation = {
    agent: 'Cursor',
    user_prompt: prompt,
    ai_response: response,
  };
  
  if (metadata.model) conv.model = metadata.model;
  if (metadata.timestamp) conv.timestamp = metadata.timestamp;
  if (metadata.repository) {
    conv.repository_url = metadata.repository.url;
    conv.repository_name = metadata.repository.name;
    conv.branch = metadata.repository.branch;
  }
  if (metadata.tags) conv.tags = metadata.tags;
  if (metadata.session_id) conv.session_id = metadata.session_id;
  if (metadata.task_type) conv.task_type = metadata.task_type;
  if (metadata.file_path) conv.file_path = metadata.file_path;
  if (metadata.language) conv.language = metadata.language;
  
  return conv;
}

function extractMetadata(msg: any, data: any): any {
  const metadata: any = {};
  
  if (data.model) metadata.model = data.model;
  if (msg.model) metadata.model = msg.model;
  
  if (data.timestamp) metadata.timestamp = data.timestamp;
  if (msg.timestamp) metadata.timestamp = msg.timestamp;
  
  if (data.repository) {
    metadata.repository = {
      url: data.repository.url || data.repository.remote,
      name: data.repository.name,
      branch: data.repository.branch || data.repository.currentBranch,
    };
  }
  
  if (data.workspace || data.project) {
    metadata.repository = {
      ...metadata.repository,
      name: data.workspace?.name || data.project?.name || metadata.repository?.name,
    };
  }
  
  if (data.tags) metadata.tags = data.tags;
  if (msg.tags) metadata.tags = msg.tags;
  
  if (data.session_id) metadata.session_id = data.session_id;
  if (data.conversation_id) metadata.session_id = data.conversation_id;
  
  return metadata;
}

export const CursorHistoryPlugin: LogPlugin = {
  name: 'cursor-history',
  description: 'Import conversations from Cursor history files',
  version: '1.0.0',
  author: 'Agent Log',
  
  canImportFile(filename: string): boolean {
    const lowerName = filename.toLowerCase();
    return lowerName.includes('cursor') && (lowerName.endsWith('.json') || lowerName.endsWith('.jsonl'));
  },
  
  canImportText(text: string): boolean {
    try {
      const data = JSON.parse(text);
      return data.messages && Array.isArray(data.messages) ||
             Array.isArray(data) && data[0]?.messages;
    } catch {
      return false;
    }
  },
  
  async importFromFile(filePath: string): Promise<ImportedConversation[]> {
    const fs = await import('fs/promises');
    const content = await fs.readFile(filePath, 'utf-8');
    
    if (filePath.endsWith('.jsonl')) {
      return parseJSONL(content);
    } else {
      return parseJSON(content);
    }
  },
  
  async importFromText(text: string): Promise<ImportedConversation[]> {
    const lines = text.trim().split('\n');
    
    if (lines.length === 1) {
      return parseJSON(text);
    } else {
      return parseJSONL(text);
    }
  },
};

export default CursorHistoryPlugin;