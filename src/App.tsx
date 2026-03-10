import { useState, useEffect } from 'react';
import { format, subDays, addDays, isSameDay } from 'date-fns';
import { GoogleGenAI } from '@google/genai';
import { Bot, Calendar, ChevronLeft, ChevronRight, MessageSquare, Sparkles, Loader2, Plus, Search, Filter, X, Tag, FolderGit2, Code } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import Markdown from 'react-markdown';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface Log {
  id: number;
  agent: string;
  timestamp: string;
  user_prompt: string;
  ai_response: string;
  model?: string;
  repository_url?: string;
  repository_name?: string;
  branch?: string;
  tags?: string;
  session_id?: string;
  task_type?: string;
  file_path?: string;
  language?: string;
}

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

function LogCard({ log, index }: { log: Log; index: number }) {
  const tags = log.tags ? JSON.parse(log.tags) : [];
  
  return (
    <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
      {/* Timeline dot */}
      <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-neutral-50 bg-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
        <span className="text-xs font-bold text-indigo-600">{log.agent[0]}</span>
      </div>
      
      {/* Card */}
      <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-white p-5 rounded-xl shadow-sm border border-neutral-200 group-hover:border-indigo-200 transition-colors">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-neutral-100 text-neutral-700">
              {log.agent}
            </span>
            {log.model && (
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium bg-purple-50 text-purple-600">
                {log.model}
              </span>
            )}
            {log.repository_name && (
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium bg-indigo-50 text-indigo-600">
                <FolderGit2 size={12} />
                {log.repository_name}
              </span>
            )}
            {log.task_type && (
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium bg-emerald-50 text-emerald-600">
                {log.task_type}
              </span>
            )}
          </div>
          <time className="text-xs text-neutral-500 font-mono">
            {format(new Date(log.timestamp), 'HH:mm')}
          </time>
        </div>
        
        <div className="space-y-3">
          {tags.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap">
              {tags.slice(0, 3).map((tag: string, i: number) => (
                <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-neutral-100 text-neutral-600">
                  <Tag size={10} />
                  {tag}
                </span>
              ))}
              {tags.length > 3 && (
                <span className="text-xs text-neutral-500">+{tags.length - 3}</span>
              )}
            </div>
          )}
          <div>
            <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1">Prompt</p>
            <p className="text-sm text-neutral-800 line-clamp-3">{log.user_prompt}</p>
          </div>
          <div className="pt-3 border-t border-neutral-100">
            <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-1">Response</p>
            <p className="text-sm text-neutral-600 line-clamp-3">{log.ai_response}</p>
          </div>
          {log.file_path && (
            <div className="flex items-center gap-1.5 text-xs text-neutral-500">
              <Code size={12} />
              {log.file_path}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [logs, setLogs] = useState<Log[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [summary, setSummary] = useState<string>('');
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);
  
  // Search and filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Log[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [filterAgent, setFilterAgent] = useState('');
  const [filterRepository, setFilterRepository] = useState('');
  const [filterTaskType, setFilterTaskType] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  
  // Modal state for adding a log manually
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newLogAgent, setNewLogAgent] = useState('Cursor');
  const [newLogModel, setNewLogModel] = useState('');
  const [newLogPrompt, setNewLogPrompt] = useState('');
  const [newLogResponse, setNewLogResponse] = useState('');
  const [newLogRepoUrl, setNewLogRepoUrl] = useState('');
  const [newLogRepoName, setNewLogRepoName] = useState('');
  const [newLogBranch, setNewLogBranch] = useState('');
  const [newLogTags, setNewLogTags] = useState('');
  const [newLogSessionId, setNewLogSessionId] = useState('');
  const [newLogTaskType, setNewLogTaskType] = useState('');
  const [newLogFilePath, setNewLogFilePath] = useState('');
  const [newLogLanguage, setNewLogLanguage] = useState('');

  const fetchLogs = async (date: Date) => {
    setIsLoadingLogs(true);
    try {
      const dateStr = format(date, 'yyyy-MM-dd');
      const params = new URLSearchParams({ date: dateStr });
      if (filterAgent) params.append('agent', filterAgent);
      if (filterRepository) params.append('repository', filterRepository);
      if (filterTaskType) params.append('task_type', filterTaskType);
      
      const response = await fetch(`/api/logs?${params}`);
      if (response.ok) {
        const data = await response.json();
        setLogs(data);
      }
    } catch (error) {
      console.error('Failed to fetch logs:', error);
    } finally {
      setIsLoadingLogs(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim() && !filterAgent && !filterRepository && !filterTaskType) {
      setSearchResults([]);
      return;
    }
    
    setIsSearching(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery.trim()) params.append('q', searchQuery);
      if (filterAgent) params.append('agent', filterAgent);
      if (filterRepository) params.append('repository', filterRepository);
      if (filterTaskType) params.append('task_type', filterTaskType);
      
      const response = await fetch(`/api/search?${params}`);
      if (response.ok) {
        const data = await response.json();
        setSearchResults(data);
      }
    } catch (error) {
      console.error('Failed to search logs:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
  };

  useEffect(() => {
    fetchLogs(selectedDate);
    setSummary(''); // Clear summary when date changes
  }, [selectedDate, filterAgent, filterRepository, filterTaskType]);

  const handleSummarize = async () => {
    if (logs.length === 0) return;
    
    setIsSummarizing(true);
    try {
      const prompt = `Here are my interactions with various AI agents on ${format(selectedDate, 'MMMM d, yyyy')}:

${logs.map(l => `[Agent: ${l.agent} at ${format(new Date(l.timestamp), 'HH:mm')}]
User: ${l.user_prompt}
AI: ${l.ai_response}`).join('\n\n')}

Please summarize what tasks I accomplished today using AI. 
Group them by project or theme if possible. 
Keep it concise, professional, and informative. Use markdown formatting.`;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
      });

      setSummary(response.text || 'No summary generated.');
    } catch (error) {
      console.error('Failed to generate summary:', error);
      setSummary('Failed to generate summary. Please check your API key and try again.');
    } finally {
      setIsSummarizing(false);
    }
  };

  const handleAddLog = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const tagsArray = newLogTags.split(',').map(t => t.trim()).filter(Boolean);
      
      const response = await fetch('/api/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agent: newLogAgent,
          timestamp: new Date().toISOString(),
          user_prompt: newLogPrompt,
          ai_response: newLogResponse,
          model: newLogModel || undefined,
          repository_url: newLogRepoUrl,
          repository_name: newLogRepoName,
          branch: newLogBranch,
          tags: tagsArray.length > 0 ? tagsArray : undefined,
          session_id: newLogSessionId,
          task_type: newLogTaskType,
          file_path: newLogFilePath,
          language: newLogLanguage,
        }),
      });
      
      if (response.ok) {
        setIsAddModalOpen(false);
        setNewLogPrompt('');
        setNewLogResponse('');
        setNewLogModel('');
        setNewLogRepoUrl('');
        setNewLogRepoName('');
        setNewLogBranch('');
        setNewLogTags('');
        setNewLogSessionId('');
        setNewLogTaskType('');
        setNewLogFilePath('');
        setNewLogLanguage('');
        // Refresh logs if we added to today
        if (isSameDay(selectedDate, new Date())) {
          fetchLogs(selectedDate);
        } else {
          setSelectedDate(new Date());
        }
      }
    } catch (error) {
      console.error('Failed to add log:', error);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900 font-sans">
      {/* Header */}
      <header className="bg-white border-b border-neutral-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-3 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="bg-indigo-600 p-2 rounded-lg text-white">
                <Bot size={20} />
              </div>
              <h1 className="text-xl font-semibold tracking-tight">AI Agent Log</h1>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-neutral-100 rounded-lg p-1">
                <button 
                  onClick={() => setSelectedDate(subDays(selectedDate, 1))}
                  className="p-1.5 hover:bg-white rounded-md transition-colors"
                >
                  <ChevronLeft size={18} />
                </button>
                <div className="flex items-center gap-2 px-3 text-sm font-medium">
                  <Calendar size={16} className="text-neutral-500" />
                  {format(selectedDate, 'MMM d, yyyy')}
                </div>
                <button 
                  onClick={() => setSelectedDate(addDays(selectedDate, 1))}
                  className="p-1.5 hover:bg-white rounded-md transition-colors"
                  disabled={isSameDay(selectedDate, new Date())}
                >
                  <ChevronRight size={18} className={cn(isSameDay(selectedDate, new Date()) && "opacity-30")} />
                </button>
              </div>
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="flex items-center gap-1.5 bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-indigo-100 transition-colors"
              >
                <Plus size={16} />
                <span className="hidden sm:inline">Add Log</span>
              </button>
            </div>
          </div>
          
          {/* Search and Filter Bar */}
          <div className="flex items-center gap-2">
            <div className="flex-1 relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
              <input
                type="text"
                placeholder="Search logs by content, tags, or repository..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="w-full pl-10 pr-4 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="p-2 border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors"
              title="Toggle filters"
            >
              <Filter size={16} className="text-neutral-600" />
            </button>
            <button
              onClick={handleSearch}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
            >
              {isSearching ? 'Searching...' : 'Search'}
            </button>
            {searchQuery && (
              <button
                onClick={clearSearch}
                className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
              >
                <X size={16} className="text-neutral-600" />
              </button>
            )}
          </div>
          
          {/* Filter Panel */}
          {showFilters && (
            <div className="flex flex-wrap items-center gap-2 p-3 bg-neutral-50 rounded-lg border border-neutral-200">
              <select
                value={filterAgent}
                onChange={(e) => setFilterAgent(e.target.value)}
                className="text-sm border border-neutral-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">All Agents</option>
                <option value="Cursor">Cursor</option>
                <option value="ClaudeCode">ClaudeCode</option>
                <option value="OpenCode">OpenCode</option>
                <option value="ChatGPT">ChatGPT</option>
              </select>
              <input
                type="text"
                placeholder="Repository..."
                value={filterRepository}
                onChange={(e) => setFilterRepository(e.target.value)}
                className="text-sm border border-neutral-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 w-40"
              />
              <select
                value={filterTaskType}
                onChange={(e) => setFilterTaskType(e.target.value)}
                className="text-sm border border-neutral-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">All Task Types</option>
                <option value="feature-implementation">Feature Implementation</option>
                <option value="bug-fix">Bug Fix</option>
                <option value="refactoring">Refactoring</option>
                <option value="code-review">Code Review</option>
                <option value="documentation">Documentation</option>
                <option value="debugging">Debugging</option>
                <option value="setup">Setup</option>
              </select>
            </div>
          )}
        </div>
      </header>

       <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column: Timeline */}
          <div className="lg:col-span-2 space-y-6">
            {searchResults.length > 0 ? (
              <>
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold flex items-center gap-2">
                    <Search size={18} className="text-indigo-500" />
                    Search Results
                  </h2>
                  <span className="text-sm text-neutral-500 bg-neutral-200 px-2.5 py-0.5 rounded-full">
                    {searchResults.length} results
                  </span>
                </div>
                <div className="space-y-4">
                  {searchResults.map((log, index) => (
                    <LogCard key={log.id} log={log} index={index} />
                  ))}
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold flex items-center gap-2">
                    <MessageSquare size={18} className="text-neutral-500" />
                    Activity Timeline
                  </h2>
                  <span className="text-sm text-neutral-500 bg-neutral-200 px-2.5 py-0.5 rounded-full">
                    {logs.length} interactions
                  </span>
                </div>

                {isLoadingLogs ? (
                  <div className="flex flex-col items-center justify-center py-20 text-neutral-400">
                    <Loader2 size={32} className="animate-spin mb-4" />
                    <p>Loading logs...</p>
                  </div>
                ) : logs.length === 0 ? (
                  <div className="bg-white border border-neutral-200 border-dashed rounded-xl p-12 text-center">
                    <div className="bg-neutral-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Bot size={24} className="text-neutral-400" />
                    </div>
                    <h3 className="text-neutral-900 font-medium mb-1">No activity found</h3>
                    <p className="text-neutral-500 text-sm mb-6">You didn't interact with any AI agents on this day.</p>
                    <button 
                      onClick={() => setIsAddModalOpen(true)}
                      className="text-indigo-600 font-medium text-sm hover:underline"
                    >
                      Add a manual log
                    </button>
                  </div>
                ) : (
                  <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-neutral-200 before:to-transparent">
                    {logs.map((log, index) => (
                      <LogCard key={log.id} log={log} index={index} />
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Right Column: Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 overflow-hidden sticky top-24">
              <div className="p-5 border-b border-neutral-100 bg-neutral-50/50">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <Sparkles size={18} className="text-indigo-500" />
                  Daily Summary
                </h2>
                <p className="text-xs text-neutral-500 mt-1">
                  Let AI analyze your interactions and summarize your day's work.
                </p>
              </div>
              
              <div className="p-5">
                {summary ? (
                  <div className="prose prose-sm prose-neutral max-w-none">
                    <div className="markdown-body">
                      <Markdown>{summary}</Markdown>
                    </div>
                    <button 
                      onClick={handleSummarize}
                      disabled={isSummarizing}
                      className="mt-6 w-full py-2 px-4 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                    >
                      {isSummarizing ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                      Regenerate Summary
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-10 text-center">
                    <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mb-4">
                      <Sparkles size={28} className="text-indigo-400" />
                    </div>
                    <h3 className="text-neutral-900 font-medium mb-2">Ready to summarize</h3>
                    <p className="text-sm text-neutral-500 mb-6 max-w-[200px]">
                      Generate a comprehensive summary of all your AI interactions today.
                    </p>
                    <button
                      onClick={handleSummarize}
                      disabled={isSummarizing || logs.length === 0}
                      className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-neutral-300 disabled:cursor-not-allowed text-white rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2 shadow-sm"
                    >
                      {isSummarizing ? (
                        <>
                          <Loader2 size={16} className="animate-spin" />
                          Summarizing...
                        </>
                      ) : (
                        <>
                          Generate Summary
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
          
        </div>
      </main>

       {/* Add Log Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-neutral-100 flex items-center justify-between sticky top-0 bg-white">
              <h3 className="text-lg font-semibold">Add Manual Log</h3>
              <button 
                onClick={() => setIsAddModalOpen(false)}
                className="text-neutral-400 hover:text-neutral-600"
              >
                &times;
              </button>
            </div>
            <form onSubmit={handleAddLog} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Agent</label>
                  <select 
                    value={newLogAgent}
                    onChange={(e) => setNewLogAgent(e.target.value)}
                    className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="Cursor">Cursor</option>
                    <option value="ClaudeCode">ClaudeCode</option>
                    <option value="OpenCode">OpenCode</option>
                    <option value="OpenClaw">OpenClaw</option>
                    <option value="ChatGPT">ChatGPT</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Model</label>
                  <input
                    type="text"
                    value={newLogModel}
                    onChange={(e) => setNewLogModel(e.target.value)}
                    className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="gpt-4, claude-3.5-sonnet, gemini-1.5-pro"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Task Type</label>
                <select 
                  value={newLogTaskType}
                  onChange={(e) => setNewLogTaskType(e.target.value)}
                  className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Select...</option>
                  <option value="feature-implementation">Feature Implementation</option>
                  <option value="bug-fix">Bug Fix</option>
                  <option value="refactoring">Refactoring</option>
                  <option value="code-review">Code Review</option>
                  <option value="documentation">Documentation</option>
                  <option value="debugging">Debugging</option>
                  <option value="setup">Setup</option>
                </select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Repository URL</label>
                  <input
                    type="url"
                    value={newLogRepoUrl}
                    onChange={(e) => setNewLogRepoUrl(e.target.value)}
                    className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="https://github.com/user/repo"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Repository Name</label>
                  <input
                    type="text"
                    value={newLogRepoName}
                    onChange={(e) => setNewLogRepoName(e.target.value)}
                    className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="my-repo"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Branch</label>
                  <input
                    type="text"
                    value={newLogBranch}
                    onChange={(e) => setNewLogBranch(e.target.value)}
                    className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="main"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Session ID</label>
                  <input
                    type="text"
                    value={newLogSessionId}
                    onChange={(e) => setNewLogSessionId(e.target.value)}
                    className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Optional"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Language</label>
                  <input
                    type="text"
                    value={newLogLanguage}
                    onChange={(e) => setNewLogLanguage(e.target.value)}
                    className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="typescript"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">File Path</label>
                <input
                  type="text"
                  value={newLogFilePath}
                  onChange={(e) => setNewLogFilePath(e.target.value)}
                  className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="src/components/Component.tsx"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">Tags (comma separated)</label>
                <input
                  type="text"
                  value={newLogTags}
                  onChange={(e) => setNewLogTags(e.target.value)}
                  className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="refactoring, react, hooks"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">User Prompt</label>
                <textarea 
                  required
                  value={newLogPrompt}
                  onChange={(e) => setNewLogPrompt(e.target.value)}
                  className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[100px]"
                  placeholder="What did you ask the AI?"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">AI Response</label>
                <textarea 
                  required
                  value={newLogResponse}
                  onChange={(e) => setNewLogResponse(e.target.value)}
                  className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[100px]"
                  placeholder="What did the AI reply?"
                />
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <button 
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors"
                >
                  Save Log
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
