export type ContentType = 'text' | 'file' | 'img';

export interface MsgSender {
  id: string;
  nick: string;
  name: string;
  lastName: string;
}

export interface Msg {
  id: number; // serial PK
  channelId: string; // uuid FK -> Channel
  senderId: string | null; // uuid FK -> User; null when the sender is deleted
  sender: MsgSender | null;
  createdAt: string; // ISO timestamp
  contentType: ContentType;
  textContent: string;
  cdnLink?: string | null;
}

export interface MsgMention {
  id: string; // uuid
  mentionedId: string; // uuid FK -> User
  msgId: number; // FK -> Msg.id
}
