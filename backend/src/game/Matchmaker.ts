import type { Server, Socket } from 'socket.io';
import { nanoid } from 'nanoid';
import { Room } from './Room.js';

interface QueueEntry {
  socket: Socket;
  playerName: string;
  ready: boolean;
  weakWords: string[];
  charIdx: number;
}

const FILL_TIMEOUT_MS = 15000;
const MAX_PLAYERS = 4;

export class Matchmaker {
  private queue: QueueEntry[] = [];
  private rooms = new Map<string, Room>();
  private fillTimer: NodeJS.Timeout | null = null;
  private fillStartedAt: number | null = null;
  private io: Server;

  constructor(io: Server) {
    this.io = io;
  }

  addPlayer(
    socket: Socket,
    playerName: string,
    weakWords: string[] = [],
    charIdx = 0,
  ) {
    this.queue.push({ socket, playerName, ready: false, weakWords, charIdx });
    socket.emit('MATCHMAKING', { position: this.queue.length });

    if (this.queue.length >= MAX_PLAYERS) {
      this.broadcastLobby();
      this.startFromQueue(MAX_PLAYERS);
      return;
    }

    if (this.queue.length === 1 && !this.fillTimer) {
      this.fillStartedAt = Date.now();
      this.fillTimer = setTimeout(() => this.fillAndStart(), FILL_TIMEOUT_MS);
    }

    this.broadcastLobby();
  }

  setReady(socketId: string, ready: boolean) {
    const entry = this.queue.find((e) => e.socket.id === socketId);
    if (!entry) return;
    entry.ready = ready;

    // If everyone in queue is ready and there's at least one player, force start
    if (this.queue.length > 0 && this.queue.every((e) => e.ready)) {
      this.startFromQueue(this.queue.length);
      return;
    }

    this.broadcastLobby();
  }

  removePlayer(socketId: string) {
    const before = this.queue.length;
    this.queue = this.queue.filter((e) => e.socket.id !== socketId);
    if (this.queue.length === 0 && this.fillTimer) {
      clearTimeout(this.fillTimer);
      this.fillTimer = null;
      this.fillStartedAt = null;
    } else if (this.queue.length !== before) {
      this.broadcastLobby();
    }
  }

  private broadcastLobby() {
    const players = this.queue.map((e) => ({ name: e.playerName, ready: e.ready }));
    const secondsLeft = this.fillStartedAt
      ? Math.max(0, Math.ceil((FILL_TIMEOUT_MS - (Date.now() - this.fillStartedAt)) / 1000))
      : Math.ceil(FILL_TIMEOUT_MS / 1000);
    const payload = {
      players,
      count: players.length,
      capacity: MAX_PLAYERS,
      secondsLeft,
    };
    for (const entry of this.queue) {
      entry.socket.emit('LOBBY_UPDATE', payload);
    }
  }

  private fillAndStart() {
    this.fillTimer = null;
    this.fillStartedAt = null;
    if (this.queue.length === 0) return;
    this.startFromQueue(this.queue.length);
  }

  private startFromQueue(count: number) {
    const entries = this.queue.splice(0, count);
    this.createRoom(entries);
  }

  private createRoom(entries: QueueEntry[]) {
    if (this.fillTimer) {
      clearTimeout(this.fillTimer);
      this.fillTimer = null;
      this.fillStartedAt = null;
    }

    const roomId = nanoid(8);
    const weakWords = new Set<string>();
    for (const e of entries) for (const w of e.weakWords) weakWords.add(w.toLowerCase());

    const room = new Room(roomId, this.io, (id) => this.destroyRoom(id), [...weakWords]);

    for (const entry of entries) {
      room.addPlayer(entry.socket.id, entry.playerName, false, entry.charIdx);
      entry.socket.join(roomId);
      entry.socket.data.roomId = roomId;
    }

    room.fillWithAI();

    this.rooms.set(roomId, room);

    this.io.to(roomId).emit('MATCH_FOUND', {
      roomId,
      players: room.getPlayerList(),
    });

    setTimeout(() => room.start(), 2500);

    if (this.queue.length > 0) {
      this.fillStartedAt = Date.now();
      this.fillTimer = setTimeout(() => this.fillAndStart(), FILL_TIMEOUT_MS);
      this.broadcastLobby();
    }
  }

  getRoom(roomId: string): Room | undefined {
    return this.rooms.get(roomId);
  }

  getRoomBySocket(socketId: string): Room | undefined {
    for (const room of this.rooms.values()) {
      if (room.players.has(socketId)) return room;
    }
    return undefined;
  }

  private destroyRoom(roomId: string) {
    const room = this.rooms.get(roomId);
    if (room) {
      room.cleanup();
      this.rooms.delete(roomId);
    }
  }
}
