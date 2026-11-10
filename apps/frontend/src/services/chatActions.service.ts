import type { Msg } from '@vpwa/shared';

const API_URL = 'http://localhost:3333';

export async function fetchChannelMessages(
  channelId: string,
  limit = 10,
  beforeId?: number,
): Promise<Msg[]> {
  const params = new URLSearchParams({ limit: String(limit) });
  if (beforeId !== undefined) params.set('beforeId', String(beforeId));
  const response = await fetch(
    `${API_URL}/channels/${encodeURIComponent(channelId)}/msgs?${params}`,
    { credentials: 'include', headers: { Accept: 'application/json' } },
  );
  if (!response.ok) throw new Error(`Failed to load messages (${response.status})`);
  return (await response.json()) as Msg[];
}
