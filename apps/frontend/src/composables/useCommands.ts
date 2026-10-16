import { ref } from 'vue';
import { useChannels } from './useChannels';
import { useAuth } from './useAuth';

const showMemberList = ref(false);

export function useCommands() {
  const { currentUser } = useAuth();
  const { activeChannel, leaveChannel, joinChannel, deleteChannel, kickMember, revokeMember } =
    useChannels();

  function execCommand(commandStr: string): string | null {
    const [cmd, ...args] = commandStr.slice(1).trim().split(/\s+/);
    const channel = activeChannel.value;

    if (!cmd  || !currentUser.value) return null;

    if(cmd.toLowerCase() == 'join'){
      if (args[0]) joinChannel(args[0], args[1] === 'private' ? 'private' : 'public');
      return null
    }else if(!channel) return null;

    try {
      switch (cmd.toLowerCase()) {
        case 'join':
          break;
        case 'quit':
          deleteChannel(channel.id);
          break;
        case 'cancel':
          leaveChannel(channel.id);
          break;
        case 'invite':
          break;
        case 'revoke':
          if (args.length !== 1 || !args[0]) return 'Usage: /revoke nickName';
          revokeMember(channel.id, args[0]);
          break;
        case 'kick':
          if (args.length !== 1 || !args[0]) return 'Usage: /kick nickName';
          kickMember(channel.id, args[0]);
          break;
        case 'list':
          showMemberList.value = !showMemberList.value;
          break;
      }
    } catch (err) {
      return err instanceof Error ? err.message : 'Command failed';
    }
    return null;
  }

  return { showMemberList, execCommand };
}
