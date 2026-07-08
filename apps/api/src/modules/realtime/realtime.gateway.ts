import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import {
  projectRoom,
  type ClientToServerEvents,
  type PresenceUser,
  type ServerToClientEvents,
} from '@pm/types';
import { PrismaService } from '../../common/prisma/prisma.service';
import type { Env } from '../../config/env';

interface SocketData {
  userId: string;
  name: string;
  avatarUrl: string | null;
  rooms: Set<string>;
}

type AppServer = Server<ClientToServerEvents, ServerToClientEvents, never, SocketData>;
type AppSocket = Socket<ClientToServerEvents, ServerToClientEvents, never, SocketData>;

/**
 * Live board updates + presence. Authenticates the socket from the handshake
 * `auth.token` (access JWT), scopes membership before letting a client join a
 * project room, and broadcasts mutations originating from the REST layer via
 * `emitToProject`.
 *
 * The socket.io Redis adapter (installed via RedisIoAdapter in main.ts) fans
 * room broadcasts out across every API instance, so `emitToProject` reaches
 * clients connected to other nodes. Presence below is still tracked in-memory
 * per node — see the note on `addPresence` for the cross-node caveat.
 */
@WebSocketGateway({
  cors: { origin: true, credentials: true },
  namespace: '/realtime',
})
export class RealtimeGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(RealtimeGateway.name);

  @WebSocketServer()
  server!: AppServer;

  // room -> userId -> presence (dedup multiple tabs by counting sockets)
  private presence = new Map<string, Map<string, PresenceUser & { sockets: number }>>();

  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService<Env, true>,
    private readonly prisma: PrismaService,
  ) {}

  async handleConnection(client: AppSocket): Promise<void> {
    try {
      const token =
        (client.handshake.auth?.token as string | undefined) ??
        client.handshake.headers.authorization?.replace('Bearer ', '');
      if (!token) throw new Error('missing token');

      const payload = await this.jwt.verifyAsync<{ sub: string }>(token, {
        secret: this.config.get('JWT_ACCESS_SECRET', { infer: true }),
      });

      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
        select: { id: true, name: true, avatarUrl: true },
      });
      if (!user) throw new Error('unknown user');

      client.data.userId = user.id;
      client.data.name = user.name;
      client.data.avatarUrl = user.avatarUrl;
      client.data.rooms = new Set();
    } catch (err) {
      this.logger.warn(`Rejecting socket ${client.id}: ${(err as Error).message}`);
      client.disconnect(true);
    }
  }

  handleDisconnect(client: AppSocket): void {
    for (const room of client.data.rooms ?? []) {
      this.leaveRoom(client, room);
    }
  }

  @SubscribeMessage('project:join')
  async onJoin(
    @ConnectedSocket() client: AppSocket,
    @MessageBody() body: { projectId: string },
  ): Promise<void> {
    // Verify the user may see this project within their org before joining.
    const project = await this.prisma.project.findUnique({
      where: { id: body.projectId },
      select: {
        organizationId: true,
        organization: { select: { memberships: { where: { userId: client.data.userId }, select: { id: true } } } },
      },
    });
    if (!project || project.organization.memberships.length === 0) {
      return; // silently ignore unauthorized joins
    }

    const room = projectRoom(project.organizationId, body.projectId);
    client.join(room);
    client.data.rooms.add(room);

    const me: PresenceUser = {
      userId: client.data.userId,
      name: client.data.name,
      avatarUrl: client.data.avatarUrl,
    };
    this.addPresence(room, me);

    client.emit('presence:sync', this.roomPresence(room));
    client.to(room).emit('presence:join', me);
  }

  @SubscribeMessage('project:leave')
  onLeave(@ConnectedSocket() client: AppSocket, @MessageBody() body: { projectId: string }): void {
    for (const room of client.data.rooms) {
      if (room.endsWith(`:project:${body.projectId}`)) this.leaveRoom(client, room);
    }
  }

  @SubscribeMessage('presence:cursor')
  onCursor(
    @ConnectedSocket() client: AppSocket,
    @MessageBody() body: { projectId: string; issueId: string | null },
  ): void {
    for (const room of client.data.rooms) {
      if (room.endsWith(`:project:${body.projectId}`)) {
        const entry = this.presence.get(room)?.get(client.data.userId);
        if (entry) {
          entry.cursor = body.issueId ? { issueId: body.issueId } : null;
          client.to(room).emit('presence:join', this.strip(entry));
        }
      }
    }
  }

  /** Called from the REST layer to fan a mutation out to a project's room. */
  emitToProject<E extends keyof ServerToClientEvents>(
    orgId: string,
    projectId: string,
    event: E,
    ...args: Parameters<ServerToClientEvents[E]>
  ): void {
    this.server?.to(projectRoom(orgId, projectId)).emit(event, ...args);
  }

  // --- presence helpers --------------------------------------------------
  // NOTE: presence lives in this node's memory. With the Redis adapter, board
  // *broadcasts* span nodes, but a presence roster reflects only locally
  // connected sockets. Full cross-node presence would move this map into Redis
  // (e.g. a per-room hash with socket TTLs); deferred as it's not needed yet.
  private addPresence(room: string, user: PresenceUser): void {
    const map = this.presence.get(room) ?? new Map();
    const existing = map.get(user.userId);
    if (existing) existing.sockets += 1;
    else map.set(user.userId, { ...user, sockets: 1 });
    this.presence.set(room, map);
  }

  private leaveRoom(client: AppSocket, room: string): void {
    client.leave(room);
    client.data.rooms.delete(room);
    const map = this.presence.get(room);
    const entry = map?.get(client.data.userId);
    if (entry) {
      entry.sockets -= 1;
      if (entry.sockets <= 0) {
        map!.delete(client.data.userId);
        this.server.to(room).emit('presence:leave', { userId: client.data.userId });
      }
    }
  }

  private roomPresence(room: string): PresenceUser[] {
    return [...(this.presence.get(room)?.values() ?? [])].map((e) => this.strip(e));
  }

  private strip(e: PresenceUser & { sockets: number }): PresenceUser {
    const { sockets: _sockets, ...rest } = e;
    return rest;
  }
}
