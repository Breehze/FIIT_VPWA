import { Socket } from '@rlanz/socket/client';
import type { Channel, Invite, Msg, UserState } from '@vpwa/shared';
import type { InvitedChannel } from '@/services/channelActions.service';

const API_URL = 'http://localhost:3333';

type SocketChannel = ReturnType<Socket['channel']>;
type PendingInvite = Invite & { channel: Channel };

class RealtimeSocketService {
  private socket: Socket | null = null;
  private userId: string | null = null;
  private userChannel: SocketChannel | null = null;
  private onlineChannel: SocketChannel | null = null;
  private channels = new Map<string, SocketChannel>();
  private retryTimer: ReturnType<typeof setTimeout> | null = null;
  private generation = 0;
  private attempts = 0;
  private onMessage: ((message: Msg) => void) | null = null;
  private onInvites: ((invites: InvitedChannel[]) => void) | null = null;
  private onPresence: ((channelId: string) => void) | null = null;
  private onOnlineUsers: ((userIds: string[]) => void) | null = null;
  private onStatus: ((userId: string, state: UserState) => void) | null = null;
  private onKickVote: ((channelId: string) => void) | null = null;
  private refreshChannels: (() => Promise<string[]>) | null = null;

  start(
    userId: string,
    callbacks: {
      refreshChannels: () => Promise<string[]>;
      onMessage: (message: Msg) => void;
      onInvites: (invites: InvitedChannel[]) => void;
      onPresence: (channelId: string) => void;
      onOnlineUsers: (userIds: string[]) => void;
      onStatus: (userId: string, state: UserState) => void;
      onKickVote: (channelId: string) => void;
    },
  ): void {
    this.stop();
    this.userId = userId;
    this.refreshChannels = callbacks.refreshChannels;
    this.onMessage = callbacks.onMessage;
    this.onInvites = callbacks.onInvites;
    this.onPresence = callbacks.onPresence;
    this.onOnlineUsers = callbacks.onOnlineUsers;
    this.onStatus = callbacks.onStatus;
    this.onKickVote = callbacks.onKickVote;
    void this.reconnect(this.generation);
  }

  stop(): void {
    this.generation++;
    this.onOnlineUsers?.([]);
    if (this.retryTimer) clearTimeout(this.retryTimer);
    this.retryTimer = null;
    this.socket?.disconnect();
    this.socket = null;
    this.userChannel = null;
    this.onlineChannel = null;
    this.channels.clear();
    this.userId = null;
    this.refreshChannels = null;
    this.onMessage = null;
    this.onInvites = null;
    this.onPresence = null;
    this.onOnlineUsers = null;
    this.onStatus = null;
    this.onKickVote = null;
    this.attempts = 0;
  }

  private scheduleRetry(generation: number): void {
    if (generation !== this.generation || this.retryTimer) return;
    const delay = Math.min(1000 * 2 ** this.attempts++, 5000);
    this.retryTimer = setTimeout(() => {
      this.retryTimer = null;
      void this.reconnect(generation);
    }, delay);
  }

  private async reconnect(generation: number): Promise<void> {
    if (generation !== this.generation || !this.userId || !this.refreshChannels) return;
    let socket: Socket | null = null;
    try {
      // Always verify membership before creating fresh subscription intent, including after a revoke.
      const channelIds = await this.refreshChannels();
      if (generation !== this.generation) return;

      socket = new Socket({ url: API_URL, autoReconnect: false });
      this.socket = socket;
      socket.on('disconnect', () => {
        if (generation !== this.generation || socket !== this.socket) return;
        this.socket = null;
        this.userChannel = null;
        this.onlineChannel = null;
        this.channels.clear();
        this.onOnlineUsers?.([]);
        this.scheduleRetry(generation);
      });
      await socket.connect();
      if (generation !== this.generation) {
        socket.disconnect();
        return;
      }
      this.attempts = 0;
      const onlineChannel = socket.channel('users/online');
      this.onlineChannel = onlineChannel;
      onlineChannel.here((users) => this.onOnlineUsers?.(users.map((user) => user.id)));
      onlineChannel.listen<{ userId: string; state: UserState }>(
        'user:status',
        ({ userId, state }) => this.onStatus?.(userId, state),
      );
      await onlineChannel.subscribe();
      if (generation !== this.generation || socket !== this.socket) return;
      const userChannel = socket.channel(`user/${this.userId}`);
      this.userChannel = userChannel;
      userChannel.listen('invite:created', () => void this.loadInvites());
      userChannel.listen('channels:changed', () => void this.refreshMemberships());
      await userChannel.subscribe();
      if (generation !== this.generation || socket !== this.socket) return;
      await this.loadInvites();
      await this.syncChannels(channelIds);
      // Changes during connection setup must not be lost.
      await this.refreshMemberships();
    } catch (error) {
      if (generation !== this.generation) return;
      console.error('Socket connection failed:', error);
      if (socket && this.socket === socket) socket.disconnect();
      this.scheduleRetry(generation);
    }
  }

  async refreshMemberships(): Promise<void> {
    if (!this.refreshChannels) return;
    try {
      await this.syncChannels(await this.refreshChannels());
    } catch (error) {
      console.error('Failed to synchronize channel subscriptions:', error);
    }
  }

  private async syncChannels(ids: string[]): Promise<void> {
    const socket = this.socket;
    if (!socket?.connected) return;
    const wanted = new Set(ids);
    for (const [id, channel] of this.channels) {
      if (!wanted.has(id)) {
        this.channels.delete(id);
        await socket.leave(channel.name);
      }
    }
    for (const id of wanted) {
      if (socket !== this.socket) return;
      if (this.channels.has(id)) continue;
      const channel = socket.channel(`channels/${id}`);
      channel.listen<Msg>('message:created', (message) => this.onMessage?.(message));
      channel.listen<{ channelId: string }>('kick:updated', ({ channelId }) =>
        this.onKickVote?.(channelId),
      );
      channel.here(() => this.onPresence?.(id));
      this.channels.set(id, channel);
      try {
        await channel.subscribe();
      } catch (error) {
        this.channels.delete(id);
        console.error(`Could not subscribe to channel ${id}:`, error);
      }
    }
  }

  async loadInvites(): Promise<void> {
    if (!this.userChannel?.active) return;
    try {
      const result = await this.userChannel.sendWithAck<undefined, { invites: PendingInvite[] }>(
        'invites:list',
      );
      this.onInvites?.(result.invites.map((invite) => ({ invite, channel: invite.channel })));
    } catch (error) {
      console.error('Failed to load invitations:', error);
    }
  }

  async sendMessage(channelId: string, text: string): Promise<Msg> {
    const channel = this.channels.get(channelId);
    if (!channel?.active) throw new Error('Not connected to this channel');
    return channel.sendWithAck<{ text: string }, Msg>('message:send', { text });
  }
}

export const realtimeSocketService = new RealtimeSocketService();
