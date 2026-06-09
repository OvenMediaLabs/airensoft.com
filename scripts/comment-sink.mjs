#!/usr/bin/env node
// Local review-comment sink for the Docusaurus dev preview.
//
// The dev-only client module (src/clientModules/review-comments.ts) posts
// comments here when you select text on the rendered page and write a note.
// Comments are appended to .review/comments.jsonl (gitignored), which the
// assistant reads to apply your edits.
//
// Run:  node scripts/comment-sink.mjs   (or: npm run comment-sink)
// Port: 3999 (override with COMMENT_SINK_PORT)

import http from 'node:http';
import { randomUUID } from 'node:crypto';
import { mkdirSync, appendFileSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const PORT = Number(process.env.COMMENT_SINK_PORT) || 3999;
const DIR = join(process.cwd(), '.review');
const FILE = join(DIR, 'comments.jsonl');

function ensureFile() {
  if (!existsSync(DIR)) mkdirSync(DIR, { recursive: true });
  if (!existsSync(FILE)) writeFileSync(FILE, '');
}

function readAll() {
  ensureFile();
  return readFileSync(FILE, 'utf8')
    .split('\n')
    .filter((l) => l.trim())
    .map((l) => {
      try {
        return JSON.parse(l);
      } catch {
        return null;
      }
    })
    .filter(Boolean);
}

function writeAll(list) {
  ensureFile();
  writeFileSync(FILE, list.map((c) => JSON.stringify(c)).join('\n') + (list.length ? '\n' : ''));
}

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

function send(res, status, body) {
  res.writeHead(status, { 'Content-Type': 'application/json', ...CORS });
  res.end(body == null ? '' : JSON.stringify(body));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (chunk) => {
      data += chunk;
      if (data.length > 1e6) reject(new Error('payload too large'));
    });
    req.on('end', () => {
      try {
        resolve(data ? JSON.parse(data) : {});
      } catch (e) {
        reject(e);
      }
    });
    req.on('error', reject);
  });
}

const server = http.createServer(async (req, res) => {
  if (req.method === 'OPTIONS') return send(res, 204, null);

  const url = new URL(req.url, `http://localhost:${PORT}`);

  try {
    if (req.method === 'GET' && url.pathname === '/comments') {
      return send(res, 200, readAll());
    }

    if (req.method === 'POST' && url.pathname === '/comment') {
      const body = await readBody(req);
      if (!body.comment || !String(body.comment).trim()) {
        return send(res, 400, { error: 'comment is required' });
      }
      const entry = {
        id: randomUUID(),
        ts: new Date().toISOString(),
        slug: body.slug || '',
        title: body.title || '',
        heading: body.heading || null,
        quote: (body.quote || '').slice(0, 800),
        comment: String(body.comment).trim(),
      };
      appendFileSync(FILE, JSON.stringify(entry) + '\n');
      console.log(`📝 [${entry.slug}] "${entry.quote.slice(0, 40)}…" → ${entry.comment.slice(0, 60)}`);
      return send(res, 200, entry);
    }

    if (req.method === 'POST' && url.pathname === '/delete') {
      const body = await readBody(req);
      const next = readAll().filter((c) => c.id !== body.id);
      writeAll(next);
      return send(res, 200, { ok: true, remaining: next.length });
    }

    if (req.method === 'POST' && url.pathname === '/clear') {
      writeAll([]);
      return send(res, 200, { ok: true });
    }

    if (url.pathname === '/') return send(res, 200, { ok: true, file: FILE });

    return send(res, 404, { error: 'not found' });
  } catch (e) {
    return send(res, 500, { error: String(e.message || e) });
  }
});

server.listen(PORT, () => {
  ensureFile();
  console.log(`💬 comment-sink listening on http://localhost:${PORT}  →  ${FILE}`);
});
