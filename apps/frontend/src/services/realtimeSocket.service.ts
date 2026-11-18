import { Socket } from '@rlanz/socket/client';
import type { Channel, Invite, Msg, UserState } from '@vpwa/shared';
import type { InvitedChannel } from '@/services/channelActions.service';
import type { TypingDraft } from '@/types/typing';

const API_URL = 'http://localhost:3333';

type SocketChannel = ReturnType<Socket['channel']>;
type PendingInvite = Invite & { channel: Channel };
type ChannelSnapshot = { channels: Channel[] };

interface RealtimeCallbacks {
  onChannels: (channels: Channel[]) => void;
  onReconnect: () => void;
  onMessage: (message: Msg) => void;
  onInvites: (invites: InvitedChannel[]) => void;
  onPresence: (channelId: string) => void;
  onOnlineUsers: (userIds: string[]) => void;
  onStatus: (userId: string, state: UserState) => void;
  onKickVote: (channelId: string) => void;
  onTyping: (channelId: string, draft: TypingDraft) => void;
}

class RealtimeSocketService {
  private socket: Socket | null = null;
  private userId: string | null = null;
  private userChannel: SocketChannel | null = null;
  private channels = new Map<string, SocketChannel>();
  private retryTimer: ReturnType<typeof setTimeout> | null = null;
  private generation = 0;
  private attempts = 0;
  private callbacks: RealtimeCallbacks | null = null;
  private hasConnected = false;

  start(userId: string, callbacks: RealtimeCallbacks): void {
    this.stop();
    this.userId = userId;
    this.callbacks = callbacks;
    void this.reconnect(this.generation);
  }

  stop(): void {
    this.generation++;
    if (this.retryTimer) clearTimeout(this.retryTimer);
    this.retryTimer = null;
    this.socket?.disconnect();
    this.clearConnection();
    this.userId = null;
    this.callbacks = null;
    this.hasConnected = false;
    this.attempts = 0;
  }

  private clearConnection(): void {
    this.socket = null;
    this.userChannel = null;
    this.channels.clear();
    this.callbacks?.onOnlineUsers([]);
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
    if (generation !== this.generation || !this.userId) return;
    let socket: Socket | null = null;
    try {
      socket = new Socket({ url: API_URL, autoReconnect: false });
      this.socket = socket;
      socket.on('disconnect', () => {
        if (socket !== this.socket) return;
        this.clearConnection();
        this.scheduleRetry(generation);
      });
      await socket.connect();
      if (socket !== this.socket) {
        socket.disconnect();
        return;
      }
      this.attempts = 0;
      await this.subscribeToPresence(socket);
      if (socket !== this.socket) return;
      await this.subscribeToUserUpdates(socket, this.userId);
      if (socket !== this.socket) return;
      await this.loadInvites();
      if (socket !== this.socket) return;
      if (this.hasConnected) this.callbacks?.onReconnect();
      this.hasConnected = true;
    } catch (error) {
      if (generation !== this.generation) return;
      console.error('Socket connection failed:', error);
      if (socket && this.socket === socket) socket.disconnect();
      this.scheduleRetry(generation);
    }
  }

  private async subscribeToPresence(socket: Socket): Promise<void> {
    const channel = socket.channel('users/online');
    channel.here((users) => this.callbacks?.onOnlineUsers(users.map((user) => user.id)));
    channel.listen<{ userId: string; state: UserState }>(
      'user:status',
      ({ userId, state }) => this.callbacks?.onStatus(userId, state),
    );
    await channel.subscribe();
  }

  private async subscribeToUserUpdates(socket: Socket, userId: string): Promise<void> {
    const channel = socket.channel(`user/${userId}`);
    this.userChannel = channel;
    channel.listen('invite:created', () => void this.loadInvites());

    let pendingSync = Promise.resolve();
    channel.listen<ChannelSnapshot>('channels:updated', ({ channels }) => {
      if (socket !== this.socket) return;
      this.callbacks?.onChannels(channels);
      const previousSync = pendingSync;
      pendingSync = this.applySubscriptions(previousSync, socket, channels);
    });

    await channel.subscribe();
    if (socket !== this.socket) return;
    await channel.sendWithAck('channels:sync');
    await pendingSync;
  }

  private async applySubscriptions(
    previousSync: Promise<void>,
    socket: Socket,
    channels: Channel[],
  ): Promise<void> {
    await previousSync;
    if (socket !== this.socket) return;
    try {
      await this.syncChannels(channels.map((channel) => channel.id));
    } catch (error) {
      console.error('Failed to synchronize channel subscriptions:', error);
    }
  }

  private async syncChannels(ids: string[]): Promise<void> {
    const socket = this.socket;
    if (!socket?.connected) return;
    const wanted = new Set(ids);
    for (const [id, channel] of this.channels) {
      if (socket !== this.socket) return;
      if (!wanted.has(id)) {
        this.channels.delete(id);
        await socket.leave(channel.name);
      }
    }
    for (const id of wanted) {
      if (socket !== this.socket) return;
      if (this.channels.has(id)) continue;
      await this.subscribeToChannel(socket, id);
    }
  }

  private async subscribeToChannel(socket: Socket, channelId: string): Promise<void> {
    const channel = socket.channel(`channels/${channelId}`);
    channel.listen<Msg>('message:created', (message) => this.callbacks?.onMessage(message));
    channel.listenForWhisper<TypingDraft>('typing', (draft) => {
      this.callbacks?.onTyping(channelId, draft);
    });
    channel.listen<{ channelId: string }>('kick:updated', ({ channelId }) =>
      this.callbacks?.onKickVote(channelId),
    );
    channel.here(() => this.callbacks?.onPresence(channelId));
    this.channels.set(channelId, channel);

    try {
      await channel.subscribe();
    } catch (error) {
      if (socket !== this.socket) return;
      if (this.channels.get(channelId) === channel) this.channels.delete(channelId);
      console.error(`Could not subscribe to channel ${channelId}:`, error);
    }
  }

  async loadInvites(): Promise<void> {
    const userChannel = this.userChannel;
    if (!userChannel?.active) return;
    try {
      const result = await userChannel.sendWithAck<undefined, { invites: PendingInvite[] }>(
        'invites:list',
      );
      if (userChannel !== this.userChannel) return;
      this.callbacks?.onInvites(
        result.invites.map((invite) => ({ invite, channel: invite.channel })),
      );
    } catch (error) {
      console.error('Failed to load invitations:', error);
    }
  }

  async sendMessage(channelId: string, text: string): Promise<Msg> {
    const channel = this.channels.get(channelId);
    if (!channel?.active) throw new Error('Not connected to this channel');
    return channel.sendWithAck<{ text: string }, Msg>('message:send', { text });
  }

  sendTypingDraft(channelId: string, draft: TypingDraft): void {
    const channel = this.channels.get(channelId);

    if (!channel?.active) return;

    channel.whisper('typing', draft);
  }
}

export const realtimeSocketService = new RealtimeSocketService();
