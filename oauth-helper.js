#!/usr/bin/env node

// Simple OAuth helper for getting TickTick tokens
// Usage: node oauth-helper.js

import express from 'express';
import axios from 'axios';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
try {
  const envFile = readFileSync(join(__dirname, '.env'), 'utf8');
  envFile.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value && !key.startsWith('#')) {
      process.env[key.trim()] = value.trim();
    }
  });
} catch (e) {
  console.log('No .env file found, using environment variables');
}

const CLIENT_ID = process.env.TICKTICK_CLIENT_ID;
const CLIENT_SECRET = process.env.TICKTICK_CLIENT_SECRET;
const REDIRECT_URI = 'http://localhost:8000/callback';

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error('Error: TICKTICK_CLIENT_ID and TICKTICK_CLIENT_SECRET must be set in .env file or environment');
  process.exit(1);
}

const app = express();

app.get('/', (req, res) => {
  const authUrl = `https://ticktick.com/oauth/authorize?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=code&scope=tasks:read tasks:write`;
  
  res.send(`
    <h1>TickTick OAuth Helper</h1>
    <p>Click the link below to authorize your app:</p>
    <a href="${authUrl}" target="_blank">Authorize TickTick App</a>
    <p>After authorization, you'll be redirected back here with your tokens.</p>
  `);
});

app.get('/callback', async (req, res) => {
  const { code } = req.query;
  
  if (!code) {
    return res.send('<h1>Error: No authorization code received</h1>');
  }

  try {
    const response = await axios.post('https://ticktick.com/oauth/token', {
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      code: code,
      grant_type: 'authorization_code',
      redirect_uri: REDIRECT_URI
    }, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    const { access_token, refresh_token } = response.data;

    res.send(`
      <h1>Success! Your TickTick OAuth Tokens</h1>
      <p>Add these to your .env file:</p>
      <pre>
TICKTICK_ACCESS_TOKEN=${access_token}
TICKTICK_REFRESH_TOKEN=${refresh_token}
TICKTICK_CLIENT_ID=${CLIENT_ID}
TICKTICK_CLIENT_SECRET=${CLIENT_SECRET}
      </pre>
      <p>You can now close this window and stop the server (Ctrl+C).</p>
    `);

  } catch (error) {
    console.error('Token exchange error:', error.response?.data || error.message);
    res.send(`<h1>Error getting tokens</h1><pre>${JSON.stringify(error.response?.data || error.message, null, 2)}</pre>`);
  }
});

const server = app.listen(8000, () => {
  console.log('🚀 OAuth helper running at http://localhost:8000');
  console.log('📝 Make sure TICKTICK_CLIENT_ID and TICKTICK_CLIENT_SECRET are set in your .env file');
  console.log('🌐 Open http://localhost:8000 in your browser to start OAuth flow');
});

process.on('SIGINT', () => {
  console.log('\n👋 Shutting down OAuth helper...');
  server.close(() => process.exit(0));
});