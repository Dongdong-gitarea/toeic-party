import type { Server, Socket } from 'socket.io';
import { nanoid } from 'nanoid';
import { Room } from './Room.js';

interface QueueEntry {
  socket: Socket;
  playerName: string;
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

  addPlayer(socket: Socket, playerName: string) {
    this.queue.push({ socket, playerName });
    socket.emit('MATCHMAKING', { position: this.queue.length });

    if (this.queue.length >= MAX_PLAYERS) {
      this.broadcastLobby();
      this.createRoom(this.queue.splice(0, MAX_PLAYERS));
      return;
    }

    if (this.queue.length === 1 && !this.fillTimer) {
      this.fillStartedAt = Date.now();
      this.fillTimer = setTimeout(() => this.fillAndStart(), FILL_TIMEOUT_MS);
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
    const players = this.queue.map((e) => e.playerName);
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
    const entries = this.queue.splice(0);
    this.createRoom(entries);
  }

  private createRoom(entries: QueueEntry[]) {
    if (this.fillTimer) {
      clearTimeout(this.fillTimer);
      this.fillTimer = null;
      this.fillStartedAt = null;
    }

    const roomId = nanoid(8);
    const room = new Room(roomId, this.io, (id) => this.destroyRoom(id));

    // Add human players
    for (const entry of entries) {
      room.addPlayer(entry.socket.id, entry.playerName, false);
      entry.socket.join(roomId);
      entry.socket.data.roomId = roomId;
    }

    // Fill remaining slots with AI
    room.fillWithAI();

    this.rooms.set(roomId, room);

    // Notify all players
    this.io.to(roomId).emit('MATCH_FOUND', {
      roomId,
      players: room.getPlayerList(),
    });

    // Start game after showing "Match Found" for 2.5s
    setTimeout(() => room.start(), 2500);

    // Reset fill timer for next batch
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
