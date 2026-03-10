import express from 'express';
import { createServer as createViteServer } from 'vite';
import Database from 'better-sqlite3';

const db = new Database('logs.db');

db.exec(`
  CREATE TABLE IF NOT EXISTS logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    agent TEXT NOT NULL,
    timestamp TEXT NOT NULL,
    user_prompt TEXT NOT NULL,
    ai_response TEXT NOT NULL
  )
`);

async function startServer() {
  const app = express();
  app.use(express.json());

  app.get('/api/logs', (req, res) => {
    const date = req.query.date as string;
    let query = 'SELECT * FROM logs ORDER BY timestamp DESC';
    let params: any[] = [];

    if (date) {
      // SQLite date() function extracts YYYY-MM-DD
      query = 'SELECT * FROM logs WHERE date(timestamp) = ? ORDER BY timestamp DESC';
      params = [date];
    }

    const logs = db.prepare(query).all(...params);
    res.json(logs);
  });

  app.post('/api/logs', (req, res) => {
    const { agent, timestamp, user_prompt, ai_response } = req.body;
    if (!agent || !user_prompt || !ai_response) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    const stmt = db.prepare('INSERT INTO logs (agent, timestamp, user_prompt, ai_response) VALUES (?, ?, ?, ?)');
    const info = stmt.run(agent, timestamp || new Date().toISOString(), user_prompt, ai_response);
    res.json({ id: info.lastInsertRowid });
  });

  // Seed some initial data if empty
  const count = db.prepare('SELECT COUNT(*) as count FROM logs').get() as { count: number };
  if (count.count === 0) {
    const today = new Date().toISOString();
    const yesterday = new Date(Date.now() - 86400000).toISOString();
    
    const stmt = db.prepare('INSERT INTO logs (agent, timestamp, user_prompt, ai_response) VALUES (?, ?, ?, ?)');
    stmt.run('Cursor', today, 'Write a python script to scrape a website for news articles', 'Here is a python script using BeautifulSoup and requests to scrape the site...');
    stmt.run('ClaudeCode', today, 'Refactor this React component to use hooks instead of classes', 'I have refactored the component to use useState and useEffect. Here is the updated code...');
    stmt.run('OpenCode', yesterday, 'How do I configure a Dockerfile for a Node.js app?', 'To configure a Dockerfile for Node.js, you should start with a node base image. Here is an example...');
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

  const PORT = 3000;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
