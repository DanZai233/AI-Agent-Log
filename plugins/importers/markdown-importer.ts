/**
 * Markdown Import Plugin
 * Imports conversations from Markdown files with structured format
 */

import { LogPlugin, ImportedConversation } from '../plugin-system';

function parseMarkdown(content: string, filePath?: string): ImportedConversation[] {
  const conversations: ImportedConversation[] = [];
  
  const lines = content.split('\n');
  let currentConversation: Partial<ImportedConversation> = {};
  let currentRole: string | null = null;
  let currentContent: string[] = [];
  let metadata: any = {};
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Check for metadata (frontmatter)
    if (i === 0 && line.startsWith('---')) {
      const endIdx = lines.indexOf('---', 1);
      if (endIdx > 0) {
        metadata = parseFrontmatter(lines.slice(1, endIdx).join('\n'));
        i = endIdx;
        continue;
      }
    }
    
    // Check for role markers
    const userMatch = line.match(/^(>\s*)?(\*\*)?User(\*\*)?:/i);
    const assistantMatch = line.match(/^(>\s*)?(\*\*)?Assistant(\*\*)?:/i);
    const roleHeader = line.match(/^###\s+(User|Assistant|AI|System):?/i);
    
    if (userMatch || line.startsWith('### User')) {
      if (currentRole === 'assistant' && currentContent.length > 0) {
        if (currentConversation.user_prompt && currentConversation.ai_response) {
          conversations.push({
            agent: currentConversation.agent || metadata.agent || 'Unknown',
            user_prompt: currentConversation.user_prompt,
            ai_response: currentContent.join('\n'),
            model: currentConversation.model || metadata.model,
            timestamp: currentConversation.timestamp || metadata.timestamp,
            repository_url: currentConversation.repository_url || metadata.repository_url,
            repository_name: currentConversation.repository_name || metadata.repository_name,
            branch: currentConversation.branch || metadata.branch,
            tags: currentConversation.tags || metadata.tags,
            session_id: currentConversation.session_id || metadata.session_id,
            task_type: currentConversation.task_type || metadata.task_type,
            file_path: currentConversation.file_path || metadata.file_path,
            language: currentConversation.language || metadata.language,
          });
        }
        currentConversation = { user_prompt: '' };
      }
      
      currentRole = 'user';
      currentContent = [];
      
      if (userMatch) {
        const remainingText = line.replace(userMatch[0], '').trim();
        if (remainingText) {
          if (!currentConversation.user_prompt) {
            currentConversation.user_prompt = remainingText;
          } else {
            currentContent.push(remainingText);
          }
        }
      }
    } else if (assistantMatch || line.startsWith('### Assistant') || line.startsWith('### AI')) {
      currentRole = 'assistant';
      currentContent = [];
      
      if (assistantMatch) {
        const remainingText = line.replace(assistantMatch[0], '').trim();
        if (remainingText) {
          currentConversation.agent = extractAgent(remainingText) || metadata.agent || 'Unknown';
          currentConversation.model = extractModel(remainingText) || metadata.model;
        }
      }
    } else if (currentRole) {
      currentContent.push(line);
    }
  }
  
  // Add last conversation
  if (currentConversation.user_prompt && currentContent.length > 0) {
    conversations.push({
      agent: currentConversation.agent || metadata.agent || 'Unknown',
      user_prompt: currentConversation.user_prompt,
      ai_response: currentContent.join('\n'),
      model: currentConversation.model || metadata.model,
      timestamp: currentConversation.timestamp || metadata.timestamp,
      repository_url: currentConversation.repository_url || metadata.repository_url,
      repository_name: currentConversation.repository_name || metadata.repository_name,
      branch: currentConversation.branch || metadata.branch,
      tags: currentConversation.tags || metadata.tags,
      session_id: currentConversation.session_id || metadata.session_id,
      task_type: currentConversation.task_type || metadata.task_type,
      file_path: currentConversation.file_path || metadata.file_path,
      language: currentConversation.language || metadata.language,
    });
  }
  
  return conversations;
}

function parseFrontmatter(content: string): any {
  const metadata: any = {};
  const lines = content.split('\n');
  
  for (const line of lines) {
    const match = line.match(/^(\w+):\s*(.+)$/);
    if (match) {
      const [, key, value] = match;
      
      // Parse values
      if (key === 'tags') {
        metadata[key] = value.split(',').map(t => t.trim());
      } else {
        metadata[key] = value;
      }
    }
  }
  
  return metadata;
}

function extractAgent(text: string): string | undefined {
  const match = text.match(/\((Cursor|Claude|GPT|ChatGPT|AI|Assistant)\)/i);
  return match ? match[1] : undefined;
}

function extractModel(text: string): string | undefined {
  const match = text.match(/\[(gpt-4|gpt-3.5|claude-3|claude-2|gemini|llama)\S*\]/i);
  return match ? match[1] : undefined;
}

export const MarkdownImportPlugin: LogPlugin = {
  name: 'markdown-import',
  description: 'Import conversations from Markdown files',
  version: '1.0.0',
  author: 'Agent Log',
  
  canImportFile(filename: string): boolean {
    return filename.endsWith('.md') || filename.endsWith('.markdown');
  },
  
  canImportText(text: string): boolean {
    return text.includes('**User:**') || 
           text.includes('**Assistant:**') ||
           text.includes('> User:') ||
           text.includes('> Assistant:') ||
           text.includes('### User') ||
           text.includes('### Assistant');
  },
  
  async importFromFile(filePath: string): Promise<ImportedConversation[]> {
    const fs = await import('fs/promises');
    const content = await fs.readFile(filePath, 'utf-8');
    return parseMarkdown(content, filePath);
  },
  
  async importFromText(text: string): Promise<ImportedConversation[]> {
    return parseMarkdown(text);
  },
};

export default MarkdownImportPlugin;