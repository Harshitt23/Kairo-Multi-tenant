import { io, type Socket } from 'socket.io-client';
import type { ClientToServerEvents, ServerToClientEvents } from '@pm/types';
import { API_URL } from './api';

export type AppSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

let socket: AppSocket | null = null;

/** Lazily create the singleton realtime socket, authenticated with the JWT. */
export function getSocket(token: string): AppSocket {
  if (socket && socket.connected) return socket;
  socket?.disconnect();
  socket = io(`${API_URL}/realtime`, {
    transports: ['websocket'],
    auth: { token },
    autoConnect: true,
  });
  return socket;
}

export function disconnectSocket() {
  socket?.disconnect();
  socket = null;
}
