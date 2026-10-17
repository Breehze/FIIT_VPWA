import type { ContentType, Msg, User } from '@vpwa/shared';
import { DEFAULT_MESSAGES, getMockUserById, MOCK_USERS } from '@/mocks';

let storedMessages: Msg[] = structuredClone(DEFAULT_MESSAGES);

class ChatActionsService {
  getUsers(): User[] {
    return MOCK_USERS;
  }

  getUserById(id: string): User | undefined {
    return getMockUserById(id);
  }

  getAllMessages(): Msg[] {
    return storedMessages;
  }

  saveMessages(messages: Msg[]): void {
    storedMessages = messages;
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

  getActiveDrafts(channelMembers: User[], currentUserId?: string): ActiveDraft[] {
    const otherMembers = channelMembers.filter((m) => m.id !== currentUserId);

    const sampleDrafts: Record<string, string> = {
      diana:
        'Hey everyone! I just finished reviewing the lecture slides and I think we should double check all use cases before the final demo.',
      charlie: 'Working on the VPWA assignment right now, looks good so far!',
      bob: 'Anyone want to grab lunch after class?',
      alice: 'Hey team, does anyone have notes from the last tutorial?',
    };

    return otherMembers.map((m) => ({
      nick: m.nick,
      draftText:
        sampleDrafts[m.nick.toLowerCase()] ??
        `Hey everyone, working on the VPWA project right now!`,
    }));
  }
}

export interface ActiveDraft {
  nick: string;
  draftText: string;
}

export const chatActionsService = new ChatActionsService();
