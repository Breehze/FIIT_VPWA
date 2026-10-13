import { computed } from 'vue';
import { useChannels } from '@/composables/useChannels';
import { useAuth } from '@/composables/useAuth';
import { chatActionsService, type ActiveDraft } from '@/services/chatActions.service';

export function useTyping() {
  const { activeChannel, activeChannelMembers } = useChannels();
  const { currentUser } = useAuth();

  const activeTypers = computed<ActiveDraft[]>(() => {
    if (!activeChannel.value) return [];

    return chatActionsService.getActiveDrafts(
      activeChannelMembers.value,
      currentUser.value?.id,
    );
  });

  return { activeTypers };
}
