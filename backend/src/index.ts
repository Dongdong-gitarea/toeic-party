import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { Matchmaker } from './game/Matchmaker.js';
import { sanitizePlayerName } from './util/sanitizeName.js';
import type { SkillType } from './types.js';

const PORT = Number(process.env.PORT) || 3001;

const app = express();
app.use(cors());
app.get('/health', (_req, res) => res.json({ status: 'ok' }));

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
  pingInterval: 10_000,
  pingTimeout: 5_000,
});

const matchmaker = new Matchmaker(io);

io.on('connection', (socket) => {
  console.log(`[+] ${socket.id}`);

  socket.on('JOIN_MATCH', (
    {
      playerName,
      weakWords,
      charIdx,
    }: { playerName: string; weakWords?: string[]; charIdx?: number },
  ) => {
    const idx = typeof charIdx === 'number' && charIdx >= 0 && charIdx < 4 ? charIdx : 0;
    matchmaker.addPlayer(
      socket,
      sanitizePlayerName(playerName),
      Array.isArray(weakWords) ? weakWords.slice(0, 80) : [],
      idx,
    );
  });

  socket.on('LEAVE_QUEUE', () => {
    matchmaker.removePlayer(socket.id);
  });

  socket.on('READY_UP', ({ ready }: { ready: boolean }) => {
    matchmaker.setReady(socket.id, !!ready);
  });

  socket.on('CHANGE_CHAR', ({ charIdx }: { charIdx: number }) => {
    matchmaker.setCharIdx(socket.id, charIdx);
  });

  socket.on('CREATE_PRIVATE', (
    {
      playerName,
      weakWords,
      charIdx,
    }: { playerName: string; weakWords?: string[]; charIdx?: number },
  ) => {
    const idx = typeof charIdx === 'number' && charIdx >= 0 && charIdx < 4 ? charIdx : 0;
    matchmaker.createPrivateRoom(
      socket,
      sanitizePlayerName(playerName),
      Array.isArray(weakWords) ? weakWords.slice(0, 80) : [],
      idx,
    );
  });

  socket.on('JOIN_PRIVATE', (
    {
      code,
      playerName,
      weakWords,
      charIdx,
    }: {
      code: string;
      playerName: string;
      weakWords?: string[];
      charIdx?: number;
    },
  ) => {
    const idx = typeof charIdx === 'number' && charIdx >= 0 && charIdx < 4 ? charIdx : 0;
    matchmaker.joinPrivateRoom(
      socket,
      code,
      sanitizePlayerName(playerName),
      Array.isArray(weakWords) ? weakWords.slice(0, 80) : [],
      idx,
    );
  });

  socket.on('SUBMIT_ANSWER', ({ answerIndex }: { answerIndex: number }) => {
    const room = matchmaker.getRoomBySocket(socket.id);
    room?.handleAnswer(socket.id, answerIndex);
  });

  socket.on('USE_SKILL', ({ skillType }: { skillType: SkillType }) => {
    const room = matchmaker.getRoomBySocket(socket.id);
    room?.handleSkill(socket.id, skillType);
  });

  socket.on('disconnect', () => {
    console.log(`[-] ${socket.id}`);
    matchmaker.removePlayer(socket.id);
    matchmaker.getRoomBySocket(socket.id)?.handleDisconnect(socket.id);
  });
});

httpServer.listen(PORT, () => {
  console.log(`\n  TOEIC PARTY backend → http://localhost:${PORT}\n`);
});
