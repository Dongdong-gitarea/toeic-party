import { io, Socket } from 'socket.io-client';

function getBackendUrl(): string {
  if (process.env.NEXT_PUBLIC_WS_URL) return process.env.NEXT_PUBLIC_WS_URL;
  if (typeof window === 'undefined') return 'http://localhost:3001';
  // Use same hostname as the page (works for both localhost and LAN IP)
  return `http://${window.location.hostname}:3001`;
}

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    socket = io(getBackendUrl(), {
      transports: ['websocket'],
      autoConnect: false,
    });
  }
  return socket;
}
