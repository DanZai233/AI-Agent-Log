import express from 'express';
import { createServer as createViteServer } from 'vite';
import Database from 'better-sqlite3';

const db = new Database('logs.db');

// Database migration
try {
  const tableInfo = db.prepare("PRAGMA table_info(logs)").all() as Array<{ name: string }>;
  const columns = tableInfo.map(col => col.name);

  // Check if model column exists
  if (!columns.includes('model')) {
    console.log('🔄 Migrating database: Adding model column...');
    db.exec('ALTER TABLE logs ADD COLUMN model TEXT');
    console.log('✅ Migration complete');
  }
} catch (error) {
  // If table doesn't exist, it will be created below
  console.log('Table does not exist yet, will create on startup');
}

// Create table if it doesn't exist
db.exec(`
  CREATE TABLE IF NOT EXISTS logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    agent TEXT NOT NULL,
    timestamp TEXT NOT NULL,
    user_prompt TEXT NOT NULL,
    ai_response TEXT NOT NULL,
    model TEXT,
    repository_url TEXT,
    repository_name TEXT,
    branch TEXT,
    tags TEXT,
    session_id TEXT,
    task_type TEXT,
    file_path TEXT,
    language TEXT
  )
`);

db.exec(`
  CREATE INDEX IF NOT EXISTS idx_agent ON logs(agent);
  CREATE INDEX IF NOT EXISTS idx_model ON logs(model);
  CREATE INDEX IF NOT EXISTS idx_timestamp ON logs(timestamp);
  CREATE INDEX IF NOT EXISTS idx_repository ON logs(repository_name);
  CREATE INDEX IF NOT EXISTS idx_session ON logs(session_id);
  CREATE INDEX IF NOT EXISTS idx_tags ON logs(tags);
`);

async function startServer() {
  const app = express();
  app.use(express.json());

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    try {
      const count = db.prepare('SELECT COUNT(*) as count FROM logs').get() as { count: number };
      res.json({
        status: 'ok',
        database: 'connected',
        totalLogs: count.count
      });
    } catch (error) {
      res.status(500).json({
        status: 'error',
        message: 'Database error'
      });
    }
  });

  app.get('/api/logs', (req, res) => {
    const date = req.query.date as string;
    const agent = req.query.agent as string;
    const model = req.query.model as string;
    const repository = req.query.repository as string;
    const session = req.query.session as string;
    const taskType = req.query.task_type as string;
    
    let query = 'SELECT * FROM logs WHERE 1=1';
    let params: any[] = [];

    if (date) {
      query += ' AND date(timestamp) = ?';
      params.push(date);
    }
    if (agent) {
      query += ' AND agent = ?';
      params.push(agent);
    }
    if (model) {
      query += ' AND model = ?';
      params.push(model);
    }
    if (repository) {
      query += ' AND repository_name = ?';
      params.push(repository);
    }
    if (session) {
      query += ' AND session_id = ?';
      params.push(session);
    }
    if (taskType) {
      query += ' AND task_type = ?';
      params.push(taskType);
    }

    query += ' ORDER BY timestamp DESC';
    
    const logs = db.prepare(query).all(...params);
    res.json(logs);
  });

  app.get('/api/search', (req, res) => {
    const q = req.query.q as string;
    const agent = req.query.agent as string;
    const model = req.query.model as string;
    const repository = req.query.repository as string;
    const taskType = req.query.task_type as string;
    const startDate = req.query.start_date as string;
    const endDate = req.query.end_date as string;
    
    let query = 'SELECT * FROM logs WHERE 1=1';
    let params: any[] = [];

    if (q) {
      query += ' AND (user_prompt LIKE ? OR ai_response LIKE ? OR tags LIKE ? OR repository_name LIKE ? OR model LIKE ?)';
      const searchTerm = `%${q}%`;
      params.push(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm);
    }
    if (agent) {
      query += ' AND agent = ?';
      params.push(agent);
    }
    if (model) {
      query += ' AND model = ?';
      params.push(model);
    }
    if (repository) {
      query += ' AND repository_name = ?';
      params.push(repository);
    }
    if (taskType) {
      query += ' AND task_type = ?';
      params.push(taskType);
    }
    if (startDate) {
      query += ' AND date(timestamp) >= ?';
      params.push(startDate);
    }
    if (endDate) {
      query += ' AND date(timestamp) <= ?';
      params.push(endDate);
    }

    query += ' ORDER BY timestamp DESC LIMIT 100';
    
    const logs = db.prepare(query).all(...params);
    res.json(logs);
  });

  app.get('/api/stats', (req, res) => {
    const totalLogs = db.prepare('SELECT COUNT(*) as count FROM logs').get() as { count: number };
    
    const byAgent = db.prepare(`
      SELECT agent, COUNT(*) as count 
      FROM logs 
      GROUP BY agent 
      ORDER BY count DESC
    `).all();
    
    const byModel = db.prepare(`
      SELECT model, COUNT(*) as count 
      FROM logs 
      WHERE model IS NOT NULL 
      GROUP BY model 
      ORDER BY count DESC
    `).all();
    
    const byRepository = db.prepare(`
      SELECT repository_name, COUNT(*) as count 
      FROM logs 
      WHERE repository_name IS NOT NULL 
      GROUP BY repository_name 
      ORDER BY count DESC 
      LIMIT 10
    `).all();
    
    const byTaskType = db.prepare(`
      SELECT task_type, COUNT(*) as count 
      FROM logs 
      WHERE task_type IS NOT NULL 
      GROUP BY task_type 
      ORDER BY count DESC
    `).all();
    
    const recentActivity = db.prepare(`
      SELECT date(timestamp) as date, COUNT(*) as count 
      FROM logs 
      WHERE date(timestamp) >= date('now', '-7 days')
      GROUP BY date(timestamp) 
      ORDER BY date DESC
    `).all();

    res.json({
      totalLogs: totalLogs.count,
      byAgent,
      byModel,
      byRepository,
      byTaskType,
      recentActivity
    });
  });

  app.post('/api/logs', (req, res) => {
    const { 
      agent, 
      timestamp, 
      user_prompt, 
      ai_response,
      model,
      repository_url,
      repository_name,
      branch,
      tags,
      session_id,
      task_type,
      file_path,
      language
    } = req.body;
    
    if (!agent || !user_prompt || !ai_response) {
      return res.status(400).json({ error: 'Missing required fields: agent, user_prompt, ai_response' });
    }
    
    const stmt = db.prepare(`
      INSERT INTO logs (
        agent, timestamp, user_prompt, ai_response, model,
        repository_url, repository_name, branch, tags,
        session_id, task_type, file_path, language
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    const info = stmt.run(
      agent,
      timestamp || new Date().toISOString(),
      user_prompt,
      ai_response,
      model || null,
      repository_url || null,
      repository_name || null,
      branch || null,
      tags ? JSON.stringify(Array.isArray(tags) ? tags : [tags]) : null,
      session_id || null,
      task_type || null,
      file_path || null,
      language || null
    );
    
    res.json({ id: info.lastInsertRowid });
  });

  // Seed some initial data if empty
  const count = db.prepare('SELECT COUNT(*) as count FROM logs').get() as { count: number };
  if (count.count === 0) {
    const today = new Date().toISOString();
    const yesterday = new Date(Date.now() - 86400000).toISOString();
    
    const stmt = db.prepare(`
      INSERT INTO logs (
        agent, timestamp, user_prompt, ai_response, model,
        repository_url, repository_name, branch, tags,
        session_id, task_type, file_path, language
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    stmt.run(
      'Cursor', today, 
      'Write a python script to scrape a website for news articles',
      'Here is a python script using BeautifulSoup and requests to scrape the site...',
      'gpt-4',
      'https://github.com/example/news-scraper', 'news-scraper', 'main', 
      JSON.stringify(['web-scraping', 'python']), 
      'sess-001', 'feature-implementation', 'scraper.py', 'python'
    );
    
    stmt.run(
      'ClaudeCode', today,
      'Refactor this React component to use hooks instead of classes',
      'I have refactored the component to use useState and useEffect. Here is the updated code...',
      'claude-3.5-sonnet',
      'https://github.com/example/web-app', 'web-app', 'feature/auth',
      JSON.stringify(['refactoring', 'react', 'hooks']),
      'sess-002', 'refactoring', 'src/components/Auth.tsx', 'typescript'
    );
    
    stmt.run(
      'OpenCode', yesterday,
      'How do I configure a Dockerfile for a Node.js app?',
      'To configure a Dockerfile for Node.js, you should start with a node base image. Here is an example...',
      'gemini-1.5-pro',
      'https://github.com/example/api-server', 'api-server', 'main',
      JSON.stringify(['docker', 'deployment']),
      'sess-003', 'setup', 'Dockerfile', 'typescript'
    );
  }

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static('dist'));
  }

  const PORT = parseInt(process.env.PORT || '3000', 10);

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n${'='.repeat(50)}`);
    console.log('🚀 Agent Log Server Started');
    console.log(`${'='.repeat(50)}`);
    console.log(`\n📍 API Endpoints:`);
    console.log(`   GET  http://localhost:${PORT}/api/health`);
    console.log(`   GET  http://localhost:${PORT}/api/logs`);
    console.log(`   POST http://localhost:${PORT}/api/logs`);
    console.log(`   GET  http://localhost:${PORT}/api/search`);
    console.log(`   GET  http://localhost:${PORT}/api/stats`);
    console.log(`\n💻 Web UI: http://localhost:${PORT}`);
    console.log(`${'='.repeat(50)}\n`);
    
    // Test database connection
    try {
      const test = db.prepare('SELECT COUNT(*) as count FROM logs').get() as { count: number };
      console.log(`✅ Database connected (${test.count} records)\n`);
    } catch (error) {
      console.error('❌ Database error:', error);
    }
  });
}

startServer();
