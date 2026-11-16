import { reactive } from 'vue';
import type { TypingDraft } from '@/types/typing';

const typingDrafts = reactive<Record<string, Record<string, TypingDraft>>>({});

const expiryTimers = new Map<string, ReturnType<typeof setTimeout>>();
const DRAFT_TIMEOUT = 15000;

function removeTypingDraft(channelId: string, userId: string): void {
  const channelDrafts = typingDrafts[channelId];

  if (!channelDrafts) return;

  delete channelDrafts[userId];

  if (Object.keys(channelDrafts).length === 0) {
    delete typingDrafts[channelId];
  }
}

function updateTypingDraft(channelId: string, draft: TypingDraft): void {
  const key = `${channelId}:${draft.userId}`;

  const previousTimer = expiryTimers.get(key);

  if (previousTimer) {
    clearTimeout(previousTimer);
    expiryTimers.delete(key);
  }

  if (!draft.text) {
    removeTypingDraft(channelId, draft.userId);
    return;
  }

  if (!typingDrafts[channelId]) {
    typingDrafts[channelId] = {};
  }

  typingDrafts[channelId][draft.userId] = draft;

  expiryTimers.set(
    key,
    setTimeout(() => {
      removeTypingDraft(channelId, draft.userId);
      expiryTimers.delete(key);
    }, DRAFT_TIMEOUT),
  );
}

function clearTypingDrafts(): void {
  for (const timer of expiryTimers.values()) {
    clearTimeout(timer);
  }

  expiryTimers.clear();

  for (const channelId of Object.keys(typingDrafts)) {
    delete typingDrafts[channelId];
  }
}

export function useTyping() {
  return {
    typingDrafts,
    updateTypingDraft,
    clearTypingDrafts,
  };
}
