require('dotenv').config();
const express = require('express');
const path = require('path');
const crypto = require('crypto');
const { Pool } = require('pg');

const app = express();
const port = process.env.PORT || 3002;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function initDB() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        token TEXT
      );
    `);
    console.log('Database initialized.');
  } catch (err) {
    console.error('Error initializing database:', err);
  }
}

initDB();

function createToken() {
  return crypto.randomBytes(24).toString('hex');
}

async function signupUser(name, email, password) {
  const passwordHash = crypto.createHash('sha256').update(password).digest('hex');
  const result = await pool.query(
    'INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING id',
    [name, email, passwordHash]
  );
  return result.rows[0].id;
}

async function loginUser(email, password) {
  const passwordHash = crypto.createHash('sha256').update(password).digest('hex');
  const result = await pool.query(
    'SELECT id, name FROM users WHERE email = $1 AND password_hash = $2',
    [email, passwordHash]
  );
  if (result.rows.length === 0) return null;
  const token = createToken();
  await pool.query('UPDATE users SET token = $1 WHERE id = $2', [token, result.rows[0].id]);
  return { id: result.rows[0].id, name: result.rows[0].name, token };
}

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.post('/api/signup', async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ success: false, message: 'Name, email, and password are required.' });
  }

  try {
    const userId = await signupUser(name, email, password);
    const token = createToken();
    await pool.query('UPDATE users SET token = $1 WHERE id = $2', [token, userId]);
    return res.json({ success: true, token, name });
  } catch (err) {
    if (err.code === '23505') { // unique violation
      return res.status(409).json({ success: false, message: 'A user with that email already exists.' });
    }
    console.error('Signup error:', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
});

app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Email and password are required.' });
  }

  try {
    const user = await loginUser(email, password);
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }
    return res.json({ success: true, token: user.token, name: user.name });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(port, () => {
  console.log(`Kosmos app server running on http://localhost:${port}`);
});
