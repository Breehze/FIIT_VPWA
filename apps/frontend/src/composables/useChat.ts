import { ref, watch } from 'vue'
import type { Msg } from '@vpwa/shared'
import { chatActionsService } from '@/services/chatActions.service'
import { useChannels } from '@/composables/useChannels'

export function useChat(){
  const { activeChannel } = useChannels();

  const activeMsgs = ref<Msg[]>([]);
  const hasMoreMsgs = ref(true);

  watch(
    () => activeChannel.value?.id,
    (newChannelId) => {
      if(newChannelId) loadInitialMsgs();
    },
    {immediate : true}
  )

  function loadInitialMsgs() : void{
    const activeChannelId = activeChannel.value?.id ?? null;
    if(!activeChannelId){
      return;
    }
    activeMsgs.value = chatActionsService.getChannelMessages(activeChannelId,10);
    hasMoreMsgs.value = activeMsgs.value.length >= 10;
  }

  function loadFollowingMsgs() : void{
    const activeChannelId = activeChannel.value?.id ?? null;
    if(!activeMsgs.value.length || !activeChannelId){
      return;
    }

    const lastMsgShown = activeMsgs.value[0];
    if(!lastMsgShown){
      return;
    }

    const nextMsgs = chatActionsService.getChannelMessages(activeChannelId,10,lastMsgShown.id);
    activeMsgs.value.unshift(...nextMsgs);

    if(nextMsgs.length < 10){
      hasMoreMsgs.value = false;
    }
  }

  function getSender(senderId: string){
    return chatActionsService.getUserById(senderId);
  }

  return{
    activeMsgs,
    hasMoreMsgs,
    loadInitialMsgs,
    loadFollowingMsgs,
    getSender
  }
}
