/**
 * Auto-detect and import conversations from popular AI coding tools
 */

import * as os from 'os';
import * as path from 'path';
import * as fs from 'fs/promises';

interface ToolInfo {
  name: string;
  displayName: string;
  configPaths: string[];
  dbPaths: string[];
  detect?: () => Promise<boolean>;
}

export class AutoImporter {
  private tools: ToolInfo[] = [
    {
      name: 'cursor',
      displayName: 'Cursor',
      configPaths: [
        path.join(os.homedir(), 'Library/Application Support/Cursor/User/GlobalStorage/storage.json'),
        path.join(os.homedir(), '.config/Cursor/User/GlobalStorage/storage.json'),
        path.join(process.env.APPDATA || '', 'Cursor/User/GlobalStorage/storage.json'),
      ],
      dbPaths: [
        path.join(os.homedir(), 'Library/Application Support/Cursor/User/GlobalStorage/state.vscdb'),
        path.join(os.homedir(), '.config/Cursor/User/GlobalStorage/state.vscdb'),
        path.join(process.env.APPDATA || '', 'Cursor/User/GlobalStorage/state.vscdb'),
      ],
    },
    {
      name: 'claude-code',
      displayName: 'ClaudeCode / Claude Desktop',
      configPaths: [
        path.join(os.homedir(), 'Library/Application Support/Claude/claude_desktop_config.json'),
        path.join(os.homedir(), '.config/Claude/claude_desktop_config.json'),
        path.join(process.env.APPDATA || '', 'Claude/claude_desktop_config.json'),
      ],
      dbPaths: [
        path.join(os.homedir(), 'Library/Application Support/Claude/Local Storage/leveldb'),
        path.join(os.homedir(), '.config/Claude/Local Storage/leveldb'),
        path.join(process.env.APPDATA || '', 'Claude/Local Storage/leveldb'),
      ],
    },
    {
      name: 'opencode',
      displayName: 'OpenCode',
      configPaths: [
        path.join(os.homedir(), 'Library/Application Support/OpenCode/User/settings.json'),
        path.join(os.homedir(), '.config/OpenCode/User/settings.json'),
        path.join(process.env.APPDATA || '', 'OpenCode/User/settings.json'),
      ],
      dbPaths: [],
    },
    {
      name: 'vscode-copilot',
      displayName: 'VS Code Copilot',
      configPaths: [
        path.join(os.homedir(), 'Library/Application Support/Code/User/globalStorage/storage.json'),
        path.join(os.homedir(), '.config/Code/User/globalStorage/storage.json'),
        path.join(process.env.APPDATA || '', 'Code/User/globalStorage/storage.json'),
      ],
      dbPaths: [],
    },
  ];

  /**
   * Scan for all installed AI coding tools
   */
  async scanInstalledTools(): Promise<ToolInfo[]> {
    const installed: ToolInfo[] = [];

    for (const tool of this.tools) {
      if (await this.isToolInstalled(tool)) {
        installed.push(tool);
      }
    }

    return installed;
  }

  /**
   * Check if a specific tool is installed
   */
  private async isToolInstalled(tool: ToolInfo): Promise<boolean> {
    for (const configPath of tool.configPaths) {
      try {
        await fs.access(configPath);
        return true;
      } catch {
        continue;
      }
    }

    for (const dbPath of tool.dbPaths) {
      try {
        await fs.access(dbPath);
        return true;
      } catch {
        continue;
      }
    }

    return false;
  }

  /**
   * Get the data path for a specific tool
   */
  async getToolDataPath(toolName: string): Promise<string | null> {
    const tool = this.tools.find(t => t.name === toolName);
    if (!tool) return null;

    // Check config paths
    for (const configPath of tool.configPaths) {
      try {
        await fs.access(configPath);
        return configPath;
      } catch {
        continue;
      }
    }

    // Check db paths
    for (const dbPath of tool.dbPaths) {
      try {
        await fs.access(dbPath);
        return dbPath;
      } catch {
        continue;
      }
    }

    return null;
  }

  /**
   * Import conversations from a specific tool
   */
  async importFromTool(toolName: string): Promise<{
    success: boolean;
    tool: string;
    imported: number;
    errors: string[];
  }> {
    const tool = this.tools.find(t => t.name === toolName);
    if (!tool) {
      throw new Error(`Unknown tool: ${toolName}`);
    }

    console.log(`\n🔍 Scanning ${tool.displayName}...`);

    const dataPath = await this.getToolDataPath(toolName);
    if (!dataPath) {
      throw new Error(`${tool.displayName} not found or no data available`);
    }

    console.log(`📁 Found data at: ${dataPath}`);

    try {
      let conversations = [];

      if (toolName === 'cursor') {
        conversations = await this.importCursor(dataPath);
      } else if (toolName === 'claude-code') {
        conversations = await this.importClaude(dataPath);
      } else if (toolName === 'opencode') {
        conversations = await this.importOpenCode(dataPath);
      } else if (toolName === 'vscode-copilot') {
        conversations = await this.importCopilot(dataPath);
      }

      console.log(`✅ Found ${conversations.length} conversations`);

      // Send to server
      const { imported, errors } = await this.sendToServer(conversations, toolName);

      return {
        success: errors.length === 0,
        tool: tool.displayName,
        imported,
        errors,
      };
    } catch (error: any) {
      console.error(`❌ Failed to import: ${error.message}`);
      return {
        success: false,
        tool: tool.displayName,
        imported: 0,
        errors: [error.message],
      };
    }
  }

  /**
   * Import from Cursor's SQLite database
   */
  private async importCursor(dataPath: string): Promise<any[]> {
    // Cursor stores data in SQLite (VSCode format)
    try {
      const Database = (await import('better-sqlite3')).default;
      const db = new Database(dataPath);

      // Cursor's conversation table structure
      const conversations = db.prepare(`
        SELECT 
          json_extract(data, '$.messages') as messages,
          json_extract(data, '$.model') as model,
          timestamp as created_at
        FROM ItemTable 
        WHERE type = 'chat'
        ORDER BY timestamp DESC
        LIMIT 500
      `).all();

      const formatted = [];

      for (const conv of conversations) {
        try {
          const messages = JSON.parse(conv.messages || '[]');
          const conversation = this.parseMessages(messages, 'Cursor', conv.model, conv.created_at);
          if (conversation) {
            formatted.push(conversation);
          }
        } catch (error) {
          console.warn('Failed to parse conversation:', error);
        }
      }

      db.close();
      return formatted;
    } catch (error) {
      console.warn('Could not read Cursor database, trying JSON format...');
      // Fallback to JSON
      return this.importJSON(dataPath);
    }
  }

  /**
   * Import from Claude Desktop
   */
  private async importClaude(dataPath: string): Promise<any[]> {
    try {
      const content = await fs.readFile(dataPath, 'utf-8');
      const data = JSON.parse(content);

      // Claude stores conversations in config.json
      const conversations = [];

      if (data.conversations) {
        for (const conv of data.conversations) {
          const messages = conv.messages || [];
          const formatted = this.parseMessages(messages, 'ClaudeCode', conv.model, conv.created_at);
          if (formatted) {
            formatted.task_type = 'general';
            formatted.tags = this.extractTags(messages);
            conversations.push(formatted);
          }
        }
      }

      return conversations.slice(0, 500);
    } catch (error) {
      console.warn('Could not read Claude data');
      return [];
    }
  }

  /**
   * Import from OpenCode
   */
  private async importOpenCode(dataPath: string): Promise<any[]> {
    try {
      const content = await fs.readFile(dataPath, 'utf-8');
      const data = JSON.parse(content);

      const conversations = [];

      if (data.history) {
        for (const conv of data.history) {
          const messages = conv.messages || [];
          const formatted = this.parseMessages(messages, 'OpenCode', conv.model, conv.timestamp);
          if (formatted) {
            formatted.task_type = 'general';
            conversations.push(formatted);
          }
        }
      }

      return conversations.slice(0, 500);
    } catch (error) {
      console.warn('Could not read OpenCode data');
      return [];
    }
  }

  /**
   * Import from VS Code Copilot
   */
  private async importCopilot(dataPath: string): Promise<any[]> {
    try {
      const content = await fs.readFile(dataPath, 'utf-8');
      const data = JSON.parse(content);

      const conversations = [];

      if (data.telemetryLog || data.sessions) {
        const sessions = data.telemetryLog || data.sessions || [];

        for (const session of sessions) {
          if (session.request && session.response) {
            conversations.push({
              agent: 'Copilot',
              model: session.model || 'unknown',
              user_prompt: session.request,
              ai_response: session.response,
              timestamp: session.timestamp || new Date().toISOString(),
              task_type: 'code-completion',
              file_path: session.fileName,
              language: session.language,
            });
          }
        }
      }

      return conversations.slice(0, 500);
    } catch (error) {
      console.warn('Could not read Copilot data');
      return [];
    }
  }

  /**
   * Generic JSON importer fallback
   */
  private async importJSON(filePath: string): Promise<any[]> {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const data = JSON.parse(content);

      if (Array.isArray(data)) {
        return data.map(item => ({
          agent: 'Unknown',
          model: item.model,
          user_prompt: item.prompt || item.user_prompt || item.question,
          ai_response: item.response || item.ai_response || item.answer,
          timestamp: item.timestamp || new Date().toISOString(),
        }));
      }

      return [];
    } catch (error) {
      console.warn('Could not parse JSON');
      return [];
    }
  }

  /**
   * Parse messages array into conversation format
   */
  private parseMessages(messages: any[], agent: string, model: string, timestamp: string): any | null {
    if (!Array.isArray(messages) || messages.length < 2) {
      return null;
    }

    let userPrompt = '';
    let aiResponse = '';

    for (const msg of messages) {
      const role = msg.role || msg.type;

      if (role === 'user' || role === 'human') {
        userPrompt = msg.content || msg.text || '';
      } else if (role === 'assistant' || role === 'ai') {
        aiResponse += (msg.content || msg.text || '') + '\n';
      }
    }

    if (!userPrompt || !aiResponse) {
      return null;
    }

    return {
      agent,
      model: model || 'unknown',
      user_prompt: userPrompt,
      ai_response: aiResponse.trim(),
      timestamp: timestamp || new Date().toISOString(),
    };
  }

  /**
   * Extract tags from messages
   */
  private extractTags(messages: any[]): string[] {
    const tags = new Set<string>();
    const keywords = ['bug', 'fix', 'feature', 'api', 'database', 'frontend', 'backend', 'test', 'debug', 'refactor'];

    for (const msg of messages) {
      const content = (msg.content || msg.text || '').toLowerCase();
      keywords.forEach(keyword => {
        if (content.includes(keyword)) {
          tags.add(keyword);
        }
      });
    }

    return Array.from(tags);
  }

  /**
   * Send conversations to Agent Log server
   */
  private async sendToServer(conversations: any[], source: string): Promise<{
    imported: number;
    errors: string[];
  }> {
    const apiUrl = process.env.AGENT_LOG_URL || 'http://localhost:3000/api/logs';

    let imported = 0;
    const errors: string[] = [];

    console.log(`\n📤 Sending ${conversations.length} conversations to server...`);

    for (let i = 0; i < conversations.length; i++) {
      const conv = conversations[i];

      try {
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(conv),
        });

        if (response.ok) {
          imported++;
          if ((i + 1) % 50 === 0) {
            console.log(`   Progress: ${i + 1}/${conversations.length}`);
          }
        } else {
          const error = await response.text();
          errors.push(`#${i + 1}: ${error}`);
        }
      } catch (error: any) {
        errors.push(`#${i + 1}: ${error.message}`);
      }
    }

    console.log(`✅ Imported ${imported}/${conversations.length} conversations`);

    if (errors.length > 0 && errors.length <= 5) {
      console.log(`\n⚠️  Errors:`);
      errors.slice(0, 5).forEach(err => console.log(`   ${err}`));
    }

    return { imported, errors };
  }
}

export default AutoImporter;