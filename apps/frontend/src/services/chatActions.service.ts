import type { ContentType, Msg, User } from '@vpwa/shared';
import { DEFAULT_MESSAGES, getMockUserById, MOCK_USERS } from '@/mocks';

const STORAGE_KEY_MESSAGES = 'mock_messages';

class ChatActionsService {
  getUsers(): User[] {
    return MOCK_USERS;
  }

  getUserById(id: string): User | undefined {
    return getMockUserById(id);
  }

  getAllMessages(): Msg[] {
    const raw = localStorage.getItem(STORAGE_KEY_MESSAGES);
    if (!raw) {
      this.saveMessages(DEFAULT_MESSAGES);
      return DEFAULT_MESSAGES;
    }
    return JSON.parse(raw);
  }

  saveMessages(messages: Msg[]): void {
    localStorage.setItem(STORAGE_KEY_MESSAGES, JSON.stringify(messages));
  }

  getChannelMessages(channelId: string, limit = 10, beforeId?: number): Msg[] {
    const all = this.getAllMessages();
    let channelMsgs = all.filter((m) => m.channelId === channelId);

    channelMsgs.sort((a, b) => a.id - b.id);

    if (beforeId !== undefined) {
      channelMsgs = channelMsgs.filter((m) => m.id < beforeId);
    }

    if (channelMsgs.length <= limit) {
      return channelMsgs;
    }

    return channelMsgs.slice(channelMsgs.length - limit);
  }

  sendMessage(channelId: string, senderId: string, textContent: string, contentType: ContentType = 'text'): Msg {
    const all = this.getAllMessages();
    const nextId = all.reduce((max, m) => (m.id > max ? m.id : max), 0) + 1;

    const newMsg: Msg = {
      id: nextId,
      channelId,
      senderId,
      createdAt: new Date().toISOString(),
      contentType,
      textContent,
      cdnLink: null,
    };

    all.push(newMsg);
    this.saveMessages(all);
    return newMsg;
  }
}

export const chatActionsService = new ChatActionsService();
