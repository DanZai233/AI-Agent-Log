/**
 * Plugin System for Agent Log
 * 
 * Allows importing conversations from various sources
 */

export interface ImportedConversation {
  agent: string;
  user_prompt: string;
  ai_response: string;
  model?: string;
  timestamp?: string;
  repository_url?: string;
  repository_name?: string;
  branch?: string;
  tags?: string[];
  session_id?: string;
  task_type?: string;
  file_path?: string;
  language?: string;
}

export interface ImportResult {
  success: boolean;
  imported: number;
  skipped: number;
  errors: string[];
}

export interface LogPlugin {
  name: string;
  description: string;
  version: string;
  author?: string;
  
  // Import from a file
  canImportFile(filename: string): boolean;
  importFromFile(filePath: string): Promise<ImportedConversation[]>;
  
  // Import from clipboard or text
  canImportText(text: string): boolean;
  importFromText(text: string): Promise<ImportedConversation[]>;
  
  // Parse configuration
  parseConfig?(config: any): void;
}

export interface ExportResult {
  success: boolean;
  exported: number;
  filePath?: string;
  errors: string[];
}

export interface ExportPlugin {
  name: string;
  description: string;
  version: string;
  
  // Export conversations
  export(conversations: ImportedConversation[], options?: any): Promise<ExportResult>;
}

export class PluginManager {
  private importPlugins: Map<string, LogPlugin> = new Map();
  private exportPlugins: Map<string, ExportPlugin> = new Map();
  
  registerImportPlugin(plugin: LogPlugin) {
    this.importPlugins.set(plugin.name, plugin);
    console.log(`[Plugin] Registered import plugin: ${plugin.name} v${plugin.version}`);
  }
  
  registerExportPlugin(plugin: ExportPlugin) {
    this.exportPlugins.set(plugin.name, plugin);
    console.log(`[Plugin] Registered export plugin: ${plugin.name} v${plugin.version}`);
  }
  
  getImportPlugins(): LogPlugin[] {
    return Array.from(this.importPlugins.values());
  }
  
  getExportPlugins(): ExportPlugin[] {
    return Array.from(this.exportPlugins.values());
  }
  
  async importFromFile(filePath: string): Promise<{ plugin: string; result: ImportResult }> {
    const filename = filePath.split('/').pop() || '';
    
    for (const [name, plugin] of this.importPlugins) {
      if (plugin.canImportFile(filename)) {
        const conversations = await plugin.importFromFile(filePath);
        const result = await this.saveConversations(conversations);
        return { plugin: name, result };
      }
    }
    
    throw new Error(`No plugin found for file: ${filename}`);
  }
  
  async importFromText(text: string): Promise<{ plugin: string; result: ImportResult }> {
    for (const [name, plugin] of this.importPlugins) {
      if (plugin.canImportText(text)) {
        const conversations = await plugin.importFromText(text);
        const result = await this.saveConversations(conversations);
        return { plugin: name, result };
      }
    }
    
    throw new Error('No plugin found for the provided text');
  }
  
  private async saveConversations(conversations: ImportedConversation[]): Promise<ImportResult> {
    const apiUrl = process.env.AGENT_LOG_URL || 'http://localhost:3000/api/logs';
    const errors: string[] = [];
    let imported = 0;
    let skipped = 0;
    
    for (const conv of conversations) {
      try {
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(conv),
        });
        
        if (response.ok) {
          imported++;
        } else {
          const error = await response.text();
          errors.push(`Failed to import: ${error}`);
        }
      } catch (error) {
        errors.push(`Network error: ${error}`);
      }
    }
    
    return {
      success: errors.length === 0,
      imported,
      skipped,
      errors,
    };
  }
  
  async exportConversations(pluginName: string, options?: any): Promise<ExportResult> {
    const plugin = this.exportPlugins.get(pluginName);
    if (!plugin) {
      throw new Error(`Export plugin not found: ${pluginName}`);
    }
    
    const apiUrl = (process.env.AGENT_LOG_URL || 'http://localhost:3000/api/logs').replace('/logs', '/logs');
    const response = await fetch(apiUrl);
    const conversations = await response.json();
    
    return plugin.export(conversations, options);
  }
}

const pluginManager = new PluginManager();
export default pluginManager;