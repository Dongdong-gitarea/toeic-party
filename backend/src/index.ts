import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import * as Sentry from '@sentry/node';
import { Matchmaker } from './game/Matchmaker.js';
import { sanitizePlayerName } from './util/sanitizeName.js';
import type { SkillType } from './types.js';

// ── Sentry error tracking ──
if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    tracesSampleRate: 0.2,
    environment: process.env.NODE_ENV || 'production',
  });
  console.log('[Sentry] Initialized');
}

const PORT = Number(process.env.PORT) || 3001;

// ── Allowed origins (CORS lock-down) ──
const ALLOWED_ORIGINS = [
  'https://frontend-production-655f.up.railway.app',
  'http://localhost:3000',
  // LAN dev (any 192.168.x.x)
];

function isAllowedOrigin(origin: string | undefined): boolean {
  if (!origin) return false;
  if (ALLOWED_ORIGINS.includes(origin)) return true;
  // Allow LAN IPs for local dev
  if (/^https?:\/\/(192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|localhost)(:\d+)?$/.test(origin)) return true;
  // Allow custom domain if set
  if (process.env.FRONTEND_URL && origin === process.env.FRONTEND_URL) return true;
  return false;
}

const app = express();

// ── Rate limiting (HTTP) ──
app.use(rateLimit({
  windowMs: 60_000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests' },
}));

app.use(cors({
  origin: (origin, cb) => {
    if (!origin || isAllowedOrigin(origin)) cb(null, true);
    else cb(new Error('CORS blocked'));
  },
}));

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: (origin, cb) => {
      if (!origin || isAllowedOrigin(origin)) cb(null, true);
      else cb(new Error('CORS blocked'));
    },
    methods: ['GET', 'POST'],
  },
  pingInterval: 10_000,
  pingTimeout: 5_000,
});

const matchmaker = new Matchmaker(io);

// ── Input validation helpers ──
function validCharIdx(v: unknown): number {
  return typeof v === 'number' && Number.isInteger(v) && v >= 0 && v < 4 ? v : 0;
}

function validAnswerIndex(v: unknown): number | null {
  if (typeof v !== 'number' || !Number.isInteger(v) || v < 0 || v > 3) return null;
  return v;
}

function validSkillType(v: unknown): SkillType | null {
  if (v === 'shake' || v === 'fog' || v === 'timeCut') return v;
  return null;
}

function validWeakWords(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v.filter((w): w is string => typeof w === 'string' && w.length > 0).slice(0, 80);
}

function validString(v: unknown, maxLen = 100): string {
  if (typeof v !== 'string') return '';
  return v.slice(0, maxLen);
}

// ── WebSocket rate limiting (per-socket) ──
const socketRateLimits = new Map<string, { count: number; resetAt: number }>();
const WS_RATE_WINDOW = 10_000; // 10s
const WS_RATE_MAX = 50; // max 50 events per 10s

function wsRateOk(socketId: string): boolean {
  const now = Date.now();
  let entry = socketRateLimits.get(socketId);
  if (!entry || now > entry.resetAt) {
    entry = { count: 0, resetAt: now + WS_RATE_WINDOW };
    socketRateLimits.set(socketId, entry);
  }
  entry.count++;
  return entry.count <= WS_RATE_MAX;
}

// Cleanup stale rate limit entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [id, entry] of socketRateLimits) {
    if (now > entry.resetAt) socketRateLimits.delete(id);
  }
}, 30_000);

// ── Socket handlers ──
io.on('connection', (socket) => {
  console.log(`[+] ${socket.id}`);

  // Middleware: rate limit all events
  socket.use((_event, next) => {
    if (!wsRateOk(socket.id)) {
      next(new Error('Rate limited'));
      return;
    }
    next();
  });

  socket.on('JOIN_MATCH', (data: unknown) => {
    try {
      const d = data as Record<string, unknown>;
      matchmaker.addPlayer(
        socket,
        sanitizePlayerName(validString(d?.playerName, 16)),
        validWeakWords(d?.weakWords),
        validCharIdx(d?.charIdx),
      );
    } catch (err) {
      Sentry.captureException(err);
    }
  });

  socket.on('LEAVE_QUEUE', () => {
    matchmaker.removePlayer(socket.id);
  });

  socket.on('READY_UP', (data: unknown) => {
    const d = data as Record<string, unknown>;
    matchmaker.setReady(socket.id, !!d?.ready);
  });

  socket.on('CHANGE_CHAR', (data: unknown) => {
    const d = data as Record<string, unknown>;
    matchmaker.setCharIdx(socket.id, validCharIdx(d?.charIdx));
  });

  socket.on('CREATE_PRIVATE', (data: unknown) => {
    try {
      const d = data as Record<string, unknown>;
      matchmaker.createPrivateRoom(
        socket,
        sanitizePlayerName(validString(d?.playerName, 16)),
        validWeakWords(d?.weakWords),
        validCharIdx(d?.charIdx),
      );
    } catch (err) {
      Sentry.captureException(err);
    }
  });

  socket.on('JOIN_PRIVATE', (data: unknown) => {
    try {
      const d = data as Record<string, unknown>;
      matchmaker.joinPrivateRoom(
        socket,
        validString(d?.code, 10),
        sanitizePlayerName(validString(d?.playerName, 16)),
        validWeakWords(d?.weakWords),
        validCharIdx(d?.charIdx),
      );
    } catch (err) {
      Sentry.captureException(err);
    }
  });

  socket.on('SUBMIT_ANSWER', (data: unknown) => {
    try {
      const d = data as Record<string, unknown>;
      const idx = validAnswerIndex(d?.answerIndex);
      if (idx === null) return; // silently ignore invalid input
      const room = matchmaker.getRoomBySocket(socket.id);
      room?.handleAnswer(socket.id, idx);
    } catch (err) {
      Sentry.captureException(err);
    }
  });

  socket.on('USE_SKILL', (data: unknown) => {
    try {
      const d = data as Record<string, unknown>;
      const skill = validSkillType(d?.skillType);
      if (!skill) return;
      const room = matchmaker.getRoomBySocket(socket.id);
      room?.handleSkill(socket.id, skill);
    } catch (err) {
      Sentry.captureException(err);
    }
  });

  socket.on('error', (err) => {
    console.error(`[!] Socket error ${socket.id}:`, err.message);
    Sentry.captureException(err);
  });

  socket.on('disconnect', () => {
    console.log(`[-] ${socket.id}`);
    socketRateLimits.delete(socket.id);
    matchmaker.removePlayer(socket.id);
    matchmaker.getRoomBySocket(socket.id)?.handleDisconnect(socket.id);
  });
});

// ── Global error handlers ──
process.on('uncaughtException', (err) => {
  console.error('[FATAL] Uncaught exception:', err);
  Sentry.captureException(err);
});

process.on('unhandledRejection', (reason) => {
  console.error('[FATAL] Unhandled rejection:', reason);
  Sentry.captureException(reason);
});

httpServer.listen(PORT, () => {
  console.log(`\n  TOEIC PARTY backend → http://localhost:${PORT}\n`);
});
