import type { Server, Socket } from 'socket.io';
import { nanoid } from 'nanoid';
import { Room } from './Room.js';

interface QueueEntry {
  socket: Socket;
  playerName: string;
}

const FILL_TIMEOUT_MS = 5000;

export class Matchmaker {
  private queue: QueueEntry[] = [];
  private rooms = new Map<string, Room>();
  private fillTimer: NodeJS.Timeout | null = null;
  private io: Server;

  constructor(io: Server) {
    this.io = io;
  }

  addPlayer(socket: Socket, playerName: string) {
    this.queue.push({ socket, playerName });
    socket.emit('MATCHMAKING', { position: this.queue.length });

    if (this.queue.length >= 4) {
      this.createRoom(this.queue.splice(0, 4));
    } else if (this.queue.length === 1 && !this.fillTimer) {
      this.fillTimer = setTimeout(() => this.fillAndStart(), FILL_TIMEOUT_MS);
    }
  }

  removePlayer(socketId: string) {
    this.queue = this.queue.filter((e) => e.socket.id !== socketId);
    if (this.queue.length === 0 && this.fillTimer) {
      clearTimeout(this.fillTimer);
      this.fillTimer = null;
    }
  }

  private fillAndStart() {
    this.fillTimer = null;
    if (this.queue.length === 0) return;
    const entries = this.queue.splice(0);
    this.createRoom(entries);
  }

  private createRoom(entries: QueueEntry[]) {
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

    // Start game after brief delay
    setTimeout(() => room.start(), 1500);

    // Reset fill timer for next batch
    if (this.queue.length > 0) {
      this.fillTimer = setTimeout(() => this.fillAndStart(), FILL_TIMEOUT_MS);
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
