/**
 * JSON Import Plugin
 * Supports importing conversations from JSON files
 */

import { LogPlugin, ImportedConversation } from '../plugin-system';

function parseJSON(content: string): ImportedConversation[] {
  try {
    const data = JSON.parse(content);
    
    if (Array.isArray(data)) {
      return data.map((item, index) => normalizeConversation(item, index));
    } else if (data.conversations && Array.isArray(data.conversations)) {
      return data.conversations.map((item: any, index: number) => normalizeConversation(item, index));
    } else if (data.messages && Array.isArray(data.messages)) {
      return fromMessages(data);
    } else {
      return [normalizeConversation(data, 0)];
    }
  } catch (error) {
    throw new Error(`Failed to parse JSON: ${error}`);
  }
}

function normalizeConversation(data: any, index: number): ImportedConversation {
  const result: ImportedConversation = {
    agent: data.agent || data.assistant || 'Unknown',
    user_prompt: data.user_prompt || data.prompt || data.question || data.user || '',
    ai_response: data.ai_response || data.response || data.answer || data.assistant || data.content || '',
  };
  
  if (data.model) result.model = data.model;
  if (data.timestamp) result.timestamp = data.timestamp;
  if (data.repository_url) result.repository_url = data.repository_url;
  if (data.repository_name) result.repository_name = data.repository_name;
  if (data.branch) result.branch = data.branch;
  if (data.tags) result.tags = Array.isArray(data.tags) ? data.tags : [data.tags];
  if (data.session_id) result.session_id = data.session_id;
  if (data.task_type) result.task_type = data.task_type;
  if (data.file_path) result.file_path = data.file_path;
  if (data.language) result.language = data.language;
  
  return result;
}

function fromMessages(data: any): ImportedConversation[] {
  const conversations: ImportedConversation[] = [];
  let currentPrompt = '';
  let currentAssistant = '';
  let lastUserIndex = -1;
  
  for (let i = 0; i < data.messages.length; i++) {
    const msg = data.messages[i];
    
    if (msg.role === 'user') {
      if (currentPrompt && currentAssistant) {
        conversations.push({
          agent: data.model || data.agent || 'Unknown',
          user_prompt: currentPrompt,
          ai_response: currentAssistant,
          timestamp: data.timestamp,
        });
      }
      currentPrompt = msg.content || msg.text || '';
      lastUserIndex = i;
    } else if (msg.role === 'assistant' && lastUserIndex >= 0) {
      currentAssistant = msg.content || msg.text || '';
    }
  }
  
  if (currentPrompt && currentAssistant) {
    conversations.push({
      agent: data.model || data.agent || 'Unknown',
      user_prompt: currentPrompt,
      ai_response: currentAssistant,
      timestamp: data.timestamp,
    });
  }
  
  return conversations;
}

export const JSONImportPlugin: LogPlugin = {
  name: 'json-import',
  description: 'Import conversations from JSON files',
  version: '1.0.0',
  author: 'Agent Log',
  
  canImportFile(filename: string): boolean {
    return filename.endsWith('.json');
  },
  
  canImportText(text: string): boolean {
    try {
      JSON.parse(text);
      return true;
    } catch {
      return false;
    }
  },
  
  async importFromFile(filePath: string): Promise<ImportedConversation[]> {
    const fs = await import('fs/promises');
    const content = await fs.readFile(filePath, 'utf-8');
    return parseJSON(content);
  },
  
  async importFromText(text: string): Promise<ImportedConversation[]> {
    return parseJSON(text);
  },
};

export default JSONImportPlugin;