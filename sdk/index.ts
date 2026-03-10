export interface LogOptions {
  agent: string;
  user_prompt: string;
  ai_response: string;
  model?: string;
  repository_url?: string;
  repository_name?: string;
  branch?: string;
  tags?: string[];
  session_id?: string;
  task_type?: string;
  file_path?: string;
  language?: string;
  timestamp?: string;
}

export interface AgentLogConfig {
  apiUrl?: string;
  apiKey?: string;
  autoCollect?: boolean;
}

export class AgentLog {
  private config: Required<AgentLogConfig>;
  private currentSessionId?: string;
  private pendingLogs: LogOptions[] = [];
  
  constructor(config: AgentLogConfig = {}) {
    this.config = {
      apiUrl: config.apiUrl || process.env.AGENT_LOG_URL || 'http://localhost:3000/api/logs',
      apiKey: config.apiKey || process.env.AGENT_LOG_API_KEY || '',
      autoCollect: config.autoCollect ?? true,
    };
    
    if (this.config.autoCollect) {
      this.setupAutoCollect();
    }
  }

  private setupAutoCollect() {
    process.on('exit', () => this.flushPendingLogs());
    process.on('SIGINT', () => {
      this.flushPendingLogs();
      process.exit(0);
    });
    process.on('SIGTERM', () => {
      this.flushPendingLogs();
      process.exit(0);
    });
  }

  startSession(sessionId: string) {
    this.currentSessionId = sessionId;
  }

  endSession() {
    this.currentSessionId = undefined;
  }

  async log(options: LogOptions): Promise<void> {
    const logData: LogOptions = {
      ...options,
      timestamp: options.timestamp || new Date().toISOString(),
      session_id: options.session_id || this.currentSessionId,
    };

    if (this.config.autoCollect) {
      this.pendingLogs.push(logData);
      await this.flushPendingLogs();
    }
  }

  async logConversation(
    agent: string,
    prompt: string,
    response: string,
    additionalData?: Partial<LogOptions>
  ): Promise<void> {
    await this.log({
      agent,
      user_prompt: prompt,
      ai_response: response,
      ...additionalData,
    });
  }

  async flushPendingLogs(): Promise<void> {
    if (this.pendingLogs.length === 0) return;

    const logsToSend = [...this.pendingLogs];
    this.pendingLogs = [];

    try {
      await Promise.all(
        logsToSend.map(log => this.sendLog(log))
      );
    } catch (error) {
      console.error('[AgentLog] Failed to send logs:', error);
      this.pendingLogs.unshift(...logsToSend);
    }
  }

  private async sendLog(logData: LogOptions): Promise<void> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (this.config.apiKey) {
      headers['Authorization'] = `Bearer ${this.config.apiKey}`;
    }

    const response = await fetch(this.config.apiUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(logData),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
  }

  async search(query: string, filters?: {
    agent?: string;
    repository?: string;
    task_type?: string;
    start_date?: string;
    end_date?: string;
  }): Promise<any[]> {
    const params = new URLSearchParams({ q: query });
    
    if (filters?.agent) params.append('agent', filters.agent);
    if (filters?.repository) params.append('repository', filters.repository);
    if (filters?.task_type) params.append('task_type', filters.task_type);
    if (filters?.start_date) params.append('start_date', filters.start_date);
    if (filters?.end_date) params.append('end_date', filters.end_date);

    const response = await fetch(`${this.config.apiUrl.replace('/logs', '/search')}?${params}`);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  async getStats(): Promise<any> {
    const response = await fetch(`${this.config.apiUrl.replace('/logs', '/stats')}`);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  static fromGitRepo(repoUrl: string, repoName?: string): Partial<LogOptions> {
    return {
      repository_url: repoUrl,
      repository_name: repoName || repoUrl.split('/').pop()?.replace('.git', ''),
    };
  }
}

let globalAgentLog: AgentLog | null = null;

export function getAgentLog(config?: AgentLogConfig): AgentLog {
  if (!globalAgentLog) {
    globalAgentLog = new AgentLog(config);
  }
  return globalAgentLog;
}