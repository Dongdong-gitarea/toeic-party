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

interface PrivateRoomState {
  code: string;
  hostId: string;
  members: QueueEntry[];
  expiryTimer: NodeJS.Timeout | null;
}

const FILL_TIMEOUT_MS = 15000;
const MAX_PLAYERS = 4;
const PRIVATE_ROOM_IDLE_MS = 10 * 60 * 1000;
const CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; // no I/L/O/0/1
const CODE_LENGTH = 5;

function generateCode(): string {
  let s = '';
  for (let i = 0; i < CODE_LENGTH; i++) {
    s += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
  }
  return s;
}

export class Matchmaker {
  private queue: QueueEntry[] = [];
  private rooms = new Map<string, Room>();
  private privateRooms = new Map<string, PrivateRoomState>();
  private privateBySocket = new Map<string, string>();
  private fillTimer: NodeJS.Timeout | null = null;
  private fillStartedAt: number | null = null;
  private io: Server;

  constructor(io: Server) {
    this.io = io;
  }

  // ── Public queue ──

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
    // Private room first
    const code = this.privateBySocket.get(socketId);
    if (code) {
      const room = this.privateRooms.get(code);
      if (!room) return;
      const member = room.members.find((m) => m.socket.id === socketId);
      if (!member) return;
      member.ready = ready;
      this.refreshPrivateExpiry(room);
      if (room.members.length > 0 && room.members.every((m) => m.ready)) {
        this.startPrivateGame(room);
        return;
      }
      this.broadcastPrivateLobby(code);
      return;
    }

    // Public queue
    const entry = this.queue.find((e) => e.socket.id === socketId);
    if (!entry) return;
    entry.ready = ready;

    if (this.queue.length > 0 && this.queue.every((e) => e.ready)) {
      this.startFromQueue(this.queue.length);
      return;
    }
    this.broadcastLobby();
  }

  removePlayer(socketId: string) {
    // Private room first
    const code = this.privateBySocket.get(socketId);
    if (code) {
      this.privateBySocket.delete(socketId);
      const room = this.privateRooms.get(code);
      if (!room) return;
      room.members = room.members.filter((m) => m.socket.id !== socketId);
      if (room.members.length === 0) {
        this.disposePrivate(code);
        return;
      }
      if (room.hostId === socketId) {
        room.hostId = room.members[0]!.socket.id;
      }
      this.refreshPrivateExpiry(room);
      this.broadcastPrivateLobby(code);
      return;
    }

    // Public queue
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

  // ── Private rooms ──

  createPrivateRoom(
    socket: Socket,
    playerName: string,
    weakWords: string[] = [],
    charIdx = 0,
  ) {
    if (this.privateBySocket.has(socket.id)) return;
    const code = this.uniqueCode();
    const entry: QueueEntry = {
      socket,
      playerName,
      ready: false,
      weakWords,
      charIdx,
    };
    const room: PrivateRoomState = {
      code,
      hostId: socket.id,
      members: [entry],
      expiryTimer: null,
    };
    this.privateRooms.set(code, room);
    this.privateBySocket.set(socket.id, code);
    this.refreshPrivateExpiry(room);
    socket.emit('PRIVATE_ROOM_JOINED', { code });
    this.broadcastPrivateLobby(code);
  }

  joinPrivateRoom(
    socket: Socket,
    rawCode: string,
    playerName: string,
    weakWords: string[] = [],
    charIdx = 0,
  ) {
    const code = (rawCode || '').toUpperCase().trim();
    const room = this.privateRooms.get(code);
    if (!room) {
      socket.emit('PRIVATE_ROOM_ERROR', { reason: 'not_found' });
      return;
    }
    if (room.members.length >= MAX_PLAYERS) {
      socket.emit('PRIVATE_ROOM_ERROR', { reason: 'full' });
      return;
    }
    if (this.privateBySocket.has(socket.id)) return;
    const entry: QueueEntry = {
      socket,
      playerName,
      ready: false,
      weakWords,
      charIdx,
    };
    room.members.push(entry);
    this.privateBySocket.set(socket.id, room.code);
    this.refreshPrivateExpiry(room);
    socket.emit('PRIVATE_ROOM_JOINED', { code: room.code });
    this.broadcastPrivateLobby(room.code);
  }

  private uniqueCode(): string {
    for (let i = 0; i < 50; i++) {
      const c = generateCode();
      if (!this.privateRooms.has(c)) return c;
    }
    return generateCode(); // collision odds vanishingly small
  }

  private refreshPrivateExpiry(room: PrivateRoomState) {
    if (room.expiryTimer) clearTimeout(room.expiryTimer);
    room.expiryTimer = setTimeout(() => {
      this.disposePrivate(room.code);
    }, PRIVATE_ROOM_IDLE_MS);
  }

  private disposePrivate(code: string) {
    const room = this.privateRooms.get(code);
    if (!room) return;
    if (room.expiryTimer) clearTimeout(room.expiryTimer);
    for (const m of room.members) {
      this.privateBySocket.delete(m.socket.id);
      m.socket.emit('PRIVATE_ROOM_ERROR', { reason: 'expired' });
    }
    this.privateRooms.delete(code);
  }

  private broadcastPrivateLobby(code: string) {
    const room = this.privateRooms.get(code);
    if (!room) return;
    for (const entry of room.members) {
      entry.socket.emit('LOBBY_UPDATE', {
        players: room.members.map((m) => ({
          name: m.playerName,
          ready: m.ready,
          you: m.socket.id === entry.socket.id,
        })),
        count: room.members.length,
        capacity: MAX_PLAYERS,
        secondsLeft: 0,
        code,
        isPrivate: true,
      });
    }
  }

  private startPrivateGame(room: PrivateRoomState) {
    if (room.expiryTimer) clearTimeout(room.expiryTimer);
    const code = room.code;
    const entries = room.members;
    for (const m of entries) this.privateBySocket.delete(m.socket.id);
    this.privateRooms.delete(code);
    this.createRoom(entries);
  }

  // ── Public broadcast ──

  private broadcastLobby() {
    const secondsLeft = this.fillStartedAt
      ? Math.max(0, Math.ceil((FILL_TIMEOUT_MS - (Date.now() - this.fillStartedAt)) / 1000))
      : Math.ceil(FILL_TIMEOUT_MS / 1000);
    for (const entry of this.queue) {
      entry.socket.emit('LOBBY_UPDATE', {
        players: this.queue.map((e) => ({
          name: e.playerName,
          ready: e.ready,
          you: e.socket.id === entry.socket.id,
        })),
        count: this.queue.length,
        capacity: MAX_PLAYERS,
        secondsLeft,
        isPrivate: false,
      });
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
